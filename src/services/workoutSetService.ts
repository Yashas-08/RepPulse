import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  WorkoutSet,
  CreateWorkoutSetDTO,
  ServiceResult,
} from '../types/workoutPersistence';

export const WorkoutSetService = {
  /**
   * Creates a single set record for an exercise.
   */
  async createSet(dto: CreateWorkoutSetDTO): Promise<ServiceResult<WorkoutSet>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    try {
      const payload = {
        ...(dto.id ? { id: dto.id } : {}),
        exercise_id: dto.exercise_id,
        set_number: dto.set_number || 1,
        weight: dto.weight || 0,
        reps: dto.reps || 0,
        completed: dto.completed !== undefined ? dto.completed : false,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('workout_sets')
        .insert([payload])
        .select();

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to create set.',
          code: error.code || 'DB_INSERT_ERROR',
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'No data returned after creating set.',
          code: 'NO_DATA_RETURNED',
        };
      }

      return {
        success: true,
        data: data[0] as WorkoutSet,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while creating set.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Batch creates sets for multiple exercises or sets at once for high throughput.
   */
  async createSetsBatch(dtos: CreateWorkoutSetDTO[]): Promise<ServiceResult<WorkoutSet[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    if (dtos.length === 0) {
      return { success: true, data: [] };
    }

    try {
      const payloads = dtos.map((dto) => ({
        ...(dto.id ? { id: dto.id } : {}),
        exercise_id: dto.exercise_id,
        set_number: dto.set_number || 1,
        weight: dto.weight || 0,
        reps: dto.reps || 0,
        completed: dto.completed !== undefined ? dto.completed : false,
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('workout_sets')
        .insert(payloads)
        .select();

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to batch create sets.',
          code: error.code || 'BATCH_INSERT_ERROR',
        };
      }

      return {
        success: true,
        data: (data || []) as WorkoutSet[],
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred during batch set creation.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Fetches all sets for a given exercise ID.
   */
  async getExerciseSets(exerciseId: string): Promise<ServiceResult<WorkoutSet[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    try {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('exercise_id', exerciseId)
        .order('set_number', { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to fetch exercise sets.',
          code: error.code || 'FETCH_ERROR',
        };
      }

      return {
        success: true,
        data: (data || []) as WorkoutSet[],
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while fetching sets.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Batch fetches sets for an array of exercise IDs.
   */
  async getExercisesSetsBatch(exerciseIds: string[]): Promise<ServiceResult<WorkoutSet[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    if (exerciseIds.length === 0) {
      return { success: true, data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('*')
        .in('exercise_id', exerciseIds)
        .order('set_number', { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to fetch sets batch.',
          code: error.code || 'FETCH_ERROR',
        };
      }

      return {
        success: true,
        data: (data || []) as WorkoutSet[],
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while fetching sets batch.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Fetches a single set record by ID to check existence.
   */
  async getSetById(id: string): Promise<ServiceResult<WorkoutSet | null>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    try {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to fetch set by ID.',
          code: error.code || 'FETCH_ERROR',
        };
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          data: null,
        };
      }

      return {
        success: true,
        data: data[0] as WorkoutSet,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while fetching set.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Updates an existing set. Automatically creates the set row first if it does not exist in Supabase yet.
   */
  async updateSet(
    id: string,
    updates: Partial<CreateWorkoutSetDTO> & { exercise_id?: string; set_number?: number }
  ): Promise<ServiceResult<WorkoutSet>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    try {
      // Check if row already exists in Supabase
      const existingRes = await this.getSetById(id);
      if (existingRes.success && !existingRes.data) {
        // Row does NOT exist in Supabase! Create it first if exercise_id is available.
        if (updates.exercise_id) {
          const createRes = await this.createSet({
            id,
            exercise_id: updates.exercise_id,
            set_number: updates.set_number || 1,
            weight: updates.weight || 0,
            reps: updates.reps || 0,
            completed: updates.completed !== undefined ? updates.completed : false,
          });
          if (!createRes.success) {
            return createRes;
          }
          return createRes;
        }
      }

      const updatePayload: Record<string, any> = {};
      if (updates.weight !== undefined) updatePayload.weight = updates.weight;
      if (updates.reps !== undefined) updatePayload.reps = updates.reps;
      if (updates.completed !== undefined) updatePayload.completed = updates.completed;
      if (updates.set_number !== undefined) updatePayload.set_number = updates.set_number;
      if (updates.exercise_id !== undefined) updatePayload.exercise_id = updates.exercise_id;

      // Execute update without .single() to avoid PGRST116 errors
      const { data, error } = await supabase
        .from('workout_sets')
        .update(updatePayload)
        .eq('id', id)
        .select();

      if (error) {
        const errorDetailsStr = [
          error.message,
          error.details ? `Details: ${error.details}` : '',
          error.hint ? `Hint: ${error.hint}` : '',
        ]
          .filter(Boolean)
          .join(' | ');

        return {
          success: false,
          error: errorDetailsStr || 'Failed to update set.',
          code: error.code || 'UPDATE_ERROR',
        };
      }

      if (!data || data.length === 0) {
        // If 0 rows were updated, attempt creation if exercise_id is available
        if (updates.exercise_id) {
          return await this.createSet({
            id,
            exercise_id: updates.exercise_id,
            set_number: updates.set_number || 1,
            weight: updates.weight || 0,
            reps: updates.reps || 0,
            completed: updates.completed !== undefined ? updates.completed : false,
          });
        }
        return {
          success: false,
          error: 'Set record not found in cloud database.',
          code: 'SET_NOT_FOUND',
        };
      }

      return {
        success: true,
        data: data[0] as WorkoutSet,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while updating set.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Deletes a set by ID.
   */
  async deleteSet(id: string): Promise<ServiceResult<boolean>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    try {
      const { error } = await supabase.from('workout_sets').delete().eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to delete set.',
          code: error.code || 'DELETE_ERROR',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while deleting set.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },
};
