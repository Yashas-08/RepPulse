import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ServiceResult } from '../types/workoutPersistence';
import { ActiveWorkoutSession } from '../types/workoutSession';
import { SavedWorkoutRecord } from './workoutSaveService';

export interface PersonalRecordData {
  id: string;
  user_id: string;
  exercise_name: string;
  highest_weight: number;
  highest_weight_date: string | null;
  highest_reps: number;
  highest_reps_date: string | null;
  highest_volume: number;
  highest_volume_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewlyAchievedPR {
  exerciseName: string;
  recordType: 'Highest Weight' | 'Highest Reps' | 'Highest Volume';
  value: string;
  oldValue: number;
  newValue: number;
}

// In-memory active cache
const prCache = new Map<string, PersonalRecordData>();

export const PersonalRecordService = {
  /**
   * Clears in-memory PR cache
   */
  clearCache(): void {
    prCache.clear();
  },

  /**
   * STEP 7: Fetch all Personal Records for a user
   */
  async getPersonalRecords(
    userId: string = 'guest'
  ): Promise<ServiceResult<PersonalRecordData[]>> {
    if (!userId) {
      return { success: true, data: [] };
    }

    const storageKey = `reppulse_prs_${userId}`;

    // Read local cache / storage first
    let localPRs: PersonalRecordData[] = [];
    try {
      const localStr = localStorage.getItem(storageKey);
      if (localStr) {
        localPRs = JSON.parse(localStr);
        localPRs.forEach((pr) => prCache.set(`${userId}:${pr.exercise_name.toLowerCase()}`, pr));
      }
    } catch {
      // Ignore JSON parse errors
    }

    if (!isSupabaseConfigured || !supabase || userId === 'guest') {
      return { success: true, data: localPRs };
    }

    try {
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', userId)
        .order('exercise_name', { ascending: true });

      if (error) {
        // If table doesn't exist yet, return local PRs without crashing
        if (error.code === '42P01') {
          return { success: true, data: localPRs };
        }
        return {
          success: false,
          error: 'Unable to load personal records.',
          code: error.code || 'QUERY_FAILED',
        };
      }

      const prList: PersonalRecordData[] = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        exercise_name: row.exercise_name,
        highest_weight: Number(row.highest_weight) || 0,
        highest_weight_date: row.highest_weight_date || null,
        highest_reps: Number(row.highest_reps) || 0,
        highest_reps_date: row.highest_reps_date || null,
        highest_volume: Number(row.highest_volume) || 0,
        highest_volume_date: row.highest_volume_date || null,
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
      }));

      // Cache and update localStorage
      prList.forEach((pr) => prCache.set(`${userId}:${pr.exercise_name.toLowerCase()}`, pr));
      localStorage.setItem(storageKey, JSON.stringify(prList));

      return { success: true, data: prList };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unable to load personal records.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * STEP 7: Fetch Personal Record for a specific exercise
   */
  async getExercisePersonalRecord(
    userId: string = 'guest',
    exerciseName: string
  ): Promise<ServiceResult<PersonalRecordData | null>> {
    if (!exerciseName || !exerciseName.trim()) {
      return { success: true, data: null };
    }

    const normName = exerciseName.trim().toLowerCase();
    const cacheKey = `${userId}:${normName}`;

    if (prCache.has(cacheKey)) {
      return { success: true, data: prCache.get(cacheKey) || null };
    }

    const allRes = await this.getPersonalRecords(userId);
    if (allRes.success && allRes.data) {
      const match = allRes.data.find(
        (pr) => pr.exercise_name.trim().toLowerCase() === normName
      );
      if (match) {
        prCache.set(cacheKey, match);
        return { success: true, data: match };
      }
    }

    return { success: true, data: null };
  },

  /**
   * STEP 7: Upsert or update a Personal Record for an exercise
   */
  async updatePersonalRecord(
    userId: string = 'guest',
    exerciseName: string,
    recordData: Partial<PersonalRecordData>
  ): Promise<ServiceResult<PersonalRecordData>> {
    const normName = exerciseName.trim();
    const cacheKey = `${userId}:${normName.toLowerCase()}`;
    const storageKey = `reppulse_prs_${userId}`;

    const existingRes = await this.getExercisePersonalRecord(userId, normName);
    const existing = existingRes.data;

    const nowIso = new Date().toISOString();
    const updatedRecord: PersonalRecordData = {
      id: existing?.id || `pr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      exercise_name: normName,
      highest_weight: recordData.highest_weight ?? existing?.highest_weight ?? 0,
      highest_weight_date:
        recordData.highest_weight_date ?? existing?.highest_weight_date ?? null,
      highest_reps: recordData.highest_reps ?? existing?.highest_reps ?? 0,
      highest_reps_date:
        recordData.highest_reps_date ?? existing?.highest_reps_date ?? null,
      highest_volume: recordData.highest_volume ?? existing?.highest_volume ?? 0,
      highest_volume_date:
        recordData.highest_volume_date ?? existing?.highest_volume_date ?? null,
      created_at: existing?.created_at || nowIso,
      updated_at: nowIso,
    };

    // Update in-memory cache
    prCache.set(cacheKey, updatedRecord);

    // Update localStorage
    try {
      const localStr = localStorage.getItem(storageKey);
      let localList: PersonalRecordData[] = localStr ? JSON.parse(localStr) : [];
      const idx = localList.findIndex(
        (pr) => pr.exercise_name.toLowerCase() === normName.toLowerCase()
      );
      if (idx >= 0) {
        localList[idx] = updatedRecord;
      } else {
        localList.push(updatedRecord);
      }
      localStorage.setItem(storageKey, JSON.stringify(localList));
    } catch {
      // Ignore local storage write errors
    }

    // Persist to Supabase if configured
    if (isSupabaseConfigured && supabase && userId !== 'guest') {
      try {
        const { data, error } = await supabase
          .from('personal_records')
          .upsert(
            {
              id: updatedRecord.id,
              user_id: userId,
              exercise_name: updatedRecord.exercise_name,
              highest_weight: updatedRecord.highest_weight,
              highest_weight_date: updatedRecord.highest_weight_date,
              highest_reps: updatedRecord.highest_reps,
              highest_reps_date: updatedRecord.highest_reps_date,
              highest_volume: updatedRecord.highest_volume,
              highest_volume_date: updatedRecord.highest_volume_date,
              updated_at: updatedRecord.updated_at,
            },
            { onConflict: 'user_id,exercise_name' }
          )
          .select()
          .single();

        if (error) {
          console.warn('Could not upsert to personal_records table:', error.message);
        } else if (data) {
          updatedRecord.id = data.id;
          prCache.set(cacheKey, updatedRecord);
        }
      } catch (dbErr) {
        console.warn('Database upsert failed for PR:', dbErr);
      }
    }

    return { success: true, data: updatedRecord };
  },

  /**
   * STEP 7: Calculate PRs when a workout session completes.
   * Compares each completed exercise against existing PRs and updates PRs only if performance is better.
   * Returns newly broken PRs for celebration.
   */
  async calculateWorkoutPRs(
    userId: string = 'guest',
    session: ActiveWorkoutSession | SavedWorkoutRecord
  ): Promise<ServiceResult<NewlyAchievedPR[]>> {
    const newlyAchieved: NewlyAchievedPR[] = [];

    // Extract exercises list from session or saved record
    const exercises: {
      name: string;
      completedSets: { weight: number; reps: number }[];
    }[] = [];

    const workoutDate =
      (session as SavedWorkoutRecord).workout_date ||
      (session as SavedWorkoutRecord).completed_at ||
      new Date().toISOString();

    if ('exercises' in session && Array.isArray(session.exercises)) {
      session.exercises.forEach((ex) => {
        const completedSets = ex.sets
          .filter((s) => s.completed)
          .map((s) => ({
            weight: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps, 10) || 0,
          }))
          .filter((s) => s.weight > 0 && s.reps > 0);

        if (completedSets.length > 0) {
          exercises.push({ name: ex.name, completedSets });
        }
      });
    } else if ('exercises_data' in session && Array.isArray(session.exercises_data)) {
      session.exercises_data.forEach((ex) => {
        const completedSets = (ex.completed_sets || [])
          .map((s) => ({
            weight: Number(s.weight) || 0,
            reps: Number(s.reps) || 0,
          }))
          .filter((s) => s.weight > 0 && s.reps > 0);

        if (completedSets.length > 0) {
          exercises.push({ name: ex.name, completedSets });
        }
      });
    }

    if (exercises.length === 0) {
      return { success: true, data: [] };
    }

    // Evaluate each exercise
    for (const ex of exercises) {
      const exerciseName = ex.name.trim();
      let maxWeight = 0;
      let maxReps = 0;
      let maxVolume = 0;

      ex.completedSets.forEach((set) => {
        if (set.weight > maxWeight) maxWeight = set.weight;
        if (set.reps > maxReps) maxReps = set.reps;
        const vol = set.weight * set.reps;
        if (vol > maxVolume) maxVolume = vol;
      });

      // Fetch existing PR
      const existingRes = await this.getExercisePersonalRecord(userId, exerciseName);
      const existingPr = existingRes.data;

      const currentWeightPR = existingPr?.highest_weight || 0;
      const currentRepsPR = existingPr?.highest_reps || 0;
      const currentVolumePR = existingPr?.highest_volume || 0;

      let isUpdated = false;
      const updates: Partial<PersonalRecordData> = {};

      // 1. Highest Weight comparison (higher weight wins; equal retains earliest)
      if (maxWeight > currentWeightPR) {
        updates.highest_weight = maxWeight;
        updates.highest_weight_date = workoutDate;
        isUpdated = true;
        newlyAchieved.push({
          exerciseName,
          recordType: 'Highest Weight',
          value: `${maxWeight} kg`,
          oldValue: currentWeightPR,
          newValue: maxWeight,
        });
      }

      // 2. Highest Reps comparison (higher reps win; equal retains earliest)
      if (maxReps > currentRepsPR) {
        updates.highest_reps = maxReps;
        updates.highest_reps_date = workoutDate;
        isUpdated = true;
        newlyAchieved.push({
          exerciseName,
          recordType: 'Highest Reps',
          value: `${maxReps} reps`,
          oldValue: currentRepsPR,
          newValue: maxReps,
        });
      }

      // 3. Highest Volume comparison (higher weight × reps wins; equal retains earliest)
      if (maxVolume > currentVolumePR) {
        updates.highest_volume = maxVolume;
        updates.highest_volume_date = workoutDate;
        isUpdated = true;
        newlyAchieved.push({
          exerciseName,
          recordType: 'Highest Volume',
          value: `${maxVolume} kg`,
          oldValue: currentVolumePR,
          newValue: maxVolume,
        });
      }

      // If any PR was beaten, persist update
      if (isUpdated) {
        await this.updatePersonalRecord(userId, exerciseName, updates);
      }
    }

    return { success: true, data: newlyAchieved };
  },
};
