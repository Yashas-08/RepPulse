import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Workout } from '../types';
import {
  RedesignedDashboardData,
} from '../services/dashboardAnalyticsService';
import { DashboardService } from '../services/dashboardService';
import { WorkoutSessionService } from '../services/workoutSessionService';

export interface UseDashboardProps {
  currentUser?: SupabaseUser | null;
}

export function useDashboard({ currentUser }: UseDashboardProps) {
  const [displayName, setDisplayName] = useState(currentUser?.user_metadata?.full_name || 'Yashas');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [greeting, setGreeting] = useState('Good Morning');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [currentWeight, setCurrentWeight] = useState<string | null>(null);

  // Analytics State
  const [dashboardData, setDashboardData] = useState<RedesignedDashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // Workouts State
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);

  const activeUserId = currentUser?.id || 'guest';

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  const fetchDashboardAnalytics = useCallback(async () => {
    setDataLoading(true);
    setDashboardError(null);
    try {
      let active = false;
      if (activeUserId !== 'guest') {
        const activeRes = await WorkoutSessionService.getActiveWorkoutSession(activeUserId);
        if (activeRes.success && activeRes.data) {
          active = true;
          localStorage.setItem('reppulse_active_session', activeRes.data.id);
        }
      }

      if (!active) {
        const activeSessLocal = localStorage.getItem('reppulse_active_session');
        active = !!activeSessLocal;
      }

      setHasActiveSession(active);

      const res = await DashboardService.getDashboardData(activeUserId);
      if (res.success && res.data) {
        setDashboardData({
          hasAnyWorkouts: res.data.hasAnyWorkouts,
          todaySummary: res.data.todaySummary
            ? {
                workoutsToday: res.data.todaySummary.workoutsToday,
                durationMinutesToday: res.data.todaySummary.durationMinutesToday,
                weightLiftedTodayKg: res.data.todaySummary.totalVolumeTodayKg,
                formattedDuration: res.data.todaySummary.formattedDuration,
                formattedWeight: res.data.todaySummary.formattedWeight,
              }
            : null,
          streak: res.data.streak,
          latestWorkout: res.data.latestWorkout?.rawRecord || null,
          latestPR: res.data.latestPR
            ? {
                exerciseName: res.data.latestPR.exerciseName,
                recordType: res.data.latestPR.recordType,
                value: res.data.latestPR.value,
                date: res.data.latestPR.date,
              }
            : null,
        });
      } else {
        setDashboardError(res.error || 'Unable to load dashboard.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load dashboard.';
      setDashboardError(message);
    } finally {
      setDataLoading(false);
    }
  }, [activeUserId]);

  const fetchWeight = useCallback(async () => {
    try {
      const userId = currentUser?.id || (supabase ? (await supabase.auth.getUser().catch(() => ({ data: { user: null } }))).data?.user?.id : null);
      if (userId && supabase) {
        const { data: historyData, error: historyError } = await supabase
          .from('weight_history')
          .select('weight')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!historyError && historyData && historyData.length > 0) {
          setCurrentWeight(historyData[0].weight.toString());
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('weight')
          .eq('id', userId)
          .single();

        if (!profileError && profileData && profileData.weight) {
          setCurrentWeight(profileData.weight);
          return;
        }
      }

      const activeUserId = currentUser?.id || 'guest';
      const localProf = localStorage.getItem(`reppulse_profile_${activeUserId}`);
      if (localProf) {
        const parsed = JSON.parse(localProf);
        if (parsed.weight) {
          setCurrentWeight(parsed.weight);
          return;
        }
      }
      setCurrentWeight(null);
    } catch (err) {
      console.error('Error fetching weight:', err);
      setCurrentWeight(null);
    }
  }, [currentUser?.id]);

  const fetchWorkouts = useCallback(async () => {
    setWorkoutsLoading(true);
    let loadedWorkouts: Workout[] = [];
    let fromDb = false;

    try {
      const userId = currentUser?.id || (supabase ? (await supabase.auth.getUser().catch(() => ({ data: { user: null } }))).data?.user?.id : null);
      if (userId && supabase) {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId);

        if (!error && data) {
          loadedWorkouts = data as Workout[];
          fromDb = true;
        } else if (error) {
          console.error('Error fetching workouts from Supabase:', error);
        }
      }
    } catch (err) {
      console.error('Error in fetchWorkouts:', err);
    }

    if (!fromDb) {
      try {
        const userId = currentUser?.id || 'guest';
        const localData = localStorage.getItem(`reppulse_workouts_${userId}`);
        if (localData) {
          loadedWorkouts = JSON.parse(localData);
        }
      } catch (err) {
        console.error('Local storage fallback read error:', err);
      }
    }

    setWorkouts(loadedWorkouts);
    setWorkoutsLoading(false);
  }, [currentUser?.id]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const userId = currentUser?.id || 'guest';
      const localKey = `reppulse_notifications_${userId}`;
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUnreadNotifications(parsed.filter((n: { read?: boolean }) => !n.read).length);
      } else {
        setUnreadNotifications(2);
      }
    } catch (err) {
      console.error(err);
    }
  }, [currentUser?.id]);

  const fetchUserData = useCallback(async () => {
    if (currentUser) {
      const fullName = currentUser.user_metadata?.full_name;
      if (fullName) {
        setDisplayName(fullName);
      } else if (currentUser.email) {
        const prefix = currentUser.email.split('@')[0];
        setDisplayName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
      }
      setEmail(currentUser.email || '');
      return;
    }

    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName = user.user_metadata?.full_name;
        if (fullName) {
          setDisplayName(fullName);
        } else if (user.email) {
          const prefix = user.email.split('@')[0];
          setDisplayName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
        }
        setEmail(user.email || '');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  }, [currentUser]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      await Promise.all([
        fetchUserData(),
        fetchWeight(),
        fetchWorkouts(),
        fetchUnreadCount(),
        fetchDashboardAnalytics()
      ]);

      window.dispatchEvent(new Event('reppulse_workouts_updated'));
      window.dispatchEvent(new Event('reppulse_weight_updated'));
      window.dispatchEvent(new Event('reppulse_nutrition_updated'));
      window.dispatchEvent(new Event('reppulse_notifications_changed'));

      triggerToast('Dashboard Refreshed!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Check your internet connection and try again.';
      setRefreshError(message);
      triggerToast('Refresh Failed');
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }, [refreshing, fetchUserData, fetchWeight, fetchWorkouts, fetchUnreadCount, fetchDashboardAnalytics, triggerToast]);

  // Set greeting time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good Morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Initial load
  useEffect(() => {
    fetchUserData();
    fetchWeight();
    fetchWorkouts();
    fetchUnreadCount();
    fetchDashboardAnalytics();
  }, [fetchUserData, fetchWeight, fetchWorkouts, fetchUnreadCount, fetchDashboardAnalytics]);

  // Global listeners
  useEffect(() => {
    const handleNotificationsChanged = () => {
      fetchUnreadCount();
    };
    const handleWeightChanged = () => {
      fetchWeight();
    };
    const handleWorkoutsChanged = () => {
      fetchWorkouts();
      fetchDashboardAnalytics();
    };

    window.addEventListener('reppulse_notifications_changed', handleNotificationsChanged);
    window.addEventListener('reppulse_weight_updated', handleWeightChanged);
    window.addEventListener('reppulse_workouts_updated', handleWorkoutsChanged);

    return () => {
      window.removeEventListener('reppulse_notifications_changed', handleNotificationsChanged);
      window.removeEventListener('reppulse_weight_updated', handleWeightChanged);
      window.removeEventListener('reppulse_workouts_updated', handleWorkoutsChanged);
    };
  }, [fetchUnreadCount, fetchWeight, fetchWorkouts, fetchDashboardAnalytics]);

  // Pull-to-refresh event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    if (container.scrollTop === 0 && !refreshing) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPullingRef.current || refreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      const newDistance = Math.min(diff * 0.45, 120);
      setPullDistance(newDistance);
    }
  };

  const handleTouchEnd = () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance > 65) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    if (container.scrollTop === 0 && !refreshing) {
      startYRef.current = e.clientY;
      isPullingRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPullingRef.current || refreshing) return;

    const currentY = e.clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      const distance = diff * 0.45;
      setPullDistance(Math.min(distance, 80));
    }
  };

  const handleMouseUpOrLeave = () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance >= 56) {
      setPullDistance(56);
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  };

  return {
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
    fetchWorkouts,
    fetchDashboardAnalytics,
    handleRefresh,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
    triggerToast,
  };
}
