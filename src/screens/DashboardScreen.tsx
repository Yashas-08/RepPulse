import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, LogOut, Check, Calendar } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { Workout } from '../types';
import {
  DashboardAnalyticsService,
  RedesignedDashboardData,
} from '../services/dashboardAnalyticsService';
import { DashboardService } from '../services/dashboardService';
import { WorkoutSessionService } from '../services/workoutSessionService';
import { useDashboard } from '../hooks/useDashboard';
import { GreetingSection } from '../components/dashboard/GreetingSection';
import { PrimaryWorkoutCard } from '../components/dashboard/PrimaryWorkoutCard';
import { QuickSummarySection } from '../components/dashboard/QuickSummarySection';
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';

interface DashboardScreenProps {
  currentUser?: SupabaseUser | null;
  onLogout: () => void;
  onNavigate?: (screen: any) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ currentUser, onLogout, onNavigate }) => {
  const {
    displayName,
    email,
    showProfileMenu,
    setShowProfileMenu,
    greeting,
    unreadNotifications,
    currentWeight,
    dashboardData,
    dataLoading,
    dashboardError,
    hasActiveSession,
    workouts,
    setWorkouts,
    workoutsLoading,
    toastMessage,
    refreshing,
    pullDistance,
    refreshError,
    setRefreshError,
    containerRef,
    fetchDashboardAnalytics,
    handleRefresh,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
    triggerToast,
  } = useDashboard({ currentUser });

  const [loading, setLoading] = useState(false);

  const handleToggleComplete = async (workout: Workout) => {
    const updatedStatus = !workout.completed;
    const nowStr = new Date().toISOString();
    const completedAtVal = updatedStatus ? nowStr : null;

    // Local state update
    const updatedWorkouts = workouts.map(w => 
      w.id === workout.id ? { ...w, completed: updatedStatus, completed_at: completedAtVal, updated_at: nowStr } : w
    );
    setWorkouts(updatedWorkouts);

    // Save locally
    try {
      const { data: { user } } = await supabase ? await supabase.auth.getUser() : { data: { user: null } };
      const userId = user?.id || 'guest';
      localStorage.setItem(`reppulse_workouts_${userId}`, JSON.stringify(updatedWorkouts));
    } catch (err) {
      console.error(err);
    }

    // Save to Supabase
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('workouts')
            .update({ 
              completed: updatedStatus, 
              completed_at: completedAtVal,
              updated_at: nowStr 
            })
            .eq('id', workout.id)
            .eq('user_id', user.id);

          if (error) {
            console.warn('Completed_at column might be missing, retrying standard complete update. Error:', error);
            const { error: retryError } = await supabase
              .from('workouts')
              .update({ 
                completed: updatedStatus, 
                updated_at: nowStr 
              })
              .eq('id', workout.id)
              .eq('user_id', user.id);

            if (retryError) {
              console.error('Error updating completion:', retryError);
            }
          }
        }
      } catch (err) {
        console.error('Error in handleToggleComplete:', err);
      }
    }

    // Trigger global event so other components refresh
    window.dispatchEvent(new Event('reppulse_workouts_updated'));
    triggerToast(updatedStatus ? 'Workout completed!' : 'Workout status reset');
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
      onLogout();
    }
  };

  const todayStr = new Date().toLocaleDateString('sv-SE');
  const todayWorkouts = React.useMemo(() => {
    return workouts.filter(w => {
      const schedDate = w.scheduled_date || w.workout_date || (w.created_at ? w.created_at.split('T')[0] : '');
      return schedDate === todayStr;
    });
  }, [workouts, todayStr]);

  const completedWorkoutsThisWeek = React.useMemo(() => {
    const completedWorkouts = workouts.filter(w => w.completed);
    
    // Get start of current calendar week (Sunday at 00:00:00 local time)
    const now = new Date();
    const todayNum = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - todayNum);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return completedWorkouts.filter(w => {
      const compDateStr = w.completed_at || w.updated_at || w.created_at;
      if (!compDateStr) return false;
      const compDate = new Date(compDateStr);
      return compDate >= startOfWeek && compDate <= endOfWeek;
    }).length;
  }, [workouts]);

  const workoutStreak = React.useMemo(() => {
    const completedWorkouts = workouts.filter(w => w.completed);
    if (completedWorkouts.length === 0) return 0;

    const localDates = new Set<string>();
    completedWorkouts.forEach(w => {
      const timestamp = w.completed_at || w.updated_at || w.created_at;
      if (timestamp) {
        const d = new Date(timestamp);
        localDates.add(d.toLocaleDateString('sv-SE'));
      }
    });

    if (localDates.size === 0) return 0;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('sv-SE');

    let currentStreak = 0;
    let startFromDate = new Date();

    if (localDates.has(todayStr)) {
      currentStreak = 1;
      startFromDate = new Date();
    } else if (localDates.has(yesterdayStr)) {
      currentStreak = 1;
      startFromDate = yesterday;
    } else {
      return 0;
    }

    const checkDate = new Date(startFromDate);
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const checkStr = checkDate.toLocaleDateString('sv-SE');
      if (localDates.has(checkStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    return currentStreak;
  }, [workouts, todayStr]);

  const recentCompletedWorkouts = React.useMemo(() => {
    return workouts
      .filter(w => w.completed)
      .sort((a, b) => {
        const timeA = new Date(a.completed_at || a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.completed_at || b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      });
  }, [workouts]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-white select-none">
      
      {/* 1. TOP APP BAR */}
      <header className="sticky top-0 z-40 flex h-14 min-h-14 w-full shrink-0 items-center justify-between gap-2 border-b border-border-cool bg-white px-3 min-[380px]:px-4 sm:px-5">
        {/* RepPulse logo */}
        <div className="flex min-w-0 shrink items-center gap-1.5 cursor-pointer" onClick={() => onNavigate && onNavigate('dashboard')}>
          <Logo size={28} simplified={true} variant="light" />
          <span className="whitespace-nowrap font-display font-black text-sm text-neutral-900 tracking-tight uppercase">
            RepPulse
          </span>
        </div>

        {/* Right Actions: Activity Calendar icon, Notification icon & Profile Avatar */}
        <div className="flex shrink-0 items-center gap-1.5 min-[380px]:gap-2.5">
          {/* Calendar icon */}
          <button 
            onClick={() => onNavigate && onNavigate('calendar')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 active:scale-90 transition-all cursor-pointer relative"
            title="Activity Calendar"
          >
            <Calendar size={18} strokeWidth={2} />
          </button>

          {/* Notification icon */}
          <button 
            onClick={() => onNavigate && onNavigate('notifications')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-950 active:scale-90 transition-all cursor-pointer relative"
            title="Notifications"
          >
            <Bell size={20} strokeWidth={2} />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-neutral-900 border border-white rounded-full text-[8px] font-black text-white flex items-center justify-center px-0.5 shadow-2xs">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Profile avatar - toggles minimal actions sheet */}
          <button
            onClick={() => setShowProfileMenu(true)}
            className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center font-display font-bold text-[10px] tracking-tight border border-neutral-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {displayName.substring(0, 2).toUpperCase()}
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTENT (SCROLLABLE CONTAINER) */}
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="min-h-0 flex-1 overflow-y-auto no-scrollbar flex flex-col pb-6"
      >
        {/* PULL-TO-REFRESH HEADER */}
        <div 
          style={{ 
            height: refreshing ? '56px' : `${pullDistance}px`,
            opacity: refreshing ? 1 : pullDistance / 56,
            transition: pullDistance > 0 ? 'none' : 'height 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="w-full overflow-hidden flex items-center justify-center shrink-0 bg-neutral-50 border-b border-neutral-100"
        >
          <div className="flex items-center gap-2">
            {refreshing ? (
              <div className="flex items-center gap-2.5 text-neutral-600">
                <svg className="animate-spin h-5 w-5 text-neutral-900" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Refreshing Dashboard...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-neutral-400">
                <svg 
                  className="h-4 w-4 transition-transform duration-200" 
                  style={{ transform: `rotate(${pullDistance >= 56 ? 180 : 0}deg)` }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {pullDistance >= 56 ? 'Release to Refresh' : 'Pull to Refresh'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* INNER SCROLL CONTENT */}
        <div className="px-5 py-6 flex flex-col gap-6">

          {/* RECOVERY / FAILURE ERROR BANNER */}
          <AnimatePresence>
            {refreshError && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start justify-between shadow-xs z-30"
              >
                <div className="flex flex-col gap-1 text-red-700">
                  <span className="text-xs font-black uppercase tracking-wider">
                    Sync Error
                  </span>
                  <p className="text-xs text-red-600 font-medium">
                    {refreshError}
                  </p>
                </div>
                <button 
                  onClick={() => setRefreshError(null)}
                  className="text-red-500 hover:text-red-700 text-xs font-black uppercase tracking-widest shrink-0 ml-3"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1. GREETING */}
          <GreetingSection greeting={greeting} displayName={displayName} />

          {/* SKELETON LOADER */}
          {dataLoading && !refreshing && <DashboardSkeleton />}

          {/* DASHBOARD FETCH ERROR */}
          {!dataLoading && dashboardError && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex flex-col items-center text-center gap-3 my-2">
              <span className="font-display font-bold text-sm text-red-800 uppercase tracking-wider">
                Unable to load dashboard
              </span>
              <p className="text-xs text-red-600 max-w-[260px]">
                {dashboardError}
              </p>
              <button
                onClick={() => fetchDashboardAnalytics()}
                className="mt-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer active:scale-95 transition-all"
              >
                Retry
              </button>
            </div>
          )}

          {/* DASHBOARD CONTENT SECTIONS */}
          {!dataLoading && !dashboardError && (
            <>
              {/* 2. HERO CARD (PRIMARY WORKOUT CARD) */}
              <PrimaryWorkoutCard
                onStartWorkout={() => onNavigate && onNavigate('workout')}
                hasActiveSession={hasActiveSession}
              />

              {/* 3. QUICK SUMMARY */}
              <QuickSummarySection
                workoutsThisWeek={completedWorkoutsThisWeek}
                currentWeight={currentWeight}
                streakDays={dashboardData?.streak?.currentStreak ?? workoutStreak}
              />

              {/* 4. RECENT ACTIVITY (MERGED LATEST WORKOUT + RECENT ACTIVITY) */}
              <RecentActivityCard
                latestWorkout={dashboardData?.latestWorkout || recentCompletedWorkouts[0] || null}
                onViewHistory={() => onNavigate && onNavigate('workout_history')}
                onSelectWorkout={() => onNavigate && onNavigate('workout_history')}
              />
            </>
          )}

        </div>
      </div>

      {/* 6. PROFILE / ACTIONS BOTTOM DRAWER MENU */}
      <AnimatePresence>
        {showProfileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileMenu(false)}
              className="absolute inset-0 bg-neutral-950/20 backdrop-blur-xs z-45"
            />

            {/* Menu Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-border-cool rounded-t-[24px] shadow-xl z-50 px-6 pt-5 pb-8 flex flex-col gap-4"
            >
              <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-1" />
              
              {/* Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-border-cool">
                <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-display font-black text-sm">
                  {displayName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-neutral-900 uppercase tracking-wide">
                    {displayName}
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    {email || 'athletic-account'}
                  </p>
                </div>
              </div>

              {/* Quick Actions List */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-bg-snow border border-border-cool">
                  <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-900 uppercase tracking-wider block">
                      RepPulse Account
                    </span>
                    <span className="text-[9px] text-neutral-500 uppercase">
                      Status: Active Developer
                    </span>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  disabled={loading}
                  onClick={handleSignOut}
                  className="flex items-center justify-between px-5 h-[52px] rounded-2xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 font-sans font-semibold text-sm uppercase tracking-wider text-left transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <LogOut size={16} />
                    <span>Sign Out Account</span>
                  </div>
                  {loading && (
                    <span className="w-3.5 h-3.5 border-2 border-red-500/30 border-t-red-600 rounded-full animate-spin" />
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FLOATING INTERACTIVE TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="absolute bottom-5 left-4 right-4 bg-neutral-900 text-white py-3 px-4 rounded-xl shadow-lg border border-neutral-800 z-50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
