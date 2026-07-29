-- RepPulse Workout Module Database Schema
-- Migration script for workout_sessions, workout_exercises, and workout_sets

-- 1. Create workout_sessions table
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_name TEXT NOT NULL,
  category TEXT DEFAULT 'Strength',
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create workout_exercises table
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT,
  exercise_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create workout_sets table
CREATE TABLE IF NOT EXISTS public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL DEFAULT 1,
  weight NUMERIC NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for workout_sessions
DROP POLICY IF EXISTS "Users can view their own workout sessions" ON public.workout_sessions;
CREATE POLICY "Users can view their own workout sessions"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workout sessions" ON public.workout_sessions;
CREATE POLICY "Users can insert their own workout sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workout sessions" ON public.workout_sessions;
CREATE POLICY "Users can update their own workout sessions"
  ON public.workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workout sessions" ON public.workout_sessions;
CREATE POLICY "Users can delete their own workout sessions"
  ON public.workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 6. RLS Policies for workout_exercises
DROP POLICY IF EXISTS "Users can view exercises from their sessions" ON public.workout_exercises;
CREATE POLICY "Users can view exercises from their sessions"
  ON public.workout_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = workout_exercises.session_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert exercises to their sessions" ON public.workout_exercises;
CREATE POLICY "Users can insert exercises to their sessions"
  ON public.workout_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = workout_exercises.session_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update exercises in their sessions" ON public.workout_exercises;
CREATE POLICY "Users can update exercises in their sessions"
  ON public.workout_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = workout_exercises.session_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete exercises from their sessions" ON public.workout_exercises;
CREATE POLICY "Users can delete exercises from their sessions"
  ON public.workout_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = workout_exercises.session_id AND s.user_id = auth.uid()
    )
  );

-- 7. RLS Policies for workout_sets
DROP POLICY IF EXISTS "Users can view sets from their exercises" ON public.workout_sets;
CREATE POLICY "Users can view sets from their exercises"
  ON public.workout_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises e
      JOIN public.workout_sessions s ON s.id = e.session_id
      WHERE e.id = workout_sets.exercise_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert sets into their exercises" ON public.workout_sets;
CREATE POLICY "Users can insert sets into their exercises"
  ON public.workout_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_exercises e
      JOIN public.workout_sessions s ON s.id = e.session_id
      WHERE e.id = workout_sets.exercise_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update sets in their exercises" ON public.workout_sets;
CREATE POLICY "Users can update sets in their exercises"
  ON public.workout_sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises e
      JOIN public.workout_sessions s ON s.id = e.session_id
      WHERE e.id = workout_sets.exercise_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete sets from their exercises" ON public.workout_sets;
CREATE POLICY "Users can delete sets from their exercises"
  ON public.workout_sets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises e
      JOIN public.workout_sessions s ON s.id = e.session_id
      WHERE e.id = workout_sets.exercise_id AND s.user_id = auth.uid()
    )
  );

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_started_at ON public.workout_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session_id ON public.workout_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON public.workout_sets(exercise_id);
