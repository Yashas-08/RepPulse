import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ActiveWorkoutSession } from '../types/workoutSession';

export interface WorkoutCalculatedStats {
  durationSeconds: number;
  durationMinutes: number;
  totalExercises: number;
  totalSets: number;
  totalReps: number;
  totalWeightLifted: number;
  formattedDuration: string;
}

export interface SavedWorkoutRecord {
  id: string;
  user_id: string;
  workout_name: string;
  category_title: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  duration_minutes: number;
  total_exercises: number;
  total_sets: number;
  total_reps: number;
  total_weight_lifted: number;
  exercises_data: {
    id: string;
    exercise_id: string;
    name: string;
    equipment?: string;
    region_name: string;
    completed_sets: {
      set_number: number;
      weight: number;
      reps: number;
    }[];
  }[];
  completed: boolean;
  created_at: string;
  completed_at: string;
  workout_date: string;
}

/**
 * Calculates summary metrics for an active workout session.
 */
export function calculateWorkoutStats(
  session: ActiveWorkoutSession,
  endTimeMs: number = Date.now()
): WorkoutCalculatedStats {
  const startMs = session.startTime || Date.now();
  const diffMs = Math.max(0, endTimeMs - startMs);
  const durationSeconds = Math.max(1, Math.floor(diffMs / 1000));
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;

  const formattedDuration =
    hrs > 0
      ? `${hrs}h ${remMins}m`
      : `${remMins}m ${secs}s`;

  // Exercises with at least 1 completed set
  const completedExercises = session.exercises.filter((ex) =>
    ex.sets.some((s) => s.completed)
  );

  let totalSets = 0;
  let totalReps = 0;
  let totalWeightLifted = 0;

  completedExercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      if (s.completed) {
        totalSets += 1;
        const weightNum = parseFloat(s.weight) || 0;
        const repsNum = parseInt(s.reps, 10) || 0;
        totalReps += repsNum;
        totalWeightLifted += weightNum * repsNum;
      }
    });
  });

  return {
    durationSeconds,
    durationMinutes,
    totalExercises: completedExercises.length,
    totalSets,
    totalReps,
    totalWeightLifted,
    formattedDuration,
  };
}

/**
 * Validates whether a workout session is eligible to be saved.
 */
export function validateWorkoutSession(session: ActiveWorkoutSession): {
  isValid: boolean;
  error?: string;
} {
  if (!session || !session.exercises || session.exercises.length === 0) {
    return {
      isValid: false,
      error: 'Workout contains no exercises. Add at least one exercise to save.',
    };
  }

  // Find exercises that have at least one completed set
  const exercisesWithCompletedSets = session.exercises.filter((ex) =>
    ex.sets.some((s) => s.completed)
  );

  if (exercisesWithCompletedSets.length === 0) {
    return {
      isValid: false,
      error: 'No completed sets found. Mark at least one set as completed before saving.',
    };
  }

  // Verify that completed sets have valid positive numbers for weight and reps
  for (const ex of exercisesWithCompletedSets) {
    const completedSets = ex.sets.filter((s) => s.completed);
    for (const setItem of completedSets) {
      const weightNum = parseFloat(setItem.weight);
      const repsNum = parseInt(setItem.reps, 10);

      if (isNaN(weightNum) || weightNum <= 0) {
        return {
          isValid: false,
          error: `Invalid weight in "${ex.name}" (Set ${setItem.setNumber}). Weight must be greater than 0 kg.`,
        };
      }

      if (isNaN(repsNum) || repsNum <= 0) {
        return {
          isValid: false,
          error: `Invalid reps in "${ex.name}" (Set ${setItem.setNumber}). Reps must be greater than 0.`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * WorkoutSaveService object handling workout validation, auto calculations, and database/local storage persistence.
 */
export const WorkoutSaveService = {
  calculateStats: calculateWorkoutStats,
  validate: validateWorkoutSession,

  /**
   * Persists a workout session permanently.
   */
  async saveWorkout(
    session: ActiveWorkoutSession,
    userId: string = 'guest'
  ): Promise<{ success: boolean; record?: SavedWorkoutRecord; error?: string }> {
    try {
      // 1. Validation check
      const validation = validateWorkoutSession(session);
      if (!validation.isValid) {
        return { success: false, error: validation.error || 'Validation failed.' };
      }

      const endTimeMs = Date.now();
      const stats = calculateWorkoutStats(session, endTimeMs);
      const workoutId = `wo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date(endTimeMs).toISOString();
      const todayDateStr = new Date(endTimeMs).toISOString().split('T')[0];

      // Format clean workout name
      const workoutName =
        session.categoryTitle ||
        session.exercises[0]?.regionName ||
        'Workout Session';

      // Prepare normalized exercises data
      const normalizedExercises = session.exercises
        .filter((ex) => ex.sets.some((s) => s.completed))
        .map((ex) => ({
          id: ex.id,
          exercise_id: ex.exerciseId,
          name: ex.name,
          equipment: ex.equipment,
          region_name: ex.regionName,
          completed_sets: ex.sets
            .filter((s) => s.completed)
            .map((s) => ({
              set_number: s.setNumber,
              weight: parseFloat(s.weight) || 0,
              reps: parseInt(s.reps, 10) || 0,
            })),
        }));

      // Construct normalized SavedWorkoutRecord
      const record: SavedWorkoutRecord = {
        id: workoutId,
        user_id: userId,
        workout_name: workoutName,
        category_title: session.categoryTitle || 'General Workout',
        start_time: new Date(session.startTime).toISOString(),
        end_time: nowIso,
        duration_seconds: stats.durationSeconds,
        duration_minutes: stats.durationMinutes,
        total_exercises: stats.totalExercises,
        total_sets: stats.totalSets,
        total_reps: stats.totalReps,
        total_weight_lifted: stats.totalWeightLifted,
        exercises_data: normalizedExercises,
        completed: true,
        created_at: nowIso,
        completed_at: nowIso,
        workout_date: todayDateStr,
      };

      // 2. Persist to Local Storage
      const storageKey = `reppulse_workouts_${userId}`;
      try {
        const existingLocalStr = localStorage.getItem(storageKey);
        const existingLocal: SavedWorkoutRecord[] = existingLocalStr ? JSON.parse(existingLocalStr) : [];
        const updatedLocal = [record, ...existingLocal];
        localStorage.setItem(storageKey, JSON.stringify(updatedLocal));
      } catch (localErr) {
        console.warn('Could not write workout to localStorage:', localErr);
      }

      // 3. Persist to Supabase if configured and user logged in
      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          const workoutInsertPayload: Record<string, any> = {
            user_id: userId,
            exercise_name: record.workout_name,
            sets: record.total_sets,
            reps: record.total_reps,
            weight: record.total_weight_lifted,
            completed: true,
            created_at: record.created_at,
            completed_at: record.completed_at,
            workout_date: record.workout_date,
            notes: JSON.stringify({
              duration_minutes: record.duration_minutes,
              total_exercises: record.total_exercises,
              exercises_data: record.exercises_data,
            }),
          };

          // Only include id if it matches standard UUID format
          const isValidUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(record.id);
          if (isValidUuid) {
            workoutInsertPayload.id = record.id;
          }

          const { error: dbError } = await supabase.from('workouts').insert(workoutInsertPayload);

          if (dbError) {
            console.warn('Initial Supabase workout insert warning, retrying with core fields:', dbError.message);
            // Retry with minimal schema fallback
            const fallbackPayload: Record<string, any> = {
              user_id: userId,
              exercise_name: record.workout_name,
              sets: record.total_sets,
              reps: record.total_reps,
              weight: record.total_weight_lifted,
              completed: true,
              created_at: record.created_at,
            };
            if (isValidUuid) {
              fallbackPayload.id = record.id;
            }
            const { error: retryError } = await supabase.from('workouts').insert(fallbackPayload);
            if (retryError) {
              console.warn('Supabase workout save fallback warning (local storage persistence active):', retryError.message);
            }
          }
        } catch (supabaseErr) {
          console.warn('Unexpected Supabase error saving workout:', supabaseErr);
        }
      }

      // 4. Dispatch custom event so Dashboard and other listeners reload immediately
      window.dispatchEvent(new Event('reppulse_workouts_updated'));

      return { success: true, record };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while saving your workout.';
      console.error('WorkoutSaveService.saveWorkout failed:', err);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
