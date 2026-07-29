import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  WorkoutSession,
  CreateWorkoutSessionDTO,
  SessionStatus,
  ServiceResult,
} from '../types/workoutPersistence';

export const WorkoutSessionService = {
  /**
   * Alias / wrapper for creating a workout session (Phase A.2 explicitly named method)
   */
  async createWorkoutSession(dto: CreateWorkoutSessionDTO): Promise<ServiceResult<WorkoutSession>> {
    return this.createSession({
      ...dto,
      status: dto.status || 'active',
    });
  },

  /**
   * Fetches the current active workout session for a user (status = 'active').
   */
  async getActiveWorkoutSession(userId: string): Promise<ServiceResult<WorkoutSession | null>> {
    if (!isSupabaseConfigured || !supabase || userId === 'guest') {
      return {
        success: true,
        data: null,
      };
    }

    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return {
          success: true,
          data: null,
        };
      }

      return {
        success: true,
        data: (data as WorkoutSession) || null,
      };
    } catch (err: any) {
      console.warn('Network issue checking active workout session:', err);
      return {
        success: true,
        data: null,
      };
    }
  },

  /**
   * Updates an existing workout session with dynamic fields.
   */
  async updateWorkoutSession(
    id: string,
    updates: Partial<WorkoutSession>
  ): Promise<ServiceResult<WorkoutSession>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    if (!id) {
      return {
        success: false,
        error: 'Invalid session ID provided.',
        code: 'INVALID_ID',
      };
    }

    try {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('workout_sessions')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to update workout session.',
          code: error.code || 'UPDATE_ERROR',
        };
      }

      return {
        success: true,
        data: data as WorkoutSession,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unexpected error while updating workout session.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Completes an active workout session.
   */
  async completeWorkoutSession(
    id: string,
    durationSeconds: number
  ): Promise<ServiceResult<WorkoutSession>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    if (!id) {
      return {
        success: false,
        error: 'Invalid session ID provided.',
        code: 'INVALID_ID',
      };
    }

    try {
      // First check session status to prevent finishing an already completed session
      const { data: existing, error: checkErr } = await supabase
        .from('workout_sessions')
        .select('status')
        .eq('id', id)
        .maybeSingle();

      if (checkErr) {
        return {
          success: false,
          error: checkErr.message || 'Failed to verify session status.',
          code: 'STATUS_CHECK_FAILED',
        };
      }

      if (existing && existing.status === 'completed') {
        return {
          success: false,
          error: 'Workout session is already completed.',
          code: 'ALREADY_COMPLETED',
        };
      }

      const updates = {
        status: 'completed' as SessionStatus,
        ended_at: new Date().toISOString(),
        duration_seconds: Math.max(0, durationSeconds),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('workout_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to complete workout session.',
          code: error.code || 'COMPLETE_ERROR',
        };
      }

      return {
        success: true,
        data: data as WorkoutSession,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unexpected error while completing session.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Deletes a workout session by ID (cancels / discards).
   */
  async deleteWorkoutSession(id: string): Promise<ServiceResult<boolean>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    if (!id) {
      return {
        success: false,
        error: 'Invalid session ID provided.',
        code: 'INVALID_ID',
      };
    }

    try {
      // Prevent deleting completed sessions
      const { data: existing } = await supabase
        .from('workout_sessions')
        .select('status')
        .eq('id', id)
        .maybeSingle();

      if (existing && existing.status === 'completed') {
        return {
          success: false,
          error: 'Cannot delete a completed workout session.',
          code: 'CANNOT_DELETE_COMPLETED',
        };
      }

      const { error } = await supabase.from('workout_sessions').delete().eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to delete workout session.',
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
        error: err?.message || 'Unexpected error while deleting session.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },
  async createSession(dto: CreateWorkoutSessionDTO): Promise<ServiceResult<WorkoutSession>> {
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
        user_id: dto.user_id,
        workout_name: dto.workout_name,
        category: dto.category || 'Strength',
        started_at: dto.started_at || new Date().toISOString(),
        ended_at: dto.ended_at || null,
        duration_seconds: dto.duration_seconds || 0,
        status: dto.status || 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('workout_sessions')
        .insert([payload])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to create workout session.',
          code: error.code || 'DB_INSERT_ERROR',
        };
      }

      return {
        success: true,
        data: data as WorkoutSession,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while creating session.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Fetches a single session by ID.
   */
  async getSessionById(id: string): Promise<ServiceResult<WorkoutSession>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message || 'Workout session not found.',
          code: error.code || 'NOT_FOUND',
        };
      }

      return {
        success: true,
        data: data as WorkoutSession,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while fetching session.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Fetches all workout sessions for a given user ordered by start time.
   */
  async getUserSessions(
    userId: string,
    limit: number = 50
  ): Promise<ServiceResult<WorkoutSession[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to fetch user sessions.',
          code: error.code || 'FETCH_ERROR',
        };
      }

      return {
        success: true,
        data: (data || []) as WorkoutSession[],
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while fetching user sessions.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Updates status, end time, and duration of a session.
   */
  async updateSessionStatus(
    id: string,
    status: SessionStatus,
    endedAt?: string,
    durationSeconds?: number
  ): Promise<ServiceResult<WorkoutSession>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    try {
      const updates: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (endedAt) updates.ended_at = endedAt;
      if (durationSeconds !== undefined) updates.duration_seconds = durationSeconds;

      const { data, error } = await supabase
        .from('workout_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to update session status.',
          code: error.code || 'UPDATE_ERROR',
        };
      }

      return {
        success: true,
        data: data as WorkoutSession,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while updating session.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },

  /**
   * Deletes a session by ID (cascades to exercises and sets via Foreign Keys).
   */
  async deleteSession(id: string): Promise<ServiceResult<boolean>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        code: 'CLIENT_NOT_CONFIGURED',
      };
    }

    try {
      const { error } = await supabase.from('workout_sessions').delete().eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to delete session.',
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
        error: err?.message || 'An unexpected error occurred while deleting session.',
        code: 'UNEXPECTED_ERROR',
      };
    }
  },
};
