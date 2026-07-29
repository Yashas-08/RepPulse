import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ServiceResult } from '../types/workoutPersistence';

export interface PreviousSetData {
  setNumber: number;
  weight: number;
  reps: number;
}

export interface PreviousExercisePerformance {
  sessionId: string;
  workoutName: string;
  workoutDate: string;
  exerciseName: string;
  muscleGroup?: string;
  durationMinutes: number;
  completedSets: PreviousSetData[];
  totalVolume: number;
}

export interface SetComparisonResult {
  type: 'improved_weight' | 'improved_reps' | 'matched' | 'below_previous' | 'no_previous';
  weightDiff: number;
  repsDiff: number;
  message: string;
}

// Active session in-memory cache to prevent redundant fetches during workout
const previousWorkoutCache = new Map<string, PreviousExercisePerformance | null>();

export const PreviousWorkoutService = {
  /**
   * Clears the in-memory cache (e.g. when session ends or resets).
   */
  clearCache(): void {
    previousWorkoutCache.clear();
  },

  /**
   * STEP 1 & 8: Search authenticated user's completed workout history for the latest completed workout containing the specified exercise.
   * Uses targeted, indexed relational query to fetch ONLY the single latest completed session.
   */
  async getPreviousExercise(
    userId: string,
    exerciseName: string
  ): Promise<ServiceResult<PreviousExercisePerformance | null>> {
    if (!exerciseName || !exerciseName.trim()) {
      return { success: true, data: null };
    }

    const cacheKey = `${userId}:${exerciseName.trim().toLowerCase()}`;
    if (previousWorkoutCache.has(cacheKey)) {
      return { success: true, data: previousWorkoutCache.get(cacheKey) || null };
    }

    // Fallback for offline / unconfigured Supabase / guest user
    if (!isSupabaseConfigured || !supabase || userId === 'guest') {
      try {
        const storageKey = `reppulse_workouts_${userId}`;
        const localStr = localStorage.getItem(storageKey);
        if (localStr) {
          const records = JSON.parse(localStr);
          if (Array.isArray(records)) {
            const normalizedEx = exerciseName.trim().toLowerCase();
            for (const record of records) {
              if (record.completed && record.exercises_data) {
                const found = record.exercises_data.find(
                  (ex: any) =>
                    ex.name?.trim().toLowerCase() === normalizedEx ||
                    ex.exercise_id?.trim().toLowerCase() === normalizedEx
                );
                if (found && found.completed_sets && found.completed_sets.length > 0) {
                  const completedSets = found.completed_sets.map((s: any, idx: number) => ({
                    setNumber: s.set_number || idx + 1,
                    weight: Number(s.weight) || 0,
                    reps: Number(s.reps) || 0,
                  }));

                  const totalVolume = completedSets.reduce(
                    (acc: number, s: any) => acc + s.weight * s.reps,
                    0
                  );

                  const perfResult: PreviousExercisePerformance = {
                    sessionId: record.id,
                    workoutName: record.workout_name || 'Workout Session',
                    workoutDate: record.workout_date || record.created_at,
                    exerciseName: found.name || exerciseName,
                    muscleGroup: found.region_name || 'Workout',
                    durationMinutes: record.duration_minutes || 0,
                    completedSets,
                    totalVolume,
                  };

                  previousWorkoutCache.set(cacheKey, perfResult);
                  return { success: true, data: perfResult };
                }
              }
            }
          }
        }
      } catch (err) {
        // Ignore parsing errors for offline
      }

      previousWorkoutCache.set(cacheKey, null);
      return { success: true, data: null };
    }

    try {
      // Direct single-record query for performance optimization
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`
          id,
          session_id,
          exercise_name,
          muscle_group,
          exercise_order,
          workout_sets (
            id,
            set_number,
            weight,
            reps,
            completed
          ),
          workout_sessions!inner (
            id,
            user_id,
            workout_name,
            category,
            started_at,
            ended_at,
            duration_seconds,
            status,
            created_at
          )
        `)
        .ilike('exercise_name', exerciseName.trim())
        .eq('workout_sessions.user_id', userId)
        .eq('workout_sessions.status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        return {
          success: false,
          error: error.message || 'Unable to load previous workout.',
          code: error.code || 'QUERY_FAILED',
        };
      }

      if (!data || data.length === 0) {
        previousWorkoutCache.set(cacheKey, null);
        return { success: true, data: null };
      }

      const rawEx = data[0];
      const rawSession: any = Array.isArray(rawEx.workout_sessions)
        ? rawEx.workout_sessions[0]
        : rawEx.workout_sessions;
      const rawSets: any[] = Array.isArray(rawEx.workout_sets)
        ? rawEx.workout_sets
        : [];

      if (!rawSession) {
        previousWorkoutCache.set(cacheKey, null);
        return { success: true, data: null };
      }

      // Sort sets by set_number ascending
      const sortedSets = [...rawSets].sort(
        (a, b) => (a.set_number || 0) - (b.set_number || 0)
      );

      const completedSets: PreviousSetData[] = sortedSets
        .filter((s) => s.completed !== false)
        .map((s, idx) => ({
          setNumber: s.set_number || idx + 1,
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
        }));

      if (completedSets.length === 0) {
        previousWorkoutCache.set(cacheKey, null);
        return { success: true, data: null };
      }

      const totalVolume = completedSets.reduce(
        (acc, s) => acc + s.weight * s.reps,
        0
      );

      const durationSec = rawSession.duration_seconds || 0;
      const durationMins = Math.max(1, Math.round(durationSec / 60));
      const workoutDate =
        rawSession.ended_at || rawSession.started_at || rawSession.created_at;

      const performance: PreviousExercisePerformance = {
        sessionId: rawSession.id,
        workoutName: rawSession.workout_name || 'Workout Session',
        workoutDate,
        exerciseName: rawEx.exercise_name,
        muscleGroup: rawEx.muscle_group,
        durationMinutes: durationMins,
        completedSets,
        totalVolume,
      };

      previousWorkoutCache.set(cacheKey, performance);
      return { success: true, data: performance };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unable to load previous workout.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Alias method for fetching previous workout session containing exercise.
   */
  async getPreviousWorkout(
    userId: string,
    exerciseName: string
  ): Promise<ServiceResult<PreviousExercisePerformance | null>> {
    return this.getPreviousExercise(userId, exerciseName);
  },

  /**
   * STEP 5 & 6: Progressive Overload Comparison
   * Compares a current logged set against a corresponding previous set.
   *
   * Comparison Rules:
   * - Higher Weight -> Improved (improved_weight)
   * - Same Weight + More Reps -> Improved (improved_reps)
   * - Same Weight + Same Reps -> Matched (matched)
   * - Lower Weight or Lower Reps -> Below Previous (below_previous)
   */
  compareWorkoutPerformance(
    currentWeight: number,
    currentReps: number,
    prevSet?: { weight: number; reps: number }
  ): SetComparisonResult {
    if (!prevSet) {
      return {
        type: 'no_previous',
        weightDiff: 0,
        repsDiff: 0,
        message: 'No previous set found',
      };
    }

    const weightDiff = Math.round((currentWeight - prevSet.weight) * 10) / 10;
    const repsDiff = currentReps - prevSet.reps;

    // Higher Weight -> Improved
    if (weightDiff > 0) {
      return {
        type: 'improved_weight',
        weightDiff,
        repsDiff,
        message: `↑ Improved (+${weightDiff} kg)`,
      };
    }

    // Same Weight + More Reps -> Improved
    if (weightDiff === 0 && repsDiff > 0) {
      return {
        type: 'improved_reps',
        weightDiff: 0,
        repsDiff,
        message: `↑ Improved (+${repsDiff} reps)`,
      };
    }

    // Same Weight + Same Reps -> Matched
    if (weightDiff === 0 && repsDiff === 0) {
      return {
        type: 'matched',
        weightDiff: 0,
        repsDiff: 0,
        message: 'Matched Previous Set',
      };
    }

    // Lower Weight or Lower Reps -> Below Previous
    return {
      type: 'below_previous',
      weightDiff,
      repsDiff,
      message: '↓ Below Previous Workout',
    };
  },
};
