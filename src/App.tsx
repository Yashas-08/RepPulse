import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Sparkles, AlertCircle, WifiOff } from 'lucide-react';
import { ScreenType } from './types';
import { PhoneFrame } from './components/PhoneFrame';
import { Navbar } from './components/UI';
import { BottomNavigation } from './components/Navigation';
import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { WorkoutHistoryScreen } from './screens/WorkoutHistoryScreen';
import { NutritionScreen } from './screens/NutritionScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { ActivityCalendarScreen } from './screens/ActivityCalendarScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const isTouchCapableDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const hasNoHover = window.matchMedia('(hover: none)').matches;
  const hasTouchPoints = navigator.maxTouchPoints > 0;

  return hasCoarsePointer || hasNoHover || hasTouchPoints;
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('splash');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lockedBanner, setLockedBanner] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [shouldRenderPhoneFrame, setShouldRenderPhoneFrame] = useState(() => !isTouchCapableDevice());

  // Monitor network connectivity changes & handle unhandled network rejections
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const msg = typeof reason === 'string' ? reason : reason?.message || '';
      const name = reason?.name || '';

      if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Load failed') ||
        name === 'TypeError'
      ) {
        console.warn('Network request failed (handled gracefully and offline cache used):', reason);
        event.preventDefault(); // Prevent standard error propagation
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = event?.message || '';
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Load failed')
      ) {
        console.warn('Global network error caught gracefully:', msg);
        event.preventDefault();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueries = [
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(hover: none)'),
    ];

    const updateDeviceLayout = () => {
      setShouldRenderPhoneFrame(!isTouchCapableDevice());
    };

    updateDeviceLayout();

    mediaQueries.forEach((mediaQuery) => {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', updateDeviceLayout);
      } else {
        mediaQuery.addListener(updateDeviceLayout);
      }
    });

    window.addEventListener('resize', updateDeviceLayout);

    return () => {
      mediaQueries.forEach((mediaQuery) => {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', updateDeviceLayout);
        } else {
          mediaQuery.removeListener(updateDeviceLayout);
        }
      });
      window.removeEventListener('resize', updateDeviceLayout);
    };
  }, []);

  // Helper to determine if we are in the primary app section (requiring bottom navigation)
  const isAppSection = [
    'dashboard',
    'workout',
    'nutrition',
    'progress',
    'calendar',
    'friends',
    'profile',
    'settings',
    'notifications',
  ].includes(activeScreen);

  // Initial session check & Authentication State Listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // If Supabase is not configured, we let the user preview the login screen after splash
      const timer = setTimeout(() => {
        setIsCheckingSession(false);
        setActiveScreen('login');
      }, 1500);
      return () => clearTimeout(timer);
    }

    const checkInitialSession = async () => {
      const startTime = Date.now();
      let targetScreen: ScreenType = 'login';
      try {
        if (!supabase) {
          throw new Error('Supabase client is not available');
        }

        const sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null }, error: null }));
        const session = sessionRes?.data?.session;
        if (session?.user) {
          setCurrentUser(session.user);
          targetScreen = 'dashboard';
        } else {
          setCurrentUser(null);
          targetScreen = 'login';
        }
      } catch (err) {
        console.warn('Network issue during initial session check:', err);
        targetScreen = 'login';
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1500 - elapsedTime);
        setTimeout(() => {
          setActiveScreen(targetScreen);
          setIsCheckingSession(false);
        }, remainingTime);
      }
    };

    checkInitialSession();

    // Set up the realtime Auth state listener
    let subscription: any = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        const user = session?.user || null;
        setCurrentUser(user);

        if (event === 'SIGNED_IN' && user) {
          setActiveScreen('dashboard');
        } else if (event === 'SIGNED_OUT') {
          setActiveScreen('login');
        }
      });
      subscription = data?.subscription;
    } catch (err) {
      console.error('Error setting up auth state listener:', err);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Protected Routes
  const handleScreenChange = (screen: ScreenType) => {
    // If they are not logged in, force protect and redirect to login
    if (!currentUser && ['dashboard', 'workout', 'nutrition', 'progress', 'calendar', 'friends', 'profile', 'settings'].includes(screen)) {
      setActiveScreen('login');
      return;
    }

    setActiveScreen(screen);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveScreen('login');
  };

  const handleGuestLogin = () => {
    const guestUser = {
      id: 'guest',
      email: 'guest@reppulse.com',
      user_metadata: {
        full_name: 'Guest Athlete'
      }
    };
    setCurrentUser(guestUser);
    setActiveScreen('dashboard');
  };

  // Render active screen contents
  const renderScreen = () => {
    if (isCheckingSession) {
      return <SplashScreen />;
    }

    switch (activeScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'login':
        return <LoginScreen onNavigate={handleScreenChange} onGuestLogin={handleGuestLogin} />;
      case 'signup':
        return <SignUpScreen onNavigate={handleScreenChange} onGuestLogin={handleGuestLogin} />;
      case 'dashboard':
        return <DashboardScreen currentUser={currentUser} onLogout={handleLogout} onNavigate={handleScreenChange} />;
      case 'workout':
        return <WorkoutScreen currentUser={currentUser} onNavigate={handleScreenChange} />;
      case 'workout_history':
        return <WorkoutHistoryScreen currentUser={currentUser} onNavigate={handleScreenChange} />;
      case 'nutrition':
        return <NutritionScreen currentUser={currentUser} />;
      case 'progress':
        return <ProgressScreen currentUser={currentUser} onNavigate={handleScreenChange} />;
      case 'calendar':
        return <ActivityCalendarScreen currentUser={currentUser} onNavigate={handleScreenChange} onBack={() => handleScreenChange('dashboard')} />;
      case 'friends':
        return <FriendsScreen currentUser={currentUser} onBack={() => handleScreenChange('profile')} />;
      case 'profile':
        return <ProfileScreen currentUser={currentUser} onNavigate={handleScreenChange} />;
      case 'settings':
        return <SettingsScreen currentUser={currentUser} onBack={() => handleScreenChange('profile')} />;
      case 'notifications':
        return <NotificationsScreen currentUser={currentUser} onBack={() => handleScreenChange('dashboard')} onNavigate={handleScreenChange} />;
      case 'notfound':
        return <NotFoundScreen />;
      default:
        return <NotFoundScreen />;
    }
  };

  const appContent = (
    <>
      {/* MAIN ACTIVE VIEW PORT */}
      <div className={`flex-1 flex flex-col relative overflow-hidden h-full w-full transition-colors duration-500 ${(activeScreen === 'splash' || isCheckingSession) ? 'bg-black' : 'bg-white'}`}>
        {/* Global Offline Recovery Banner */}
        <AnimatePresence>
          {isOffline && !isCheckingSession && activeScreen !== 'splash' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-neutral-950 text-white px-5 py-2 z-50 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between shrink-0"
            >
              <div className="flex items-center gap-2">
                <WifiOff size={12} className="text-white animate-pulse" />
                <span>You're offline. Some features may not be available.</span>
              </div>
              <span className="text-[8px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded uppercase font-mono">
                Offline
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`flex-1 flex flex-col h-full w-full overflow-hidden transition-colors duration-500 ${(activeScreen === 'splash' || isCheckingSession) ? 'bg-black' : 'bg-white'}`}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>

        {/* Floating locked banner alert */}
        <AnimatePresence>
          {lockedBanner && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-4 left-4 right-4 bg-neutral-900 text-white p-3 rounded-xl shadow-lg border border-neutral-800 z-50 text-[11px] leading-relaxed flex items-start gap-2"
            >
              <AlertCircle size={14} className="text-white shrink-0 mt-0.5" />
              <span>{lockedBanner}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* APP VIEWPORT BOTTOM BAR (Only displayed when inside the logged-in App section) */}
      {isAppSection && !isCheckingSession && (
        <BottomNavigation
          activeTab={activeScreen}
          onTabChange={handleScreenChange}
          onLogout={handleLogout}
        />
      )}
    </>
  );

  return shouldRenderPhoneFrame ? (
    <PhoneFrame activeScreen={activeScreen} onScreenChange={handleScreenChange}>
      {appContent}
    </PhoneFrame>
  ) : (
    <div className="min-h-screen w-full flex flex-col bg-neutral-950">
      {appContent}
    </div>
  );
}
