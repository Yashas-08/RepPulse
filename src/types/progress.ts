export interface ProgressLog {
  id: string;
  user_id: string;
  weight?: number | null;
  body_fat_percentage?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  left_arm?: number | null;
  right_arm?: number | null;
  left_thigh?: number | null;
  right_thigh?: number | null;
  left_calf?: number | null;
  right_calf?: number | null;
  neck?: number | null;
  height?: number | null;
  notes?: string | null;
  progress_photo_url?: string | null;
  recorded_at: string;
  created_at: string;
  updated_at?: string;
}

export interface AddProgressEntryInput {
  weight?: number | null;
  body_fat_percentage?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  left_arm?: number | null;
  right_arm?: number | null;
  left_thigh?: number | null;
  right_thigh?: number | null;
  left_calf?: number | null;
  right_calf?: number | null;
  neck?: number | null;
  height?: number | null;
  notes?: string;
  progress_photo_url?: string;
  recorded_at?: string;
}

export interface UpdateProgressEntryInput extends Partial<AddProgressEntryInput> {
  id: string;
}

export interface ProgressSummary {
  latestWeight: number | null;
  initialWeight: number | null;
  weightChange: number | null;
  completedWorkoutsCount: number;
  currentStreak: number;
  totalEntriesCount: number;
}

export interface ProgressServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
