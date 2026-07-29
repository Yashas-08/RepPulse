import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { WorkoutCategory } from '../constants/workoutCategories';
import { MuscleRegion, Exercise, EXERCISE_LIBRARY } from '../constants/exerciseLibrary';
import { ActiveWorkoutSession, SessionExercise, WorkoutSet } from '../types/workoutSession';
import { WorkoutSessionService } from '../services/workoutSessionService';
import { WorkoutExerciseService } from '../services/workoutExerciseService';
import { WorkoutSetService } from '../services/workoutSetService';
import { WorkoutPersistenceFacade } from '../services/workoutPersistenceFacade';
import { generateUUID } from '../lib/uuid';

export interface UseWorkoutScreenProps {
  currentUser: User | null;
}

export function useWorkoutScreen({ currentUser }: UseWorkoutScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<WorkoutCategory | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<MuscleRegion | null>(null);

  const [viewMode, setViewMode] = useState<
    'selection' | 'region' | 'exercise_list' | 'session' | 'summary' | 'custom_placeholder'
  >('selection');

  const [session, setSession] = useState<ActiveWorkoutSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isDiscardingSession, setIsDiscardingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [customExercises, setCustomExercises] = useState<Record<string, Exercise[]>>({});

  const checkActiveSession = useCallback(async () => {
    if (!currentUser?.id) return;

    setIsLoadingSession(true);
    setSessionError(null);

    const res = await WorkoutSessionService.getActiveWorkoutSession(currentUser.id);

    setIsLoadingSession(false);

    if (res.success && res.data) {
      const activeDbSess = res.data;
      const restoredStartTime = new Date(activeDbSess.started_at).getTime();

      const fullRes = await WorkoutPersistenceFacade.getFullSessionById(activeDbSess.id);

      let restoredExercises: SessionExercise[] = [];
      if (fullRes.success && fullRes.data) {
        const fullSess = fullRes.data;
        restoredExercises = fullSess.exercises.map((ex) => ({
          id: ex.id,
          exerciseId: ex.exercise_name,
          name: ex.exercise_name,
          equipment: '',
          regionName: ex.muscle_group || 'Workout',
          categoryTitle: activeDbSess.category || activeDbSess.workout_name || 'Workout',
          completed: ex.sets.length > 0 && ex.sets.some((s) => s.completed),
          sets: ex.sets.map((s) => ({
            id: s.id,
            setNumber: s.set_number,
            weight: s.weight ? String(s.weight) : '',
            reps: s.reps ? String(s.reps) : '',
            completed: s.completed,
          })),
        }));
      }

      const restoredSession: ActiveWorkoutSession = {
        id: activeDbSess.id,
        startTime: restoredStartTime,
        categoryTitle: activeDbSess.category || activeDbSess.workout_name || 'Workout Session',
        exercises: restoredExercises,
        activeExerciseId: restoredExercises.length > 0 ? restoredExercises[0].id : null,
      };

      setSession(restoredSession);
      localStorage.setItem('reppulse_active_session', activeDbSess.id);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    checkActiveSession();
  }, [checkActiveSession]);

  const handleSelectCategory = (cat: WorkoutCategory) => {
    setSelectedCategory(cat);
    const regions = EXERCISE_LIBRARY[cat.id] || [];
    if (regions.length > 1) {
      setViewMode('region');
    } else if (regions.length === 1) {
      setSelectedRegion(regions[0]);
      setViewMode('exercise_list');
    } else {
      setViewMode('custom_placeholder');
    }
  };

  const handleSelectRegion = (region: MuscleRegion) => {
    setSelectedRegion(region);
    setViewMode('exercise_list');
  };

  const handleCreateCustomExercise = (regionId: string, newEx: Exercise) => {
    setCustomExercises((prev) => ({
      ...prev,
      [regionId]: [...(prev[regionId] || []), newEx],
    }));
  };

  const handleToggleExerciseInWorkout = async (exercise: Exercise) => {
    if (!currentUser?.id) {
      setSessionError('Please sign in to start a workout session.');
      return;
    }

    setSessionError(null);
    let currentSession = session;

    if (!currentSession) {
      setIsLoadingSession(true);

      const activeRes = await WorkoutSessionService.getActiveWorkoutSession(currentUser.id);

      let activeSessId: string;
      let activeStartTime: number;

      if (activeRes.success && activeRes.data) {
        activeSessId = activeRes.data.id;
        activeStartTime = new Date(activeRes.data.started_at).getTime();
      } else {
        const categoryTitle = selectedCategory?.title || 'Workout Session';
        const createRes = await WorkoutSessionService.createWorkoutSession({
          user_id: currentUser.id,
          workout_name: categoryTitle,
          category: categoryTitle,
          started_at: new Date().toISOString(),
          status: 'active',
        });

        setIsLoadingSession(false);

        if (!createRes.success || !createRes.data) {
          setSessionError(createRes.error || 'Failed to start workout session in Supabase. Please try again.');
          return;
        }

        activeSessId = createRes.data.id;
        activeStartTime = new Date(createRes.data.started_at).getTime();
      }

      setIsLoadingSession(false);

      currentSession = {
        id: activeSessId,
        startTime: activeStartTime,
        categoryTitle: selectedCategory?.title || 'Workout Session',
        exercises: [],
        activeExerciseId: null,
      };

      localStorage.setItem('reppulse_active_session', activeSessId);
    }

    const existingIndex = currentSession.exercises.findIndex(
      (ex) => ex.exerciseId === exercise.id
    );

    let updatedExercises = [...currentSession.exercises];
    let targetSessionExId: string;

    if (existingIndex !== -1) {
      targetSessionExId = currentSession.exercises[existingIndex].id;
    } else {
      targetSessionExId = generateUUID();
      const exOrder = currentSession.exercises.length + 1;

      await WorkoutExerciseService.createExercise({
        id: targetSessionExId,
        session_id: currentSession.id,
        exercise_name: exercise.name,
        muscle_group: selectedRegion?.name || selectedCategory?.title || 'Workout',
        exercise_order: exOrder,
      });

      const defaultSets: WorkoutSet[] = [
        { id: generateUUID(), setNumber: 1, weight: '', reps: '', completed: false },
        { id: generateUUID(), setNumber: 2, weight: '', reps: '', completed: false },
        { id: generateUUID(), setNumber: 3, weight: '', reps: '', completed: false },
      ];

      await WorkoutSetService.createSetsBatch(
        defaultSets.map((s) => ({
          id: s.id,
          exercise_id: targetSessionExId,
          set_number: s.setNumber,
          weight: 0,
          reps: 0,
          completed: false,
        }))
      );

      const newSessionEx: SessionExercise = {
        id: targetSessionExId,
        exerciseId: exercise.id,
        name: exercise.name,
        equipment: exercise.equipment,
        regionName: selectedRegion?.name || selectedCategory?.title || 'Workout',
        categoryTitle: selectedCategory?.title || 'Workout',
        sets: defaultSets,
        completed: false,
      };

      updatedExercises.push(newSessionEx);
    }

    const newSessionState: ActiveWorkoutSession = {
      ...currentSession,
      exercises: updatedExercises,
      activeExerciseId: targetSessionExId,
    };

    setSession(newSessionState);
    setViewMode('session');
  };

  const handleUpdateSession = (updatedSession: ActiveWorkoutSession) => {
    setSession(updatedSession);
  };

  const handleOpenActiveSession = () => {
    setViewMode('session');
  };

  const handleFinishWorkout = () => {
    setViewMode('summary');
  };

  const handleDiscardSession = async () => {
    if (!session?.id) {
      setSession(null);
      setViewMode('selection');
      return;
    }

    setIsDiscardingSession(true);
    setSessionError(null);

    const res = await WorkoutSessionService.deleteWorkoutSession(session.id);
    setIsDiscardingSession(false);

    if (!res.success) {
      setSessionError(res.error || 'Failed to discard workout session.');
      return;
    }

    localStorage.removeItem('reppulse_active_session');
    setSession(null);
    setSelectedCategory(null);
    setSelectedRegion(null);
    setViewMode('selection');
  };

  const handleCloseSummary = () => {
    setSession(null);
    localStorage.removeItem('reppulse_active_session');
    window.dispatchEvent(new Event('reppulse_workouts_updated'));
    setViewMode('selection');
    setSelectedCategory(null);
    setSelectedRegion(null);
  };

  return {
    selectedCategory,
    setSelectedCategory,
    selectedRegion,
    setSelectedRegion,
    viewMode,
    setViewMode,
    session,
    setSession,
    isLoadingSession,
    isDiscardingSession,
    sessionError,
    setSessionError,
    customExercises,
    checkActiveSession,
    handleSelectCategory,
    handleSelectRegion,
    handleCreateCustomExercise,
    handleToggleExerciseInWorkout,
    handleUpdateSession,
    handleOpenActiveSession,
    handleFinishWorkout,
    handleDiscardSession,
    handleCloseSummary,
  };
}
