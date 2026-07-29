import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  WorkoutExercise,
  CreateWorkoutExerciseDTO,
  ServiceResult,
} from '../types/workoutPersistence';

export const WorkoutExerciseService = {
  /**
   * Creates a single exercise in a workout session.
   */
  async createExercise(dto: CreateWorkoutExerciseDTO): Promise<ServiceResult<WorkoutExercise>> {
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
        session_id: dto.session_id,
        exercise_name: dto.exercise_name,
        muscle_group: dto.muscle_group || null,
        exercise_order: dto.exercise_order || 1,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('workout_exercises')
        .insert([payload])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to create exercise.',
          code: error.code || 'DB_INSERT_ERROR',
        };
      }

      return {
        success: true,
        data: data as WorkoutExercise,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while creating exercise.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Batch creates multiple exercises for performance optimization.
   */
  async createExercisesBatch(
    dtos: CreateWorkoutExerciseDTO[]
  ): Promise<ServiceResult<WorkoutExercise[]>> {
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
        session_id: dto.session_id,
        exercise_name: dto.exercise_name,
        muscle_group: dto.muscle_group || null,
        exercise_order: dto.exercise_order || 1,
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('workout_exercises')
        .insert(payloads)
        .select();

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to batch create exercises.',
          code: error.code || 'BATCH_INSERT_ERROR',
        };
      }

      return {
        success: true,
        data: (data || []) as WorkoutExercise[],
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred during batch exercise insert.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Fetches all exercises associated with a given session ID.
   */
  async getSessionExercises(sessionId: string): Promise<ServiceResult<WorkoutExercise[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('session_id', sessionId)
        .order('exercise_order', { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to fetch session exercises.',
          code: error.code || 'FETCH_ERROR',
        };
      }

      return {
        success: true,
        data: (data || []) as WorkoutExercise[],
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while fetching exercises.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Updates an exercise record by ID.
   */
  async updateExercise(
    id: string,
    updates: Partial<CreateWorkoutExerciseDTO>
  ): Promise<ServiceResult<WorkoutExercise>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to update exercise.',
          code: error.code || 'UPDATE_ERROR',
        };
      }

      return {
        success: true,
        data: data as WorkoutExercise,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while updating exercise.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Deletes an exercise by ID.
   */
  async deleteExercise(id: string): Promise<ServiceResult<boolean>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    try {
      const { error } = await supabase.from('workout_exercises').delete().eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to delete exercise.',
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
        error: err?.message || 'An unexpected error occurred while deleting exercise.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },
};
