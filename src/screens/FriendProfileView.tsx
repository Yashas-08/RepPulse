import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Award, 
  Flame, 
  Calendar, 
  Dumbbell, 
  Utensils, 
  RefreshCw, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  Clock, 
  Loader2, 
  Heart, 
  Apple, 
  Trophy,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Workout, Meal } from '../types';
import { FriendsService } from '../services/friendsService';
import { Friend } from '../types/friends';

interface FriendProfileViewProps {
  friend: Friend;
  onBack: () => void;
  currentUser: any;
  dbStatus: 'connected' | 'fallback' | 'checking';
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  unlocked: boolean;
}

export const FriendProfileView: React.FC<FriendProfileViewProps> = ({ 
  friend, 
  onBack, 
  currentUser,
  dbStatus 
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile metadata
  const [profileImage, setProfileImage] = useState<string | null>(friend.profile_image || null);
  const [displayName, setDisplayName] = useState<string>(friend.full_name);

  // Workouts and meals fetched for selected friend
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);

  // Calculate Streak using the official RepPulse algorithm
  const calculateStreak = (workoutRecords: Workout[]): number => {
    const completedWorkouts = workoutRecords.filter(w => w.completed);
    if (completedWorkouts.length === 0) return 0;

    const uniqueDates = Array.from(new Set(
      completedWorkouts.map(w => {
        const d = new Date(w.completed_at || w.updated_at || w.created_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    )).sort((a, b) => b.localeCompare(a)); // Sort descending (most recent first)

    if (uniqueDates.length === 0) return 0;

    const todayStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const yesterdayStr = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const mostRecent = uniqueDates[0];

    // If latest workout is neither today nor yesterday, streak is broken
    if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
      return 0;
    }

    let currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const d1 = new Date(uniqueDates[i - 1]);
      const d2 = new Date(uniqueDates[i]);
      const diffTime = Math.abs(d1.getTime() - d2.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    return currentStreak;
  };

  const loadFriendData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const currentUserId = currentUser?.id || 'guest';
    const res = await FriendsService.getFriendProfile(friend.friendId, currentUserId);

    if (res.success && res.data) {
      if (res.data.profile.full_name) {
        setDisplayName(res.data.profile.full_name);
      }
      setProfileImage(res.data.profile.profile_image || null);
      setWorkouts(res.data.workouts || []);
      setMeals(res.data.meals || []);
    } else {
      setError(res.error || 'Failed to extract friend profile details.');
    }

    setLoading(false);
    setRefreshing(false);
  };


  useEffect(() => {
    loadFriendData();
  }, [friend.friendId]);

  // Derived Statistics
  const streak = useMemo(() => calculateStreak(workouts), [workouts]);

  const totalWorkouts = useMemo(() => {
    return workouts.filter(w => w.completed).length;
  }, [workouts]);

  const workoutsThisWeek = useMemo(() => {
    const completedWorkouts = workouts.filter(w => w.completed);
    
    // Get start & end of current week
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
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

  const lastCompletedWorkout = useMemo(() => {
    const completedWorkouts = workouts
      .filter(w => w.completed)
      .sort((a, b) => {
        const timeA = new Date(a.completed_at || a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.completed_at || b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      });
    return completedWorkouts.length > 0 ? completedWorkouts[0] : null;
  }, [workouts]);

  const mealsToday = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
    return meals.filter(m => {
      const mealDateStr = m.created_at ? m.created_at.split('T')[0] : '';
      return mealDateStr === todayStr;
    });
  }, [meals]);

  const totalCaloriesToday = useMemo(() => {
    return mealsToday.reduce((sum, m) => sum + m.calories, 0);
  }, [mealsToday]);

  // Achievements
  const badgesList = useMemo<Badge[]>(() => {
    const hasLifted100kg = workouts.some(w => w.completed && w.weight && w.weight >= 100);
    const hasActivityToday = mealsToday.length > 0 || workouts.some(w => {
      if (!w.completed) return false;
      const dateStr = w.completed_at || w.updated_at || w.created_at;
      return dateStr ? dateStr.split('T')[0] === new Date().toLocaleDateString('sv-SE') : false;
    });

    return [
      {
        id: 'streak',
        name: 'Consistency King',
        description: 'Achieve a 3+ day active workout streak',
        icon: Flame,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-100',
        unlocked: streak >= 3
      },
      {
        id: 'iron',
        name: 'Iron Lifter',
        description: 'Complete 5+ workouts in total history',
        icon: Dumbbell,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-100',
        unlocked: totalWorkouts >= 5
      },
      {
        id: 'warrior',
        name: 'Weekly Warrior',
        description: 'Complete 3+ workouts in a single week',
        icon: Trophy,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-100',
        unlocked: workoutsThisWeek >= 3
      },
      {
        id: 'nutrition',
        name: 'Mindful Eater',
        description: 'Log 3+ separate nutritional meals today',
        icon: Apple,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-100',
        unlocked: mealsToday.length >= 3
      },
      {
        id: 'century',
        name: 'Century Club',
        description: 'Register any set at 100+ kg threshold',
        icon: Award,
        color: 'text-rose-500',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-100',
        unlocked: hasLifted100kg
      },
      {
        id: 'discipline',
        name: 'Daily Discipline',
        description: 'Logged active work or nutrition today',
        icon: Sparkles,
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-100',
        unlocked: hasActivityToday
      }
    ];
  }, [workouts, mealsToday, streak, totalWorkouts, workoutsThisWeek]);

  // Last 7 days calendar indicators
  const weeklyCalendar = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('sv-SE');
      const dayAbbrev = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // S, M, T, W, etc.
      
      const hasWorkout = workouts.some(w => {
        if (!w.completed) return false;
        const compStr = w.completed_at || w.updated_at || w.created_at;
        return compStr ? compStr.split('T')[0] === dayStr : false;
      });

      const hasMeals = meals.some(m => {
        const mealStr = m.created_at;
        return mealStr ? mealStr.split('T')[0] === dayStr : false;
      });

      days.push({
        dateStr: dayStr,
        dayAbbrev,
        hasWorkout,
        hasMeals,
        isToday: i === 0
      });
    }
    return days;
  }, [workouts, meals]);

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden select-none">
      
      {/* HEADER */}
      <header className="h-14 bg-white border-b border-border-cool flex items-center justify-between px-5 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer mr-1 border border-border-cool"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase">
              Friend Progress
            </h1>
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest -mt-0.5">
              Track your friends' fitness activity
            </p>
          </div>
        </div>

        <button
          onClick={() => loadFriendData(true)}
          disabled={loading || refreshing}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer border border-border-cool disabled:opacity-50"
          title="Refresh Friend Data"
        >
          {refreshing ? (
            <Loader2 size={15} className="animate-spin text-neutral-900" />
          ) : (
            <RefreshCw size={15} />
          )}
        </button>
      </header>

      {/* VIEWPORT SCROLLER */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 flex flex-col gap-6 pb-28">
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-neutral-900 w-8 h-8 mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Loading friend profile...</p>
          </div>
        ) : (
          <>
            {/* 1. HERO PROFILE INFO CARD */}
            <div className="bg-neutral-50 border border-border-cool rounded-3xl p-5 flex flex-col items-center text-center">
              {/* Top Row: Privacy Badge aligned top-right */}
              <div className="w-full flex items-center justify-end mb-2">
                <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-border-cool shadow-2xs shrink-0 whitespace-nowrap">
                  <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 whitespace-nowrap">Privacy Encrypted</span>
                </div>
              </div>

              {/* Profile Image / Avatar */}
              <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-100 flex items-center justify-center shadow-md mb-3.5 relative shrink-0">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={displayName} 
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-white font-sans font-black text-lg">
                    {displayName.substring(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-border-cool flex items-center justify-center shadow-xs">
                  <Activity size={12} className="text-neutral-600" />
                </div>
              </div>

              <h2 className="font-display font-black text-lg text-neutral-900 tracking-tight leading-tight mb-1">
                {displayName}
              </h2>
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-3">
                RepPulse Friend
              </p>

              <div className="w-full max-w-[240px] border-t border-dashed border-neutral-200 pt-3 flex items-center justify-center gap-1.5">
                <ShieldCheck size={12} className="text-neutral-400 shrink-0" />
                <span className="text-[9px] font-medium text-neutral-400 whitespace-nowrap">Email & metrics kept completely secure.</span>
              </div>
            </div>

            {/* ERROR ALERT BOX */}
            {error && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-wide flex items-start gap-2">
                <HelpCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <div className="flex-1">
                  <p className="font-black">Network Sync Alert</p>
                  <p className="text-neutral-500 lowercase normal-case font-medium mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* 2. STATS OVERVIEW */}
            <div className="grid grid-cols-3 gap-3">
              {/* STREAK */}
              <div className="bg-white border border-border-cool rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-2xs">
                <div className="flex items-center gap-1">
                  <span className="font-display font-black text-xl text-neutral-900 tracking-tight">
                    {streak}
                  </span>
                  <Flame size={16} className={`${streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-neutral-300'} shrink-0`} />
                </div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mt-1 leading-tight">
                  Active Streak
                </span>
              </div>

              {/* WORKOUTS THIS WEEK */}
              <div className="bg-white border border-border-cool rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="font-display font-black text-xl text-neutral-900 tracking-tight">
                  {workoutsThisWeek}
                </span>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mt-1 leading-tight">
                  Done This Week
                </span>
              </div>

              {/* TOTAL WORKOUTS */}
              <div className="bg-white border border-border-cool rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="font-display font-black text-xl text-neutral-900 tracking-tight">
                  {totalWorkouts}
                </span>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mt-1 leading-tight">
                  Total Completed
                </span>
              </div>
            </div>

            {/* 3. WEEKLY ACTIVITY CALENDAR */}
            <div className="bg-white border border-border-cool rounded-2xl p-4 shadow-2xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-xs text-neutral-900 uppercase tracking-wide">
                  Weekly Activity Calendar
                </h3>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                  Last 7 Days
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weeklyCalendar.map((day, idx) => {
                  let circleBg = 'bg-neutral-50 border-neutral-200';
                  let iconElement = null;

                  if (day.hasWorkout && day.hasMeals) {
                    circleBg = 'bg-neutral-900 border-neutral-900 text-white';
                    iconElement = <Sparkles size={11} />;
                  } else if (day.hasWorkout) {
                    circleBg = 'bg-neutral-900 border-neutral-900 text-white';
                    iconElement = <Dumbbell size={11} />;
                  } else if (day.hasMeals) {
                    circleBg = 'bg-white border-neutral-900 text-neutral-900 border-2';
                    iconElement = <Utensils size={10} />;
                  }

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <span className={`text-[10px] font-bold uppercase ${day.isToday ? 'text-neutral-900 font-black' : 'text-neutral-400'}`}>
                        {day.dayAbbrev}
                      </span>
                      <div 
                        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shadow-3xs ${circleBg}`}
                        title={`${day.dateStr}: ${day.hasWorkout ? 'Workout Completed' : ''} ${day.hasMeals ? 'Meals Logged' : ''}`}
                      >
                        {iconElement}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LEGEND */}
              <div className="flex items-center gap-4 mt-1 pt-2 border-t border-neutral-100 justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 flex items-center justify-center text-white"><Dumbbell size={6} /></div>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Workout</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-white border border-neutral-900 border-2 flex items-center justify-center text-neutral-900"><Utensils size={5} /></div>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Nutrition</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 flex items-center justify-center text-white"><Sparkles size={6} /></div>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Both Done</span>
                </div>
              </div>
            </div>

            {/* 4. ACHIEVEMENT BADGES */}
            <div className="flex flex-col gap-3">
              <h3 className="font-display font-semibold text-xs text-neutral-900 uppercase tracking-wide pl-0.5">
                Achievement Badges
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {badgesList.map((badge) => {
                  const IconComponent = badge.icon;
                  return (
                    <div 
                      key={badge.id}
                      className={`border rounded-2xl p-3.5 flex flex-col gap-1.5 shadow-3xs transition-all duration-300 ${
                        badge.unlocked 
                          ? `${badge.bgColor} ${badge.borderColor} opacity-100 hover:scale-[1.02]` 
                          : 'bg-white border-neutral-100 opacity-40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-1.5 rounded-lg ${badge.unlocked ? 'bg-white shadow-3xs' : 'bg-neutral-50'}`}>
                          <IconComponent size={16} className={badge.unlocked ? badge.color : 'text-neutral-300'} />
                        </div>
                        {badge.unlocked ? (
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded-md">
                            Unlocked
                          </span>
                        ) : (
                          <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded-md">
                            Locked
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col mt-0.5">
                        <h4 className={`text-xs font-bold leading-tight ${badge.unlocked ? 'text-neutral-900' : 'text-neutral-400'}`}>
                          {badge.name}
                        </h4>
                        <p className="text-[10px] text-neutral-400 font-normal leading-normal mt-0.5">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. MEALS LOGGED TODAY */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-xs text-neutral-900 uppercase tracking-wide pl-0.5">
                  Meals Logged Today
                </h3>
                {mealsToday.length > 0 && (
                  <span className="text-[10px] font-black text-neutral-500 bg-neutral-50 border border-neutral-100 px-2 py-0.5 rounded-lg shadow-3xs">
                    {totalCaloriesToday} kcal
                  </span>
                )}
              </div>

              {mealsToday.length === 0 ? (
                <div className="bg-white border border-border-cool rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-3xs">
                  <Utensils size={18} className="text-neutral-300 mb-2" />
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">No meals logged today</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Friend has not logged physical fuel intake metrics today.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {mealsToday.map((meal) => (
                    <div 
                      key={meal.id}
                      className="bg-white border border-border-cool rounded-2xl p-3.5 flex items-center justify-between shadow-3xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {meal.meal_type[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-sans font-bold text-xs text-neutral-800 truncate uppercase tracking-wider">
                            {meal.food_name}
                          </h4>
                          <span className="text-[9px] text-neutral-400 font-black uppercase tracking-widest mt-0.5 block">
                            {meal.meal_type}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-black text-neutral-900 shrink-0">
                        {meal.calories} kcal
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. LAST COMPLETED WORKOUT */}
            <div className="flex flex-col gap-3">
              <h3 className="font-display font-semibold text-xs text-neutral-900 uppercase tracking-wide pl-0.5">
                Last Completed Workout
              </h3>

              {!lastCompletedWorkout ? (
                <div className="bg-white border border-border-cool rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-3xs">
                  <Dumbbell size={18} className="text-neutral-300 mb-2" />
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">No completed workouts</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Friend has not finalized any training logs yet.</p>
                </div>
              ) : (
                <div className="bg-white border border-border-cool rounded-2xl p-4 flex items-center justify-between shadow-3xs">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-neutral-950 text-white flex items-center justify-center shrink-0 shadow-3xs">
                      <CheckCircle size={14} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-sans font-black text-xs text-neutral-900 truncate uppercase tracking-wider">
                        {lastCompletedWorkout.exercise_name}
                      </h4>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5 block">
                        {new Date(lastCompletedWorkout.completed_at || lastCompletedWorkout.updated_at || lastCompletedWorkout.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-100">
                    <span className="text-[10px] font-black text-neutral-600">
                      {lastCompletedWorkout.sets} × {lastCompletedWorkout.reps} reps
                    </span>
                    {lastCompletedWorkout.weight !== undefined && lastCompletedWorkout.weight !== null && (
                      <>
                        <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                        <span className="text-[10px] font-black text-neutral-600">
                          {lastCompletedWorkout.weight} kg
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

          </>
        )}

      </div>
    </div>
  );
};
