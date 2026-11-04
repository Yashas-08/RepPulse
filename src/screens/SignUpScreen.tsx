import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../components/UI';
import { Logo } from '../components/Logo';
import { ScreenType } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { signInWithGoogle } from '../services/authService';

// Custom SafeAreaView to emulate React Native safe layout container
const SafeAreaView: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`flex-1 flex flex-col bg-white h-full w-full ${className}`}>
      {children}
    </div>
  );
};

// Custom ScrollView to emulate React Native scrolling view container with flexible min-height layout
const ScrollView: React.FC<{ children: React.ReactNode; className?: string; contentContainerClassName?: string }> = ({
  children,
  className = '',
  contentContainerClassName = ''
}) => {
  return (
    <div className={`flex-1 overflow-y-auto overflow-x-hidden scroll-smooth ${className}`}>
      <div className={`flex flex-col min-h-full ${contentContainerClassName}`}>
        {children}
      </div>
    </div>
  );
};

interface SignUpScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onGuestLogin?: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigate, onGuestLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const getReadableError = (msg: any): string => {
    if (!msg) return '';
    if (typeof msg !== 'string') {
      try {
        return msg.message || JSON.stringify(msg);
      } catch (e) {
        return 'An error occurred';
      }
    }
    return msg.trim();
  };

  const handleGoogleSignUp = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase is not configured yet. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your project settings.');
      return;
    }

    setGoogleLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        const rawMsg = error.message || '';
        if (rawMsg.toLowerCase().includes('fetch') || rawMsg.toLowerCase().includes('network')) {
          setErrorMsg('Unable to connect to Google authentication server. Please check your network connection.');
        } else {
          setErrorMsg(rawMsg || 'Failed to initialize Google Sign-In. Please try again.');
        }
        setGoogleLoading(false);
      }
    } catch (err: any) {
      const rawMsg = err?.message || '';
      setErrorMsg(rawMsg || 'An unexpected error occurred during Google Sign-In.');
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Native validation checks
    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter a password');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase is not configured yet. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your project settings.');
      return;
    }

    setLoading(true);

    try {
      // Sign up the user in Supabase, specifying the name inside user metadata
      const { data, error } = await supabase!.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Check if session was immediately created (depends on Supabase email confirmation settings)
        if (data.session) {
          setSuccessMsg('Account created successfully!');
        } else {
          setSuccessMsg('Sign up successful! Please check your email inbox to confirm registration.');
          // Even if email confirmation is required, let's navigate to Login after a short delay
          setTimeout(() => {
            onNavigate('login');
          }, 3000);
        }
      }
    } catch (err: any) {
      const rawMsg = err?.message || '';
      if (rawMsg.toLowerCase().includes('fetch') || rawMsg.toLowerCase().includes('network')) {
        setErrorMsg('Unable to connect to authentication server. Please check your network connection.');
      } else {
        setErrorMsg(rawMsg || 'An unexpected error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="select-none">
      <ScrollView contentContainerClassName="px-6 pt-4 pb-5 justify-between">
        <div className="flex flex-col mt-1">
          
          {/* Brand Logo Header */}
          <div className="flex justify-start mb-4 -ml-3">
            <Logo size={120} variant="light" showText={true} />
          </div>
          
          {/* Status banner */}
          {!isSupabaseConfigured && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-left">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">
                  Configuration Required
                </span>
                <p className="text-[11px] text-amber-700 leading-normal">
                  Supabase is not configured. Add your credentials in AI Studio to enable active auth databases.
                </p>
              </div>
            </div>
          )}

          {/* Header Texts */}
          <div className="mb-5 text-left">
            <h2 className="font-display font-bold text-3xl text-neutral-900 tracking-tight">
              Create Account
            </h2>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Register today to lock in your active fitness streak indices and share records.
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && getReadableError(errorMsg) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3.5 bg-neutral-50 border border-neutral-200 text-neutral-900 rounded-xl text-xs flex items-center gap-2.5"
            >
              <AlertCircle size={15} className="text-neutral-900 shrink-0" />
              <span className="font-medium text-left">{getReadableError(errorMsg)}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3.5 bg-neutral-50 border border-neutral-200 text-neutral-900 rounded-xl text-xs flex flex-col gap-1 text-left"
            >
              <span className="font-semibold text-neutral-900">✓ Registration Active</span>
              <span className="text-[11px] text-neutral-600 leading-relaxed">{successMsg}</span>
            </motion.div>
          )}

          {/* Inputs Form */}
          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
            <Input
              label="Full Name"
              type="text"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              icon={<User size={16} />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              icon={<Mail size={16} />}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              icon={<Lock size={16} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              required
            />

            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              icon={<Lock size={16} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              required
            />

            {/* Trigger Create Button */}
            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={loading}
              className="mt-4 flex items-center justify-center gap-2"
              type="submit"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registering...
                </span>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={15} />
                </>
              )}
            </Button>

            {/* Skip & Continue as Guest (Resilience Bypass) */}
            {onGuestLogin && (
              <button
                type="button"
                onClick={onGuestLogin}
                className="w-full mt-3 h-[52px] bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-2xl text-sm font-semibold hover:bg-neutral-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                Skip & Continue as Guest
              </button>
            )}
          </form>

          {/* Divider UI */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-[1px] bg-border-cool" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              or
            </span>
            <div className="flex-1 h-[1px] bg-border-cool" />
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading || googleLoading}
            className="w-full h-[52px] bg-white border border-border-cool text-primary-text rounded-2xl text-sm font-semibold hover:bg-neutral-50 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="flex items-center gap-2 text-neutral-600">
                <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
                Connecting to Google...
              </span>
            ) : (
              <>
                {/* Simple Google SVG Icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15 1 12 1 7.24 1 3.2 3.73 1.24 7.72l3.88 3c.92-2.76 3.52-4.68 6.88-4.68z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.75-4.87 3.75-8.48z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.12 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28l-3.88-3C.44 8.24 0 10.07 0 12s.44 3.76 1.24 5.28l3.88-3z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.67-2.32 1.08-3.9 1.08-3.36 0-5.96-1.92-6.88-4.68l-3.88 3C3.2 20.27 7.24 23 12 23z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Navigation Section below Create Account button */}
          <div className="text-center mt-5">
            <p className="text-xs text-neutral-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-bold text-neutral-900 hover:underline cursor-pointer transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </ScrollView>
    </SafeAreaView>
  );
};
