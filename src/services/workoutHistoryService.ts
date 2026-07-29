import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SavedWorkoutRecord } from './workoutSaveService';
import { ServiceResult } from '../types/workoutPersistence';

/**
 * Maps a raw Supabase workout_sessions record (with joined workout_exercises and workout_sets)
 * to a normalized SavedWorkoutRecord.
 */
function mapSessionToSavedRecord(session: any): SavedWorkoutRecord {
  const exercisesRaw = session.workout_exercises || [];

  // Preserve original exercise order (exercise_order ascending)
  const sortedExercises = [...exercisesRaw].sort(
    (a, b) => (a.exercise_order || 0) - (b.exercise_order || 0)
  );

  let totalSetsCount = 0;
  let totalRepsCount = 0;
  let totalWeightLifted = 0;

  const exercisesData = sortedExercises.map((ex: any) => {
    const setsRaw = ex.workout_sets || [];

    // Preserve original set order (set_number ascending)
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
      id: ex.id,
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
  const workoutDateStr = startTimeIso.split('T')[0];

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
 * Normalizes any raw record (e.g. from localStorage, legacy schema, or partial objects)
 * into a complete, safe SavedWorkoutRecord.
 */
function normalizeRecord(item: any): SavedWorkoutRecord {
  if (!item) {
    return {
      id: `w-${Date.now()}`,
      user_id: 'guest',
      workout_name: 'Workout Session',
      category_title: 'General Workout',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      duration_seconds: 1800,
      duration_minutes: 30,
      total_exercises: 1,
      total_sets: 1,
      total_reps: 10,
      total_weight_lifted: 0,
      exercises_data: [],
      completed: true,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      workout_date: new Date().toISOString().split('T')[0],
    };
  }

  const workoutName = item.workout_name || item.exercise_name || item.name || 'Workout Session';
  const categoryTitle = item.category_title || item.category || 'General Workout';
  const setsCount = Number(item.total_sets ?? item.sets) || 0;
  const repsCount = Number(item.total_reps ?? item.reps) || 0;
  const weightVal = Number(item.total_weight_lifted ?? item.weight) || 0;
  const durationSec = Number(item.duration_seconds) || (item.duration_minutes ? item.duration_minutes * 60 : 1800);
  const durationMins = Number(item.duration_minutes) || Math.max(1, Math.round(durationSec / 60));
  const rawCreatedAt = item.created_at || item.workout_date || item.completed_at || new Date().toISOString();
  const rawDate = item.workout_date || (typeof rawCreatedAt === 'string' && rawCreatedAt.includes('T') ? rawCreatedAt.split('T')[0] : rawCreatedAt);

  let rawExercises: any[] = [];
  if (Array.isArray(item.exercises_data)) {
    rawExercises = item.exercises_data;
  } else {
    rawExercises = [
      {
        id: item.id || 'ex-1',
        exercise_id: item.exercise_name || 'ex',
        name: item.exercise_name || workoutName,
        equipment: 'Standard',
        region_name: 'Workout',
        completed_sets: Array.isArray(item.completed_sets)
          ? item.completed_sets
          : Array.from({ length: Math.max(1, setsCount) }, (_, i) => ({
              set_number: i + 1,
              weight: weightVal,
              reps: repsCount,
            })),
      },
    ];
  }

  const normalizedExercises = rawExercises.map((ex: any, idx: number) => ({
    id: ex.id || `ex-${idx}`,
    exercise_id: ex.exercise_id || ex.name || 'ex',
    name: ex.name || ex.exercise_name || 'Exercise',
    equipment: ex.equipment || 'Standard',
    region_name: ex.region_name || ex.muscle_group || 'Workout',
    completed_sets: Array.isArray(ex.completed_sets)
      ? ex.completed_sets.map((s: any, sIdx: number) => ({
          set_number: Number(s.set_number) || sIdx + 1,
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
        }))
      : [],
  }));

  const calcTotalExercises = Number(item.total_exercises) || normalizedExercises.length;
  const calcTotalSets = setsCount || normalizedExercises.reduce((acc, ex) => acc + (ex.completed_sets?.length || 0), 0);

  return {
    id: item.id || `w-${Math.random().toString(36).substring(2, 9)}`,
    user_id: item.user_id || 'guest',
    workout_name: workoutName,
    category_title: categoryTitle,
    start_time: item.start_time || rawCreatedAt,
    end_time: item.end_time || item.completed_at || rawCreatedAt,
    duration_seconds: durationSec,
    duration_minutes: durationMins,
    total_exercises: calcTotalExercises,
    total_sets: calcTotalSets,
    total_reps: repsCount,
    total_weight_lifted: weightVal,
    exercises_data: normalizedExercises,
    completed: item.completed !== false,
    created_at: rawCreatedAt,
    completed_at: item.completed_at || rawCreatedAt,
    workout_date: rawDate,
  };
}

/**
 * Reads records stored in localStorage for guest/offline fallback.
 */
function getLocalStorageHistory(userId: string): SavedWorkoutRecord[] {
  try {
    const storageKey = `reppulse_workouts_${userId}`;
    const localStr = localStorage.getItem(storageKey);
    if (localStr) {
      const parsed = JSON.parse(localStr);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeRecord);
      }
    }
  } catch (err) {
    // Ignore parse error
  }
  return [];
}

export const WorkoutHistoryService = {
  /**
   * STEP 1 & 8: Fetch only completed workout sessions for current authenticated user.
   * Supports pagination (limit, offset) and relational fetching without N+1 queries.
   */
  async getWorkoutHistory(
    userId: string = 'guest',
    limit: number = 50,
    offset: number = 0
  ): Promise<ServiceResult<SavedWorkoutRecord[]>> {
    if (!isSupabaseConfigured || !supabase || userId === 'guest') {
      const localRecords = getLocalStorageHistory(userId);
      return { success: true, data: localRecords };
    }

    try {
      // 1. Relational query fetching session + exercises + sets in a single DB request
      const { data, error } = await supabase
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
            session_id,
            exercise_name,
            muscle_group,
            exercise_order,
            workout_sets (
              id,
              exercise_id,
              set_number,
              weight,
              reps,
              completed
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        // Fallback: Check legacy 'workouts' table or local storage
        const localRecords = getLocalStorageHistory(userId);
        return {
          success: true,
          data: localRecords,
          error: error.message,
        };
      }

      const records: SavedWorkoutRecord[] = (data || []).map(mapSessionToSavedRecord);

      // Merge local storage items for offline completeness without duplicates
      const localRecords = getLocalStorageHistory(userId);
      const existingIds = new Set(records.map((r) => r.id));
      localRecords.forEach((r) => {
        if (!existingIds.has(r.id)) {
          records.push(r);
        }
      });

      // Order descending by creation date
      records.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return { success: true, data: records };
    } catch (err: any) {
      console.warn('Network issue fetching workout history, falling back to local storage:', err);
      const localRecords = getLocalStorageHistory(userId);
      return {
        success: true,
        data: localRecords,
      };
    }
  },

  /**
   * STEP 3 & 8: Fetch detailed workout session information for a single workout.
   */
  async getWorkoutDetails(
    sessionId: string
  ): Promise<ServiceResult<SavedWorkoutRecord>> {
    if (!sessionId) {
      return {
        success: false,
        error: 'Invalid session ID provided.',
        code: 'INVALID_ID',
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      const allLocal = getLocalStorageHistory('guest');
      const found = allLocal.find((r) => r.id === sessionId);
      if (found) return { success: true, data: found };
      return {
        success: false,
        error: 'Workout session not found.',
        code: 'NOT_FOUND',
      };
    }

    try {
      const { data, error } = await supabase
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
            session_id,
            exercise_name,
            muscle_group,
            exercise_order,
            workout_sets (
              id,
              exercise_id,
              set_number,
              weight,
              reps,
              completed
            )
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error || !data) {
        const allLocal = getLocalStorageHistory('guest');
        const found = allLocal.find((r) => r.id === sessionId);
        if (found) return { success: true, data: found };
        return {
          success: false,
          error: error?.message || 'Workout session not found.',
          code: error?.code || 'NOT_FOUND',
        };
      }

      const record = mapSessionToSavedRecord(data);
      return { success: true, data: record };
    } catch (err: any) {
      console.warn('Network issue fetching workout details, checking local storage:', err);
      const allLocal = getLocalStorageHistory('guest');
      const found = allLocal.find((r) => r.id === sessionId);
      if (found) return { success: true, data: found };
      return {
        success: false,
        error: 'Unable to connect to server to load workout details.',
        code: 'NETWORK_ERROR',
      };
    }
  },

  /**
   * STEP 5 & 8: Search workout history by workout name, category, or exercise name.
   */
  async searchWorkoutHistory(
    userId: string,
    query: string
  ): Promise<SavedWorkoutRecord[]> {
    const result = await this.getWorkoutHistory(userId);
    if (!result.success || !result.data) return [];

    const q = query.trim().toLowerCase();
    if (!q) return result.data;

    return result.data.filter((r) => {
      const nameMatch = (r.workout_name || '').toLowerCase().includes(q);
      const catMatch = (r.category_title || '').toLowerCase().includes(q);
      const exMatch = r.exercises_data?.some(
        (e) => (e.name || '').toLowerCase().includes(q) || (e.region_name || '').toLowerCase().includes(q)
      );
      return nameMatch || catMatch || exMatch;
    });
  },

  /**
   * STEP 6, 7 & 8: Filter and sort workout history.
   */
  async filterWorkoutHistory(
    userId: string,
    options: {
      category?: string;
      dateRange?: string;
      sortBy?: 'newest' | 'oldest' | 'longest' | 'shortest' | 'most_exercises' | 'least_exercises';
    }
  ): Promise<SavedWorkoutRecord[]> {
    const result = await this.getWorkoutHistory(userId);
    if (!result.success || !result.data) return [];

    let filtered = [...result.data];

    // 1. Category Filter
    if (
      options.category &&
      options.category.toLowerCase() !== 'all' &&
      options.category.toLowerCase() !== 'all workouts'
    ) {
      const cat = options.category.toLowerCase();
      filtered = filtered.filter((r) => {
        const mainCat = (r.category_title || '').toLowerCase();
        const nameMatch = (r.workout_name || '').toLowerCase().includes(cat);
        const exMatch = r.exercises_data?.some(
          (e) =>
            (e.region_name || '').toLowerCase().includes(cat) ||
            (e.name || '').toLowerCase().includes(cat)
        );
        return mainCat.includes(cat) || nameMatch || exMatch;
      });
    }

    // 2. Date Range Filter
    if (options.dateRange) {
      const now = new Date();
      if (options.dateRange === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        filtered = filtered.filter((r) =>
          (r.workout_date || r.created_at || '').startsWith(todayStr)
        );
      } else if (options.dateRange === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        filtered = filtered.filter(
          (r) => new Date(r.workout_date || r.created_at || Date.now()) >= oneWeekAgo
        );
      } else if (options.dateRange === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(now.getDate() - 30);
        filtered = filtered.filter(
          (r) => new Date(r.workout_date || r.created_at || Date.now()) >= oneMonthAgo
        );
      }
    }

    // 3. Sorting Logic
    const sortBy = options.sortBy || 'newest';
    filtered.sort((a, b) => {
      const timeA = new Date(a.created_at || a.workout_date || Date.now()).getTime();
      const timeB = new Date(b.created_at || b.workout_date || Date.now()).getTime();

      switch (sortBy) {
        case 'oldest':
          return timeA - timeB;
        case 'longest':
          return (b.duration_minutes || 0) - (a.duration_minutes || 0);
        case 'shortest':
          return (a.duration_minutes || 0) - (b.duration_minutes || 0);
        case 'most_exercises':
          return (b.total_exercises || 0) - (a.total_exercises || 0);
        case 'least_exercises':
          return (a.total_exercises || 0) - (b.total_exercises || 0);
        case 'newest':
        default:
          return timeB - timeA;
      }
    });

    return filtered;
  },

  /**
   * Deletes a single workout history record by ID.
   */
  async deleteWorkoutRecord(recordId: string, userId: string = 'guest'): Promise<ServiceResult<boolean>> {
    try {
      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          const { data: userExercises } = await supabase
            .from('workout_exercises')
            .select('id')
            .eq('session_id', recordId);

          const exerciseIds = (userExercises || []).map((e) => e.id);
          if (exerciseIds.length > 0) {
            await supabase.from('workout_sets').delete().in('exercise_id', exerciseIds);
          }
          await supabase.from('workout_exercises').delete().eq('session_id', recordId);
          await supabase.from('workout_sessions').delete().eq('id', recordId).eq('user_id', userId);
          await supabase.from('workouts').delete().eq('id', recordId).eq('user_id', userId);
        } catch (dbErr) {
          console.warn('Supabase delete record error:', dbErr);
        }
      }

      try {
        const storageKey = `reppulse_workouts_${userId}`;
        const localStr = localStorage.getItem(storageKey);
        if (localStr) {
          const parsed = JSON.parse(localStr);
          if (Array.isArray(parsed)) {
            const updated = parsed.filter((r: any) => r.id !== recordId);
            localStorage.setItem(storageKey, JSON.stringify(updated));
          }
        }
      } catch (err) {
        // ignore
      }

      window.dispatchEvent(new Event('reppulse_workouts_updated'));
      return { success: true, data: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete workout record.' };
    }
  },

  /**
   * Backwards compatible method for fetching workout history.
   */
  async fetchWorkoutHistory(userId: string = 'guest'): Promise<SavedWorkoutRecord[]> {
    const result = await this.getWorkoutHistory(userId);
    return result.data || [];
  },
};

