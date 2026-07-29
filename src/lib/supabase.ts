import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
// @ts-ignore
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean the URL of any trailing paths (like /rest/v1), trailing slashes, or accidental whitespace
let cleanUrl = rawUrl.trim();
if (cleanUrl) {
  try {
    const parsed = new URL(cleanUrl);
    cleanUrl = parsed.origin;
  } catch (e) {
    cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }
}
const supabaseUrl = cleanUrl;
const supabaseAnonKey = rawKey.trim();

// A helper to determine if Supabase is properly configured with a valid URL and Anon Key.
// This is essential so the app doesn't crash on initial load if environment variables are blank.
export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-supabase') &&
  !supabaseUrl.includes('example.com')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
