import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ServiceResult } from '../types/workoutPersistence';
import { SavedWorkoutRecord } from './workoutSaveService';
import { WorkoutHistoryService } from './workoutHistoryService';
import { PersonalRecordService, PersonalRecordData } from './personalRecordService';

export interface TodaysSummaryData {
  workoutsToday: number;
  durationMinutesToday: number;
  durationSecondsToday: number;
  totalExercisesToday: number;
  totalCompletedSetsToday: number;
  totalVolumeTodayKg: number;
  formattedDuration: string;
  formattedWeight: string;
}

export interface WorkoutStreakData {
  currentStreak: number;
  longestStreak: number;
}

export interface LatestWorkoutData {
  id: string;
  workoutName: string;
  category: string;
  workoutDate: string;
  durationMinutes: number;
  durationSeconds: number;
  exercisesCompleted: number;
  setsCompleted: number;
  totalVolumeKg: number;
  rawRecord: SavedWorkoutRecord;
}

export interface LatestPersonalRecordData {
  id: string;
  exerciseName: string;
  recordType: string;
  value: string;
  date: string;
  updatedAt: string;
}

export interface DashboardDataResult {
  hasAnyWorkouts: boolean;
  todaySummary: TodaysSummaryData | null;
  streak: WorkoutStreakData;
  latestWorkout: LatestWorkoutData | null;
  latestPR: LatestPersonalRecordData | null;
}

/**
 * Calculates current and longest workout streak from a set of completed workout date strings (YYYY-MM-DD).
 */
function calculateStreakFromDates(workoutDates: Set<string>): WorkoutStreakData {
  if (workoutDates.size === 0) return { currentStreak: 0, longestStreak: 0 };

  const sortedDates = Array.from(workoutDates)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (sortedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  sortedDates.forEach((date) => {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((date.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak += 1;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = date;
  });

  const today = new Date();
  const todayStr = today.toLocaleDateString('sv-SE');

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('sv-SE');

  let currentStreak = 0;
  let checkDate: Date;

  if (workoutDates.has(todayStr)) {
    currentStreak = 1;
    checkDate = new Date(today);
  } else if (workoutDates.has(yesterdayStr)) {
    currentStreak = 1;
    checkDate = new Date(yesterday);
  } else {
    currentStreak = 0;
    return { currentStreak, longestStreak };
  }

  while (true) {
    checkDate.setDate(checkDate.getDate() - 1);
    const str = checkDate.toLocaleDateString('sv-SE');
    if (workoutDates.has(str)) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return { currentStreak, longestStreak };
}

export const DashboardService = {
  /**
   * Fetches Today's Summary for completed workouts
   */
  async getTodaysSummary(
    userId: string = 'guest',
    prefetchedHistory?: SavedWorkoutRecord[]
  ): Promise<ServiceResult<TodaysSummaryData | null>> {
    try {
      const history =
        prefetchedHistory ||
        (await WorkoutHistoryService.getWorkoutHistory(userId)).data ||
        [];

      const todayStr = new Date().toLocaleDateString('sv-SE');

      const todayWorkouts = history.filter((w) => {
        if (!w.completed) return false;
        const wDate = w.workout_date || (w.created_at ? w.created_at.split('T')[0] : '');
        return wDate === todayStr;
      });

      if (todayWorkouts.length === 0) {
        return { success: true, data: null };
      }

      let durationSeconds = 0;
      let totalExercises = 0;
      let totalCompletedSets = 0;
      let totalVolumeKg = 0;

      todayWorkouts.forEach((w) => {
        durationSeconds += w.duration_seconds || w.duration_minutes * 60 || 0;
        totalExercises += w.total_exercises || w.exercises_data?.length || 0;
        totalCompletedSets += w.total_sets || 0;
        totalVolumeKg += w.total_weight_lifted || 0;
      });

      const durationMinutes = Math.round(durationSeconds / 60);

      const summary: TodaysSummaryData = {
        workoutsToday: todayWorkouts.length,
        durationMinutesToday: durationMinutes,
        durationSecondsToday: durationSeconds,
        totalExercisesToday: totalExercises,
        totalCompletedSetsToday: totalCompletedSets,
        totalVolumeTodayKg: Math.round(totalVolumeKg * 10) / 10,
        formattedDuration: `${durationMinutes} mins`,
        formattedWeight: `${Math.round(totalVolumeKg)} kg`,
      };

      return { success: true, data: summary };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unable to load today summary.',
        code: 'SUMMARY_FAILED',
      };
    }
  },

  /**
   * Calculates Current and Longest Workout Streak
   */
  async getWorkoutStreak(
    userId: string = 'guest',
    prefetchedHistory?: SavedWorkoutRecord[]
  ): Promise<ServiceResult<WorkoutStreakData>> {
    try {
      const history =
        prefetchedHistory ||
        (await WorkoutHistoryService.getWorkoutHistory(userId)).data ||
        [];

      const completedWorkouts = history.filter((w) => w.completed !== false);

      const datesSet = new Set<string>();
      completedWorkouts.forEach((w) => {
        const rawDate = w.workout_date || w.completed_at || w.created_at;
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            datesSet.add(d.toLocaleDateString('sv-SE'));
          }
        }
      });

      const streak = calculateStreakFromDates(datesSet);
      return { success: true, data: streak };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unable to load streak information.',
        code: 'STREAK_FAILED',
      };
    }
  },

  /**
   * Retrieves the most recent completed workout session
   */
  async getLatestWorkout(
    userId: string = 'guest',
    prefetchedHistory?: SavedWorkoutRecord[]
  ): Promise<ServiceResult<LatestWorkoutData | null>> {
    try {
      const history =
        prefetchedHistory ||
        (await WorkoutHistoryService.getWorkoutHistory(userId)).data ||
        [];

      const completedWorkouts = history
        .filter((w) => w.completed !== false)
        .sort((a, b) => {
          const timeA = new Date(a.completed_at || a.workout_date || a.created_at).getTime();
          const timeB = new Date(b.completed_at || b.workout_date || b.created_at).getTime();
          return timeB - timeA;
        });

      if (completedWorkouts.length === 0) {
        return { success: true, data: null };
      }

      const top = completedWorkouts[0];
      const durationSec = top.duration_seconds || top.duration_minutes * 60 || 0;
      const durationMins = top.duration_minutes || Math.round(durationSec / 60);

      const latest: LatestWorkoutData = {
        id: top.id,
        workoutName: top.workout_name || 'Workout Session',
        category: top.category_title || 'General Workout',
        workoutDate: top.workout_date || (top.created_at ? top.created_at.split('T')[0] : ''),
        durationMinutes: durationMins,
        durationSeconds: durationSec,
        exercisesCompleted: top.total_exercises || top.exercises_data?.length || 0,
        setsCompleted: top.total_sets || 0,
        totalVolumeKg: top.total_weight_lifted || 0,
        rawRecord: top,
      };

      return { success: true, data: latest };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unable to load latest workout.',
        code: 'LATEST_WORKOUT_FAILED',
      };
    }
  },

  /**
   * Retrieves the newest Personal Record across all exercises
   */
  async getLatestPersonalRecord(
    userId: string = 'guest'
  ): Promise<ServiceResult<LatestPersonalRecordData | null>> {
    try {
      const prsRes = await PersonalRecordService.getPersonalRecords(userId);
      if (!prsRes.success || !prsRes.data || prsRes.data.length === 0) {
        return { success: true, data: null };
      }

      const prs = prsRes.data;

      // Find the PR with the most recent updated_at timestamp or highest value
      let newest: PersonalRecordData | null = null;
      let newestTime = 0;

      prs.forEach((pr) => {
        const t = new Date(pr.updated_at || pr.created_at).getTime();
        if (t > newestTime) {
          newestTime = t;
          newest = pr;
        }
      });

      if (!newest) {
        return { success: true, data: null };
      }

      const target: PersonalRecordData = newest;

      // Determine primary record type & formatted value
      let recordType = 'Highest Weight';
      let value = '0 kg';
      let dateVal = target.highest_weight_date || target.updated_at;

      // Compare timestamps of weight, volume, reps to show exact record type broken
      const wTime = target.highest_weight_date ? new Date(target.highest_weight_date).getTime() : 0;
      const rTime = target.highest_reps_date ? new Date(target.highest_reps_date).getTime() : 0;
      const vTime = target.highest_volume_date ? new Date(target.highest_volume_date).getTime() : 0;

      if (vTime >= wTime && vTime >= rTime && target.highest_volume > 0) {
        recordType = 'Highest Volume';
        value = `${target.highest_volume} kg`;
        dateVal = target.highest_volume_date || dateVal;
      } else if (rTime >= wTime && rTime >= vTime && target.highest_reps > 0) {
        recordType = 'Highest Reps';
        value = `${target.highest_reps} reps`;
        dateVal = target.highest_reps_date || dateVal;
      } else if (target.highest_weight > 0) {
        recordType = 'Highest Weight';
        value = `${target.highest_weight} kg`;
        dateVal = target.highest_weight_date || dateVal;
      }

      const latestPR: LatestPersonalRecordData = {
        id: target.id,
        exerciseName: target.exercise_name,
        recordType,
        value,
        date: dateVal ? dateVal.split('T')[0] : '',
        updatedAt: target.updated_at,
      };

      return { success: true, data: latestPR };
    } catch (err: any) {
      console.warn('Unable to load latest PR:', err);
      return {
        success: true,
        data: null,
      };
    }
  },

  /**
   * Master aggregator for Dashboard. Executes concurrent queries and returns complete Dashboard data.
   */
  async getDashboardData(userId: string = 'guest'): Promise<ServiceResult<DashboardDataResult>> {
    try {
      // Execute history and PRs concurrently
      const [historyRes, latestPrRes] = await Promise.all([
        WorkoutHistoryService.getWorkoutHistory(userId),
        this.getLatestPersonalRecord(userId),
      ]);

      const history = historyRes.data || [];
      const completedHistory = history.filter((w) => w.completed !== false);
      const hasAnyWorkouts = completedHistory.length > 0;

      // Compute sub-metrics synchronously using prefetched history
      const [todayRes, streakRes, latestWorkoutRes] = await Promise.all([
        this.getTodaysSummary(userId, history),
        this.getWorkoutStreak(userId, history),
        this.getLatestWorkout(userId, history),
      ]);

      const dashboardResult: DashboardDataResult = {
        hasAnyWorkouts,
        todaySummary: todayRes.data || null,
        streak: streakRes.data || { currentStreak: 0, longestStreak: 0 },
        latestWorkout: latestWorkoutRes.data || null,
        latestPR: latestPrRes.data || null,
      };

      return { success: true, data: dashboardResult };
    } catch (err: any) {
      console.warn('Dashboard data fetch issue, returning local empty state:', err);
      return {
        success: true,
        data: {
          hasAnyWorkouts: false,
          todaySummary: null,
          streak: { currentStreak: 0, longestStreak: 0 },
          latestWorkout: null,
          latestPR: null,
        },
      };
    }
  },
};
