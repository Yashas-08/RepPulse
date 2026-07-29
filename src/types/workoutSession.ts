export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: string; // Numeric string input e.g. "60"
  reps: string;   // Numeric string input e.g. "10"
  completed: boolean;
}

export interface SessionExercise {
  id: string; // Unique instance ID in current workout session
  exerciseId: string;
  name: string;
  equipment?: string;
  regionName: string;
  categoryTitle: string;
  sets: WorkoutSet[];
  completed: boolean;
}

export interface ActiveWorkoutSession {
  id: string;
  startTime: number; // Date.now()
  categoryTitle?: string;
  exercises: SessionExercise[];
  activeExerciseId: string | null;
}
