import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  ProgressLog,
  AddProgressEntryInput,
  UpdateProgressEntryInput,
  ProgressSummary,
  ProgressServiceResult,
} from '../types/progress';

const LOCAL_PROGRESS_KEY_PREFIX = 'reppulse_progress_history_';
const LOCAL_WEIGHT_KEY_PREFIX = 'reppulse_weight_history_';

/**
 * Normalizes any database or raw object into a complete ProgressLog
 */
function normalizeProgressRecord(raw: any): ProgressLog {
  const recordedAt = raw.recorded_at || raw.created_at || new Date().toISOString();
  return {
    id: raw.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prog_${Date.now()}`),
    user_id: raw.user_id || 'guest',
    weight: raw.weight !== undefined && raw.weight !== null ? Number(raw.weight) : null,
    body_fat_percentage: raw.body_fat_percentage !== undefined && raw.body_fat_percentage !== null ? Number(raw.body_fat_percentage) : null,
    chest: raw.chest !== undefined && raw.chest !== null ? Number(raw.chest) : null,
    waist: raw.waist !== undefined && raw.waist !== null ? Number(raw.waist) : null,
    hips: raw.hips !== undefined && raw.hips !== null ? Number(raw.hips) : null,
    left_arm: raw.left_arm !== undefined && raw.left_arm !== null ? Number(raw.left_arm) : null,
    right_arm: raw.right_arm !== undefined && raw.right_arm !== null ? Number(raw.right_arm) : null,
    left_thigh: raw.left_thigh !== undefined && raw.left_thigh !== null ? Number(raw.left_thigh) : null,
    right_thigh: raw.right_thigh !== undefined && raw.right_thigh !== null ? Number(raw.right_thigh) : null,
    left_calf: raw.left_calf !== undefined && raw.left_calf !== null ? Number(raw.left_calf) : null,
    right_calf: raw.right_calf !== undefined && raw.right_calf !== null ? Number(raw.right_calf) : null,
    neck: raw.neck !== undefined && raw.neck !== null ? Number(raw.neck) : null,
    height: raw.height !== undefined && raw.height !== null ? Number(raw.height) : null,
    notes: raw.notes || '',
    progress_photo_url: raw.progress_photo_url || null,
    recorded_at: recordedAt,
    created_at: raw.created_at || recordedAt,
    updated_at: raw.updated_at || undefined,
  };
}

/**
 * Get local cached progress logs
 */
function getLocalProgressLogs(userId: string): ProgressLog[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_PROGRESS_KEY_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeProgressRecord);
      }
    }

    // Fallback to weight_history in local storage if progress_history doesn't exist
    const rawWeight = localStorage.getItem(`${LOCAL_WEIGHT_KEY_PREFIX}${userId}`);
    if (rawWeight) {
      const parsedWeight = JSON.parse(rawWeight);
      if (Array.isArray(parsedWeight)) {
        return parsedWeight.map((w: any) => normalizeProgressRecord({
          id: w.id,
          user_id: w.user_id || userId,
          weight: w.weight,
          created_at: w.created_at,
          recorded_at: w.created_at,
        }));
      }
    }

    return [];
  } catch (err) {
    console.error('Error reading local progress logs:', err);
    return [];
  }
}

/**
 * Save local cached progress logs
 */
function saveLocalProgressLogs(userId: string, logs: ProgressLog[]): void {
  try {
    localStorage.setItem(`${LOCAL_PROGRESS_KEY_PREFIX}${userId}`, JSON.stringify(logs));
    
    // Also sync weight_history in local storage
    const weightRecords = logs
      .filter((l) => l.weight !== null && l.weight !== undefined)
      .map((l) => ({
        id: l.id,
        user_id: l.user_id,
        weight: l.weight,
        created_at: l.recorded_at || l.created_at,
      }));
    localStorage.setItem(`${LOCAL_WEIGHT_KEY_PREFIX}${userId}`, JSON.stringify(weightRecords));
  } catch (err) {
    console.error('Error saving local progress logs:', err);
  }
}

/**
 * Notify application of progress/weight state changes
 */
function notifyProgressUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('reppulse_progress_updated'));
    window.dispatchEvent(new Event('reppulse_weight_updated'));
  }
}

export const ProgressService = {
  /**
   * Retrieves user's progress logs sorted newest first
   */
  async getProgressHistory(
    userId: string = 'guest'
  ): Promise<ProgressServiceResult<ProgressLog[]>> {
    try {
      let fetchedFromDb = false;
      let logs: ProgressLog[] = [];

      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          // 1. Primary: Try fetching from progress_logs table
          const { data, error } = await supabase
            .from('progress_logs')
            .select('*')
            .eq('user_id', userId)
            .order('recorded_at', { ascending: false });

          if (!error && data && data.length > 0) {
            logs = data.map(normalizeProgressRecord);
            fetchedFromDb = true;
          } else {
            // 2. Fallback: Try fetching from weight_history table
            const { data: weightData, error: weightError } = await supabase
              .from('weight_history')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });

            if (!weightError && weightData && weightData.length > 0) {
              logs = weightData.map((w) =>
                normalizeProgressRecord({
                  id: w.id,
                  user_id: w.user_id,
                  weight: w.weight,
                  recorded_at: w.created_at,
                  created_at: w.created_at,
                })
              );
              fetchedFromDb = true;
            }
          }
        } catch (dbErr) {
          console.warn('Supabase fetch failed for progress logs:', dbErr);
        }
      }

      if (!fetchedFromDb) {
        logs = getLocalProgressLogs(userId);
      } else {
        saveLocalProgressLogs(userId, logs);
      }

      // Ensure sorted newest first
      logs.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

      return { success: true, data: logs };
    } catch (err: unknown) {
      console.warn('Error in getProgressLogs, returning local fallback:', err);
      const localLogs = getLocalProgressLogs(userId);
      return {
        success: true,
        data: localLogs,
      };
    }
  },

  /**
   * Adds a new progress entry
   */
  async addProgressEntry(
    input: AddProgressEntryInput,
    userId: string = 'guest'
  ): Promise<ProgressServiceResult<ProgressLog>> {
    try {
      const now = new Date().toISOString();
      const recordedAt = input.recorded_at || now;
      const newId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `prog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const newLog: ProgressLog = {
        id: newId,
        user_id: userId,
        weight: input.weight !== undefined && input.weight !== null ? Number(input.weight) : null,
        body_fat_percentage: input.body_fat_percentage !== undefined && input.body_fat_percentage !== null ? Number(input.body_fat_percentage) : null,
        chest: input.chest !== undefined && input.chest !== null ? Number(input.chest) : null,
        waist: input.waist !== undefined && input.waist !== null ? Number(input.waist) : null,
        hips: input.hips !== undefined && input.hips !== null ? Number(input.hips) : null,
        left_arm: input.left_arm !== undefined && input.left_arm !== null ? Number(input.left_arm) : null,
        right_arm: input.right_arm !== undefined && input.right_arm !== null ? Number(input.right_arm) : null,
        left_thigh: input.left_thigh !== undefined && input.left_thigh !== null ? Number(input.left_thigh) : null,
        right_thigh: input.right_thigh !== undefined && input.right_thigh !== null ? Number(input.right_thigh) : null,
        left_calf: input.left_calf !== undefined && input.left_calf !== null ? Number(input.left_calf) : null,
        right_calf: input.right_calf !== undefined && input.right_calf !== null ? Number(input.right_calf) : null,
        neck: input.neck !== undefined && input.neck !== null ? Number(input.neck) : null,
        height: input.height !== undefined && input.height !== null ? Number(input.height) : null,
        notes: (input.notes || '').trim(),
        progress_photo_url: input.progress_photo_url || null,
        recorded_at: recordedAt,
        created_at: now,
        updated_at: now,
      };

      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          // 1. Try insert into progress_logs
          const { error: progErr } = await supabase.from('progress_logs').insert({
            id: newLog.id,
            user_id: userId,
            weight: newLog.weight,
            body_fat_percentage: newLog.body_fat_percentage,
            chest: newLog.chest,
            waist: newLog.waist,
            hips: newLog.hips,
            left_arm: newLog.left_arm,
            right_arm: newLog.right_arm,
            left_thigh: newLog.left_thigh,
            right_thigh: newLog.right_thigh,
            left_calf: newLog.left_calf,
            right_calf: newLog.right_calf,
            neck: newLog.neck,
            height: newLog.height,
            notes: newLog.notes,
            progress_photo_url: newLog.progress_photo_url,
            recorded_at: newLog.recorded_at,
            created_at: newLog.created_at,
            updated_at: newLog.updated_at,
          });

          if (progErr) {
            console.warn('progress_logs insert note:', progErr.message);
          }

          // 2. Insert into weight_history for legacy support if weight provided
          if (newLog.weight !== null) {
            await supabase.from('weight_history').insert({
              id: newLog.id,
              user_id: userId,
              weight: newLog.weight,
              created_at: newLog.recorded_at,
            });

            // 3. Update profiles weight
            await supabase
              .from('profiles')
              .update({
                weight: newLog.weight.toString(),
                updated_at: now,
              })
              .eq('id', userId);
          }
        } catch (dbErr) {
          console.warn('Supabase save error for progress log:', dbErr);
        }
      }

      // Sync local storage
      const existing = getLocalProgressLogs(userId);
      saveLocalProgressLogs(userId, [newLog, ...existing]);

      notifyProgressUpdated();

      return { success: true, data: newLog };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add progress entry.';
      return { success: false, error: message, code: 'ADD_PROGRESS_ERROR' };
    }
  },

  /**
   * Updates an existing progress entry
   */
  async updateProgressEntry(
    input: UpdateProgressEntryInput,
    userId: string = 'guest'
  ): Promise<ProgressServiceResult<ProgressLog>> {
    try {
      if (!input.id) {
        return { success: false, error: 'Progress log ID is required.', code: 'INVALID_INPUT' };
      }

      const now = new Date().toISOString();
      const existing = getLocalProgressLogs(userId);
      const target = existing.find((p) => p.id === input.id);

      const updatedLog: ProgressLog = {
        id: input.id,
        user_id: userId,
        weight: input.weight !== undefined ? (input.weight !== null ? Number(input.weight) : null) : target?.weight ?? null,
        body_fat_percentage: input.body_fat_percentage !== undefined ? (input.body_fat_percentage !== null ? Number(input.body_fat_percentage) : null) : target?.body_fat_percentage ?? null,
        chest: input.chest !== undefined ? (input.chest !== null ? Number(input.chest) : null) : target?.chest ?? null,
        waist: input.waist !== undefined ? (input.waist !== null ? Number(input.waist) : null) : target?.waist ?? null,
        hips: input.hips !== undefined ? (input.hips !== null ? Number(input.hips) : null) : target?.hips ?? null,
        left_arm: input.left_arm !== undefined ? (input.left_arm !== null ? Number(input.left_arm) : null) : target?.left_arm ?? null,
        right_arm: input.right_arm !== undefined ? (input.right_arm !== null ? Number(input.right_arm) : null) : target?.right_arm ?? null,
        left_thigh: input.left_thigh !== undefined ? (input.left_thigh !== null ? Number(input.left_thigh) : null) : target?.left_thigh ?? null,
        right_thigh: input.right_thigh !== undefined ? (input.right_thigh !== null ? Number(input.right_thigh) : null) : target?.right_thigh ?? null,
        left_calf: input.left_calf !== undefined ? (input.left_calf !== null ? Number(input.left_calf) : null) : target?.left_calf ?? null,
        right_calf: input.right_calf !== undefined ? (input.right_calf !== null ? Number(input.right_calf) : null) : target?.right_calf ?? null,
        neck: input.neck !== undefined ? (input.neck !== null ? Number(input.neck) : null) : target?.neck ?? null,
        height: input.height !== undefined ? (input.height !== null ? Number(input.height) : null) : target?.height ?? null,
        notes: input.notes !== undefined ? input.notes.trim() : target?.notes || '',
        progress_photo_url: input.progress_photo_url !== undefined ? input.progress_photo_url : target?.progress_photo_url ?? null,
        recorded_at: input.recorded_at || target?.recorded_at || now,
        created_at: target?.created_at || now,
        updated_at: now,
      };

      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          // Update progress_logs
          const { error: progErr } = await supabase
            .from('progress_logs')
            .update({
              weight: updatedLog.weight,
              body_fat_percentage: updatedLog.body_fat_percentage,
              chest: updatedLog.chest,
              waist: updatedLog.waist,
              hips: updatedLog.hips,
              left_arm: updatedLog.left_arm,
              right_arm: updatedLog.right_arm,
              left_thigh: updatedLog.left_thigh,
              right_thigh: updatedLog.right_thigh,
              left_calf: updatedLog.left_calf,
              right_calf: updatedLog.right_calf,
              neck: updatedLog.neck,
              height: updatedLog.height,
              notes: updatedLog.notes,
              progress_photo_url: updatedLog.progress_photo_url,
              recorded_at: updatedLog.recorded_at,
              updated_at: updatedLog.updated_at,
            })
            .eq('id', input.id)
            .eq('user_id', userId);

          if (progErr) {
            console.warn('progress_logs update note:', progErr.message);
          }

          // Also update weight_history if weight present
          if (updatedLog.weight !== null) {
            await supabase
              .from('weight_history')
              .update({
                weight: updatedLog.weight,
              })
              .eq('id', input.id)
              .eq('user_id', userId);

            await supabase
              .from('profiles')
              .update({
                weight: updatedLog.weight.toString(),
                updated_at: now,
              })
              .eq('id', userId);
          }
        } catch (dbErr) {
          console.warn('Supabase update error for progress log:', dbErr);
        }
      }

      // Sync local storage
      const updatedList = existing.map((p) => (p.id === input.id ? updatedLog : p));
      saveLocalProgressLogs(userId, updatedList);

      notifyProgressUpdated();

      return { success: true, data: updatedLog };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update progress entry.';
      return { success: false, error: message, code: 'UPDATE_PROGRESS_ERROR' };
    }
  },

  /**
   * Deletes a progress entry
   */
  async deleteProgressEntry(
    id: string,
    userId: string = 'guest'
  ): Promise<ProgressServiceResult<boolean>> {
    try {
      if (!id) {
        return { success: false, error: 'Progress entry ID is required.', code: 'INVALID_INPUT' };
      }

      const existing = getLocalProgressLogs(userId);
      const target = existing.find((p) => p.id === id);

      // If photo attached, attempt removal
      if (target?.progress_photo_url) {
        await this.deleteProgressPhoto(target.progress_photo_url, userId);
      }

      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          await supabase.from('progress_logs').delete().eq('id', id).eq('user_id', userId);
          await supabase.from('weight_history').delete().eq('id', id).eq('user_id', userId);
        } catch (dbErr) {
          console.warn('Supabase delete error for progress entry:', dbErr);
        }
      }

      // Filter local
      const filtered = existing.filter((p) => p.id !== id);
      saveLocalProgressLogs(userId, filtered);

      notifyProgressUpdated();

      return { success: true, data: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete progress entry.';
      return { success: false, error: message, code: 'DELETE_PROGRESS_ERROR' };
    }
  },

  /**
   * Uploads progress photo to Supabase storage or converts to data URL
   */
  async uploadProgressPhoto(
    file: File,
    userId: string = 'guest'
  ): Promise<ProgressServiceResult<string>> {
    try {
      if (!file) {
        return { success: false, error: 'No image file provided.', code: 'INVALID_INPUT' };
      }

      // 1. Try uploading to Supabase Storage if configured
      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('progress_photos')
            .upload(fileName, file, { upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('progress_photos')
              .getPublicUrl(fileName);

            if (urlData?.publicUrl) {
              return { success: true, data: urlData.publicUrl };
            }
          }
        } catch (storageErr) {
          console.warn('Supabase storage upload failed, using Data URL fallback:', storageErr);
        }
      }

      // 2. Local fallback using FileReader -> Base64 Data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve({ success: true, data: result });
        };
        reader.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to read photo file.',
            code: 'FILE_READ_ERROR',
          });
        };
        reader.readAsDataURL(file);
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload photo.';
      return { success: false, error: message, code: 'UPLOAD_PHOTO_ERROR' };
    }
  },

  /**
   * Deletes a progress photo from Supabase storage
   */
  async deleteProgressPhoto(
    photoUrl: string,
    userId: string = 'guest'
  ): Promise<ProgressServiceResult<boolean>> {
    try {
      if (!photoUrl || !photoUrl.startsWith('http')) {
        return { success: true, data: true };
      }

      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          const urlObj = new URL(photoUrl);
          const pathParts = urlObj.pathname.split('progress_photos/');
          if (pathParts.length > 1) {
            const filePath = pathParts[1];
            await supabase.storage.from('progress_photos').remove([filePath]);
          }
        } catch (err) {
          console.warn('Error deleting photo from storage:', err);
        }
      }

      return { success: true, data: true };
    } catch (err: unknown) {
      return { success: false, error: 'Failed to delete photo object.', code: 'DELETE_PHOTO_ERROR' };
    }
  },
};
