export type SessionStatus = 'active' | 'completed' | 'discarded';

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_name: string;
  category: string;
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  session_id: string;
  exercise_name: string;
  muscle_group?: string | null;
  exercise_order: number;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  completed: boolean;
  created_at: string;
}

// Full populated workout tree model
export interface FullWorkoutSession extends WorkoutSession {
  exercises: (WorkoutExercise & {
    sets: WorkoutSet[];
  })[];
}

// Data Transfer Objects (DTOs) for insertions & updates
export interface CreateWorkoutSessionDTO {
  id?: string;
  user_id: string;
  workout_name: string;
  category?: string;
  started_at?: string;
  ended_at?: string | null;
  duration_seconds?: number;
  status?: SessionStatus;
}

export interface CreateWorkoutExerciseDTO {
  id?: string;
  session_id: string;
  exercise_name: string;
  muscle_group?: string | null;
  exercise_order: number;
}

export interface CreateWorkoutSetDTO {
  id?: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  completed?: boolean;
}

// Batch insertion payload
export interface BatchWorkoutSessionPayload {
  session: CreateWorkoutSessionDTO;
  exercises: Array<{
    exercise: Omit<CreateWorkoutExerciseDTO, 'session_id'>;
    sets: Array<Omit<CreateWorkoutSetDTO, 'exercise_id'>>;
  }>;
}

// Standard service response wrapper
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
