import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface DataOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const DataManagementService = {
  /**
   * Delete Workout History
   * - Deletes all workout sessions, workout exercises, workout sets, and personal records for current user
   */
  async deleteWorkoutHistory(userId: string = 'guest'): Promise<DataOperationResult> {
    try {
      // 1. Supabase clean up if configured and authenticated
      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          // Fetch session IDs for current user to handle child relationships
          const { data: userSessions } = await supabase
            .from('workout_sessions')
            .select('id')
            .eq('user_id', userId);

          const sessionIds = (userSessions || []).map((s) => s.id);

          if (sessionIds.length > 0) {
            // Find exercises linked to these sessions
            const { data: userExercises } = await supabase
              .from('workout_exercises')
              .select('id')
              .in('session_id', sessionIds);

            const exerciseIds = (userExercises || []).map((e) => e.id);

            // Delete sets first
            if (exerciseIds.length > 0) {
              await supabase.from('workout_sets').delete().in('exercise_id', exerciseIds);
            }

            // Delete exercises
            await supabase.from('workout_exercises').delete().in('session_id', sessionIds);

            // Delete sessions
            await supabase.from('workout_sessions').delete().eq('user_id', userId);
          }

          // Delete from legacy workouts table
          await supabase.from('workouts').delete().eq('user_id', userId);

          // Delete personal records
          await supabase.from('personal_records').delete().eq('user_id', userId);
        } catch (dbErr) {
          console.warn('Supabase workout history deletion error:', dbErr);
        }
      }

      // 2. Local Storage clean up
      localStorage.removeItem(`reppulse_workouts_${userId}`);
      localStorage.removeItem(`reppulse_prs_${userId}`);
      localStorage.removeItem('reppulse_active_session');

      // 3. Dispatch global events
      window.dispatchEvent(new Event('reppulse_workouts_updated'));
      window.dispatchEvent(new Event('reppulse_weight_updated'));

      return { success: true, message: 'Workout history deleted.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete workout history.' };
    }
  },

  /**
   * Reset Workout Data
   * - Deletes all workout-related data, resets streak, resets dashboard statistics & today's status
   */
  async resetWorkoutData(userId: string = 'guest'): Promise<DataOperationResult> {
    try {
      // First delete all history
      await this.deleteWorkoutHistory(userId);

      // Reset streak and stats in profile if stored
      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          await supabase
            .from('profiles')
            .update({
              streak: 0,
              workout_streak: 0,
              total_workouts: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        } catch (dbErr) {
          console.warn('Profile streak reset error in Supabase:', dbErr);
        }
      }

      // Local profile update
      const localProfileKey = `reppulse_profile_${userId}`;
      const existingProfileStr = localStorage.getItem(localProfileKey);
      if (existingProfileStr) {
        try {
          const profileObj = JSON.parse(existingProfileStr);
          profileObj.streak = 0;
          profileObj.workout_streak = 0;
          profileObj.total_workouts = 0;
          localStorage.setItem(localProfileKey, JSON.stringify(profileObj));
        } catch {
          // ignore
        }
      }

      // Active session removal
      localStorage.removeItem('reppulse_active_session');

      // Dispatch global events
      window.dispatchEvent(new Event('reppulse_workouts_updated'));
      window.dispatchEvent(new Event('reppulse_weight_updated'));

      return { success: true, message: 'Workout data reset.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to reset workout data.' };
    }
  },

  /**
   * Delete Meal History
   * - Deletes all meal logs for current user
   */
  async deleteMealHistory(userId: string = 'guest'): Promise<DataOperationResult> {
    try {
      // 1. Supabase clean up
      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          await supabase.from('nutrition_logs').delete().eq('user_id', userId);
          await supabase.from('meals').delete().eq('user_id', userId);
        } catch (dbErr) {
          console.warn('Supabase meal deletion error:', dbErr);
        }
      }

      // 2. Local Storage clean up
      localStorage.removeItem(`reppulse_meals_${userId}`);

      // 3. Dispatch global event
      window.dispatchEvent(new Event('reppulse_nutrition_updated'));

      return { success: true, message: 'Meal history deleted.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete meal history.' };
    }
  },

  /**
   * Reset Nutrition Data
   * - Deletes all meals, resets calories, macros, and dashboard stats
   */
  async resetNutritionData(userId: string = 'guest'): Promise<DataOperationResult> {
    try {
      // Deleting meals resets all summed totals to 0
      await this.deleteMealHistory(userId);

      window.dispatchEvent(new Event('reppulse_nutrition_updated'));

      return { success: true, message: 'Nutrition data reset.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to reset nutrition data.' };
    }
  },

  /**
   * Delete Progress History
   * - Deletes weight history, body measurements, progress logs
   */
  async deleteProgressHistory(userId: string = 'guest'): Promise<DataOperationResult> {
    try {
      // 1. Supabase clean up
      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          await supabase.from('progress_logs').delete().eq('user_id', userId);
          await supabase.from('weight_history').delete().eq('user_id', userId);
          await supabase.from('progress_photos').delete().eq('user_id', userId);
        } catch (dbErr) {
          console.warn('Supabase progress deletion error:', dbErr);
        }
      }

      // 2. Local Storage clean up
      localStorage.removeItem(`reppulse_progress_history_${userId}`);
      localStorage.removeItem(`reppulse_weight_history_${userId}`);

      // 3. Dispatch global events
      window.dispatchEvent(new Event('reppulse_progress_updated'));
      window.dispatchEvent(new Event('reppulse_weight_updated'));

      return { success: true, message: 'Progress history deleted.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete progress history.' };
    }
  },

  /**
   * Reset Progress Data
   * - Resets progress charts, current statistics, and removes historical entries
   */
  async resetProgressData(userId: string = 'guest'): Promise<DataOperationResult> {
    try {
      await this.deleteProgressHistory(userId);

      window.dispatchEvent(new Event('reppulse_progress_updated'));
      window.dispatchEvent(new Event('reppulse_weight_updated'));

      return { success: true, message: 'Progress data reset.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to reset progress data.' };
    }
  },

  /**
   * Reset All User Data
   * - Wipes workout, nutrition, and progress data
   */
  async resetAllUserData(userId: string = 'guest'): Promise<DataOperationResult> {
    try {
      await this.resetWorkoutData(userId);
      await this.resetNutritionData(userId);
      await this.resetProgressData(userId);

      return { success: true, message: 'All user data has been reset.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to reset all user data.' };
    }
  },
};
