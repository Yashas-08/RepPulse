import { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuthCallbackResult {
  success: boolean;
  user: User | null;
  error: string | null;
}

/**
 * Checks whether the current window URL represents an incoming Supabase OAuth callback.
 * Catches /auth/callback path, authorization codes (?code=...), or hash fragments (#access_token=... / #error=...).
 */
export function isOAuthCallback(customUrl?: string): boolean {
  if (customUrl) {
    return (
      customUrl.includes('/auth/callback') ||
      customUrl.includes('code=') ||
      customUrl.includes('access_token=') ||
      customUrl.includes('error=')
    );
  }
  if (typeof window === 'undefined') return false;
  const hasCallbackPath = window.location.pathname.includes('/auth/callback');
  const searchParams = new URLSearchParams(window.location.search);
  const hasCode = searchParams.has('code');
  const hasSearchError = searchParams.has('error') || searchParams.has('error_description');
  const hash = window.location.hash ? window.location.hash.substring(1) : '';
  const hashParams = new URLSearchParams(hash);
  const hasHashTokens = hashParams.has('access_token');
  const hasHashError = hashParams.has('error') || hashParams.has('error_description');

  return hasCallbackPath || hasCode || hasSearchError || hasHashTokens || hasHashError;
}

/**
 * Cleans OAuth parameters from the browser address bar without triggering a full page reload.
 */
export function cleanAuthUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanPath = window.location.pathname.includes('/auth/callback') ? '/' : window.location.pathname;
    window.history.replaceState({}, document.title, cleanPath);
  } catch (e) {
    console.warn('Failed to clean OAuth URL state:', e);
  }
}

/**
 * Initiates Google OAuth authentication using Supabase.
 * Supports both web browser redirects and native Android deep-linking via system browser/Chrome Custom Tabs.
 */
export async function signInWithGoogle(options?: { redirectTo?: string }): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      error: new Error('Supabase is not configured yet. Please check your environment variables.'),
    };
  }

  try {
    const isNative = Capacitor.isNativePlatform();
    const defaultRedirect = isNative
      ? 'com.yashas.reppulse://auth/callback'
      : `${window.location.origin}/auth/callback`;
    const redirectTo = options?.redirectTo || defaultRedirect;

    if (isNative) {
      // In Capacitor native app: obtain OAuth URL without in-webview redirect to avoid Google's disallowed_useragent block
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        return { error };
      }

      if (data?.url) {
        await Browser.open({ url: data.url, windowName: '_self' });
      }

      return { error: null };
    } else {
      // Standard web browser flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    }
  } catch (err: any) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// Module-level lock to prevent concurrent or duplicate code exchanges (e.g. React 19 StrictMode double invocation)
let activeCallbackPromise: Promise<AuthCallbackResult> | null = null;

/**
 * Handles the OAuth callback redirect:
 * - Checks for OAuth error parameters (including user cancellations)
 * - Exchanges PKCE authorization code for a session
 * - Sets implicit token sessions if returned in hash
 * - Syncs/ensures the user profile without duplicating or overwriting existing user records
 * - Cleans the browser URL
 */
export async function handleAuthCallback(customUrl?: string): Promise<AuthCallbackResult> {
  if (activeCallbackPromise) {
    return activeCallbackPromise;
  }

  activeCallbackPromise = (async (): Promise<AuthCallbackResult> => {
    if (!isSupabaseConfigured || !supabase) {
      cleanAuthUrl();
      if (Capacitor.isNativePlatform()) {
        Browser.close().catch(() => {});
      }
      return {
        success: false,
        user: null,
        error: 'Supabase is not configured.',
      };
    }

    try {
      let searchParams: URLSearchParams;
      let hashParams: URLSearchParams;

      if (customUrl) {
        try {
          const parsed = new URL(customUrl);
          searchParams = parsed.searchParams;
          const hash = parsed.hash ? parsed.hash.substring(1) : '';
          hashParams = new URLSearchParams(hash);
        } catch {
          const [baseAndQuery, hashPart] = customUrl.split('#');
          const queryPart = baseAndQuery.includes('?') ? baseAndQuery.split('?')[1] : '';
          searchParams = new URLSearchParams(queryPart);
          hashParams = new URLSearchParams(hashPart || '');
        }
      } else {
        searchParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash ? window.location.hash.substring(1) : '';
        hashParams = new URLSearchParams(hash);
      }

      // If running on native platform, ensure the browser window/custom tab closes
      if (Capacitor.isNativePlatform()) {
        Browser.close().catch(() => {});
      }

      // 1. Detect OAuth errors
      const errorParam = searchParams.get('error') || hashParams.get('error');
      const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');

      if (errorParam || errorDesc) {
        cleanAuthUrl();
        const descLower = (errorDesc || '').toLowerCase();
        if (errorParam === 'access_denied' || descLower.includes('cancel') || descLower.includes('denied')) {
          return {
            success: false,
            user: null,
            error: 'Google sign-in was cancelled.',
          };
        }
        return {
          success: false,
          user: null,
          error: errorDesc || errorParam || 'Google authentication failed. Please try again.',
        };
      }

      // 2. PKCE Authorization Code Exchange
      const code = searchParams.get('code');
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          // If code was already consumed (e.g. rapid re-render), check if session is already active
          const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (sessionData?.session?.user) {
            await ensureUserProfile(sessionData.session.user);
            cleanAuthUrl();
            return {
              success: true,
              user: sessionData.session.user,
              error: null,
            };
          }

          cleanAuthUrl();
          const msg = error.message.toLowerCase();
          if (msg.includes('network') || msg.includes('fetch')) {
            return {
              success: false,
              user: null,
              error: 'Network connection error while connecting to authentication server.',
            };
          }
          return {
            success: false,
            user: null,
            error: error.message || 'Failed to exchange authorization code for session.',
          };
        }

        if (data?.session?.user) {
          await ensureUserProfile(data.session.user);
          cleanAuthUrl();
          return {
            success: true,
            user: data.session.user,
            error: null,
          };
        }
      }

      // 3. Implicit Grant Tokens in hash fragment
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || '';
      if (accessToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          cleanAuthUrl();
          return {
            success: false,
            user: null,
            error: error.message || 'Failed to establish session from tokens.',
          };
        }

        if (data?.session?.user) {
          await ensureUserProfile(data.session.user);
          cleanAuthUrl();
          return {
            success: true,
            user: data.session.user,
            error: null,
          };
        }
      }

      // 4. Fallback check: Active session already present in client
      const { data: existingSession } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (existingSession?.session?.user) {
        await ensureUserProfile(existingSession.session.user);
        cleanAuthUrl();
        return {
          success: true,
          user: existingSession.session.user,
          error: null,
        };
      }

      cleanAuthUrl();
      return {
        success: false,
        user: null,
        error: 'No active session or authorization code found in callback.',
      };
    } catch (err: any) {
      cleanAuthUrl();
      const rawMsg = err?.message || '';
      if (rawMsg.toLowerCase().includes('network') || rawMsg.toLowerCase().includes('fetch')) {
        return {
          success: false,
          user: null,
          error: 'Network connection failed while verifying Google sign-in. Please try again.',
        };
      }
      return {
        success: false,
        user: null,
        error: rawMsg || 'An unexpected error occurred during Google sign-in.',
      };
    } finally {
      activeCallbackPromise = null;
    }
  })();

  return activeCallbackPromise;
}

/**
 * Ensures a user profile exists without creating duplicates or overwriting existing user data.
 * Retrieves ID, email, name, and avatar from Google metadata when initializing new profiles.
 */
export async function ensureUserProfile(user: any): Promise<void> {
  if (!user || !user.id) return;

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Athlete';

  const username =
    user.user_metadata?.preferred_username ||
    user.email?.split('@')[0] ||
    'athlete';

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  // 1. Supabase profiles database table
  if (supabase) {
    try {
      const { data: existing, error: selectError } = await supabase
        .from('profiles')
        .select('id, full_name, profile_image, username')
        .eq('id', user.id)
        .maybeSingle();

      if (!selectError && existing) {
        // User record already exists: PRESERVE all existing custom profile data
        // Only fill in profile_image if user doesn't have an avatar set and Google provides one
        if (!existing.profile_image && avatarUrl) {
          await supabase
            .from('profiles')
            .update({
              profile_image: avatarUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        }
      } else if (!existing) {
        // Insert new profile record with Google profile details
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: fullName,
            username: username,
            profile_image: avatarUrl,
            goal: 'General Fitness',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }
    } catch (dbErr) {
      console.warn('Profile table sync warning (handled gracefully):', dbErr);
    }
  }

  // 2. LocalStorage profile backup
  try {
    const localKey = `reppulse_profile_${user.id}`;
    const stored = localStorage.getItem(localKey);
    if (!stored) {
      const initialProfile = {
        id: user.id,
        email: user.email || '',
        full_name: fullName,
        username: username,
        profile_image: avatarUrl,
        age: '',
        gender: '',
        height: '',
        weight: '',
        goal: 'General Fitness',
      };
      localStorage.setItem(localKey, JSON.stringify(initialProfile));
    }
  } catch (localErr) {
    console.warn('Local profile cache warning:', localErr);
  }
}

/**
 * Signs the user out of Supabase and clears any active state.
 */
export async function signOut(): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: null };
  }
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error || null };
  } catch (err: any) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

