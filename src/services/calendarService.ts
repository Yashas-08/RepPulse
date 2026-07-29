import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SavedWorkoutRecord } from './workoutSaveService';
import { NutritionLog } from '../types/nutrition';
import { ProgressLog } from '../types/progress';

export interface DayNutritionSummary {
  meals: NutritionLog[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
}

export interface DayActivity {
  dateStr: string; // YYYY-MM-DD
  workouts: SavedWorkoutRecord[];
  nutrition: DayNutritionSummary | null;
  progress: ProgressLog[];
  hasWorkout: boolean;
  hasNutrition: boolean;
  hasProgress: boolean;
}

export interface MonthActivityMap {
  [dateStr: string]: DayActivity;
}

export interface CalendarServiceResult {
  success: boolean;
  data: MonthActivityMap;
  error?: string;
}

/**
 * Format date to local YYYY-MM-DD string
 */
export function toLocalDateString(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Maps a raw Supabase workout_sessions record (with joined workout_exercises and workout_sets)
 * to a normalized SavedWorkoutRecord.
 */
function mapSessionToSavedRecord(session: any): SavedWorkoutRecord {
  const exercisesRaw = session.workout_exercises || [];

  const sortedExercises = [...exercisesRaw].sort(
    (a, b) => (a.exercise_order || 0) - (b.exercise_order || 0)
  );

  let totalSetsCount = 0;
  let totalRepsCount = 0;
  let totalWeightLifted = 0;

  const exercisesData = sortedExercises.map((ex: any) => {
    const setsRaw = ex.workout_sets || [];
    const sortedSets = [...setsRaw].sort(
      (a, b) => (a.set_number || 0) - (b.set_number || 0)
    );

    const completedSets = sortedSets
      .filter((s: any) => s.completed !== false)
      .map((s: any) => {
        const w = Number(s.weight) || 0;
        const r = Number(s.reps) || 0;
        totalSetsCount += 1;
        totalRepsCount += r;
        totalWeightLifted += w * r;
        return {
          set_number: s.set_number || 1,
          weight: w,
          reps: r,
        };
      });

    return {
      id: ex.id || `ex-${Math.random()}`,
      exercise_id: ex.exercise_name || 'ex',
      name: ex.exercise_name || 'Exercise',
      equipment: 'Standard',
      region_name: ex.muscle_group || 'Workout',
      completed_sets:
        completedSets.length > 0
          ? completedSets
          : sortedSets.map((s: any, idx: number) => ({
              set_number: s.set_number || idx + 1,
              weight: Number(s.weight) || 0,
              reps: Number(s.reps) || 0,
            })),
    };
  });

  const durationSec = session.duration_seconds || 0;
  const durationMins = Math.max(1, Math.round(durationSec / 60));
  const startTimeIso = session.started_at || session.created_at || new Date().toISOString();
  const endTimeIso = session.ended_at || startTimeIso;
  const workoutDateStr = toLocalDateString(startTimeIso);

  return {
    id: session.id,
    user_id: session.user_id,
    workout_name: session.workout_name || 'Workout Session',
    category_title: session.category || 'General Workout',
    start_time: startTimeIso,
    end_time: endTimeIso,
    duration_seconds: durationSec,
    duration_minutes: durationMins,
    total_exercises: exercisesData.length,
    total_sets: totalSetsCount,
    total_reps: totalRepsCount,
    total_weight_lifted: Math.round(totalWeightLifted * 10) / 10,
    exercises_data: exercisesData,
    completed: session.status === 'completed',
    created_at: session.created_at || startTimeIso,
    completed_at: endTimeIso,
    workout_date: workoutDateStr,
  };
}

/**
 * Maps a row from the fallback 'workouts' table to a SavedWorkoutRecord.
 */
function mapWorkoutRowToSavedRecord(raw: any): SavedWorkoutRecord {
  let notesData: any = {};
  if (raw.notes) {
    try {
      notesData = typeof raw.notes === 'string' ? JSON.parse(raw.notes) : raw.notes;
    } catch (_) {}
  }

  const durationMins = Number(raw.duration_minutes) || Number(notesData.duration_minutes) || 1;
  const startTimeIso = raw.created_at || raw.workout_date || new Date().toISOString();
  const dateStr = toLocalDateString(startTimeIso);

  return {
    id: raw.id || `wo-${Math.random()}`,
    user_id: raw.user_id,
    workout_name: raw.exercise_name || raw.workout_name || 'Workout Session',
    category_title: raw.category || notesData.category || 'General Workout',
    start_time: startTimeIso,
    end_time: raw.completed_at || startTimeIso,
    duration_seconds: durationMins * 60,
    duration_minutes: durationMins,
    total_exercises: Number(notesData.total_exercises) || (notesData.exercises_data?.length) || 1,
    total_sets: Number(raw.sets) || 0,
    total_reps: Number(raw.reps) || 0,
    total_weight_lifted: Number(raw.weight) || 0,
    exercises_data: notesData.exercises_data || [],
    completed: raw.completed !== false,
    created_at: raw.created_at || startTimeIso,
    completed_at: raw.completed_at || startTimeIso,
    workout_date: raw.workout_date || dateStr,
  };
}

export const CalendarService = {
  /**
   * Fetches workout, nutrition, and progress activities for the given year and month (1-12).
   */
  async getMonthlyActivity(
    userId: string = 'guest',
    year: number,
    month: number // 1 to 12
  ): Promise<CalendarServiceResult> {
    const activityMap: MonthActivityMap = {};

    // Generate extended date range bounds to prevent timezone boundary clipping (padding 3 days on each side)
    const fetchStartIso = new Date(Date.UTC(year, month - 1, -2, 0, 0, 0, 0)).toISOString();
    const fetchEndIso = new Date(Date.UTC(year, month, 3, 23, 59, 59, 999)).toISOString();

    try {
      // -------------------------------------------------------------
      // 1, 2, 3. FETCH WORKOUT SESSIONS, MEALS, PROGRESS LOGS IN PARALLEL
      // -------------------------------------------------------------
      let workoutsList: SavedWorkoutRecord[] = [];
      let mealsList: NutritionLog[] = [];
      let progressList: ProgressLog[] = [];

      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          const [sessionRes, workoutsRes, mealRes, progRes, weightRes] = await Promise.all([
            // A. Primary: Query workout_sessions
            supabase
              .from('workout_sessions')
              .select(`
                id,
                user_id,
                workout_name,
                category,
                started_at,
                ended_at,
                duration_seconds,
                status,
                created_at,
                workout_exercises (
                  id,
                  exercise_name,
                  muscle_group,
                  exercise_order,
                  workout_sets (
                    id,
                    set_number,
                    weight,
                    reps,
                    completed
                  )
                )
              `)
              .eq('user_id', userId)
              .eq('status', 'completed')
              .gte('started_at', fetchStartIso)
              .lte('started_at', fetchEndIso),

            // B. Query workouts table for any workouts saved via WorkoutSaveService
            supabase
              .from('workouts')
              .select('*')
              .eq('user_id', userId)
              .gte('created_at', fetchStartIso)
              .lte('created_at', fetchEndIso),

            // C. Query meals
            supabase
              .from('meals')
              .select('*')
              .eq('user_id', userId)
              .gte('meal_time', fetchStartIso)
              .lte('meal_time', fetchEndIso),

            // D. Query progress_logs
            supabase
              .from('progress_logs')
              .select('*')
              .eq('user_id', userId)
              .gte('recorded_at', fetchStartIso)
              .lte('recorded_at', fetchEndIso),

            // E. Query fallback weight_history
            supabase
              .from('weight_history')
              .select('*')
              .eq('user_id', userId)
              .gte('created_at', fetchStartIso)
              .lte('created_at', fetchEndIso),
          ]);

          if (!sessionRes.error && sessionRes.data) {
            workoutsList = sessionRes.data.map(mapSessionToSavedRecord);
          }

          if (!workoutsRes.error && workoutsRes.data) {
            const existingIds = new Set(workoutsList.map((w) => w.id));
            workoutsRes.data.forEach((wRow) => {
              if (!existingIds.has(wRow.id)) {
                workoutsList.push(mapWorkoutRowToSavedRecord(wRow));
              }
            });
          }

          if (!mealRes.error && mealRes.data) {
            mealsList = mealRes.data.map((raw) => ({
              id: raw.id,
              user_id: raw.user_id,
              meal_type: raw.meal_type || 'Breakfast',
              meal_name: raw.meal_name || raw.food_name || 'Logged Meal',
              food_name: raw.meal_name || raw.food_name || 'Logged Meal',
              calories: Number(raw.calories) || 0,
              protein: Number(raw.protein ?? raw.protein_g ?? 0),
              carbohydrates: Number(raw.carbohydrates ?? raw.carbs_g ?? raw.carbs ?? 0),
              fat: Number(raw.fat ?? raw.fat_g ?? 0),
              fiber: Number(raw.fiber ?? raw.fiber_g ?? 0),
              quantity: raw.quantity || '1 serving',
              meal_time: raw.meal_time || raw.created_at || new Date().toISOString(),
              notes: raw.notes || '',
              created_at: raw.created_at || new Date().toISOString(),
            }));
          }

          if (!progRes.error && progRes.data && progRes.data.length > 0) {
            progressList = progRes.data.map((raw) => ({
              id: raw.id,
              user_id: raw.user_id,
              weight: raw.weight !== null && raw.weight !== undefined ? Number(raw.weight) : null,
              body_fat_percentage: raw.body_fat_percentage !== null && raw.body_fat_percentage !== undefined ? Number(raw.body_fat_percentage) : null,
              notes: raw.notes || '',
              recorded_at: raw.recorded_at || raw.created_at || new Date().toISOString(),
              created_at: raw.created_at || new Date().toISOString(),
            }));
          } else if (!weightRes.error && weightRes.data) {
            progressList = weightRes.data.map((w) => ({
              id: w.id,
              user_id: w.user_id,
              weight: w.weight !== null && w.weight !== undefined ? Number(w.weight) : null,
              notes: '',
              recorded_at: w.created_at || new Date().toISOString(),
              created_at: w.created_at || new Date().toISOString(),
            }));
          }
        } catch (dbErr) {
          console.warn('Supabase parallel fetch failed in calendar:', dbErr);
        }
      }

      // Local storage fallback for progress/weight
      const localProgKeys = [
        `reppulse_progress_history_${userId}`,
        `reppulse_weight_history_${userId}`,
      ];

      localProgKeys.forEach((key) => {
        const localProg = localStorage.getItem(key);
        if (localProg) {
          try {
            const parsed = JSON.parse(localProg);
            if (Array.isArray(parsed)) {
              const existingProgIds = new Set(progressList.map((p) => p.id));
              parsed.forEach((p: any) => {
                if (p.id && !existingProgIds.has(p.id)) {
                  const pTimeIso = new Date(p.recorded_at || p.created_at).toISOString();
                  if (pTimeIso >= fetchStartIso && pTimeIso <= fetchEndIso) {
                    progressList.push({
                      id: p.id,
                      user_id: p.user_id || userId,
                      weight: p.weight !== null && p.weight !== undefined ? Number(p.weight) : null,
                      body_fat_percentage: p.body_fat_percentage ? Number(p.body_fat_percentage) : null,
                      notes: p.notes || '',
                      recorded_at: p.recorded_at || p.created_at || new Date().toISOString(),
                      created_at: p.created_at || new Date().toISOString(),
                    });
                    existingProgIds.add(p.id);
                  }
                }
              });
            }
          } catch (_) {}
        }
      });

      // -------------------------------------------------------------
      // 4. GROUP EVERYTHING BY LOCAL DATE STRING (YYYY-MM-DD)
      // -------------------------------------------------------------
      // Add Workouts to activity map
      workoutsList.forEach((w) => {
        const dateKey = toLocalDateString(w.start_time || w.created_at);
        if (!dateKey) return;

        if (!activityMap[dateKey]) {
          activityMap[dateKey] = {
            dateStr: dateKey,
            workouts: [],
            nutrition: null,
            progress: [],
            hasWorkout: false,
            hasNutrition: false,
            hasProgress: false,
          };
        }
        activityMap[dateKey].workouts.push(w);
        activityMap[dateKey].hasWorkout = true;
      });

      // Add Meals to activity map
      mealsList.forEach((m) => {
        const dateKey = toLocalDateString(m.meal_time || m.created_at);
        if (!dateKey) return;

        if (!activityMap[dateKey]) {
          activityMap[dateKey] = {
            dateStr: dateKey,
            workouts: [],
            nutrition: null,
            progress: [],
            hasWorkout: false,
            hasNutrition: false,
            hasProgress: false,
          };
        }

        if (!activityMap[dateKey].nutrition) {
          activityMap[dateKey].nutrition = {
            meals: [],
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            totalFiber: 0,
          };
        }

        const nut = activityMap[dateKey].nutrition!;
        nut.meals.push(m);
        nut.totalCalories += m.calories || 0;
        nut.totalProtein += m.protein || 0;
        nut.totalCarbs += m.carbohydrates || 0;
        nut.totalFat += m.fat || 0;
        nut.totalFiber += m.fiber || 0;
        activityMap[dateKey].hasNutrition = true;
      });

      // Add Progress to activity map
      progressList.forEach((p) => {
        const dateKey = toLocalDateString(p.recorded_at || p.created_at);
        if (!dateKey) return;

        if (!activityMap[dateKey]) {
          activityMap[dateKey] = {
            dateStr: dateKey,
            workouts: [],
            nutrition: null,
            progress: [],
            hasWorkout: false,
            hasNutrition: false,
            hasProgress: false,
          };
        }

        activityMap[dateKey].progress.push(p);
        activityMap[dateKey].hasProgress = true;
      });

      return {
        success: true,
        data: activityMap,
      };
    } catch (err: any) {
      console.error('Error fetching monthly activity:', err);
      return {
        success: false,
        data: activityMap,
        error: err?.message || 'Failed to load activity calendar.',
      };
    }
  },
};
