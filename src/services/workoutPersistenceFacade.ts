import {
  BatchWorkoutSessionPayload,
  FullWorkoutSession,
  ServiceResult,
} from '../types/workoutPersistence';
import { WorkoutSessionService } from './workoutSessionService';
import { WorkoutExerciseService } from './workoutExerciseService';
import { WorkoutSetService } from './workoutSetService';

export const WorkoutPersistenceFacade = {
  /**
   * Save a complete workout session with exercises and sets atomically in batch.
   */
  async saveFullSession(
    payload: BatchWorkoutSessionPayload
  ): Promise<ServiceResult<FullWorkoutSession>> {
    // 1. Create session
    const sessionRes = await WorkoutSessionService.createSession(payload.session);
    if (!sessionRes.success || !sessionRes.data) {
      return {
        success: false,
        error: sessionRes.error || 'Failed to create session record.',
        code: sessionRes.code,
      };
    }

    const createdSession = sessionRes.data;

    try {
      // 2. Prepare exercises
      const exerciseDtos = payload.exercises.map((item) => ({
        ...item.exercise,
        session_id: createdSession.id,
      }));

      const exercisesRes = await WorkoutExerciseService.createExercisesBatch(exerciseDtos);
      if (!exercisesRes.success || !exercisesRes.data) {
        // Rollback session
        await WorkoutSessionService.deleteSession(createdSession.id);
        return {
          success: false,
          error: exercisesRes.error || 'Failed to create exercise records.',
          code: exercisesRes.code,
        };
      }

      const createdExercises = exercisesRes.data;

      // 3. Prepare sets with created exercise IDs
      const setDtos: any[] = [];
      createdExercises.forEach((exercise, idx) => {
        const correspondingSets = payload.exercises[idx]?.sets || [];
        correspondingSets.forEach((set) => {
          setDtos.push({
            ...set,
            exercise_id: exercise.id,
          });
        });
      });

      let createdSets: any[] = [];
      if (setDtos.length > 0) {
        const setsRes = await WorkoutSetService.createSetsBatch(setDtos);
        if (!setsRes.success || !setsRes.data) {
          // Rollback session (cascades delete to exercises)
          await WorkoutSessionService.deleteSession(createdSession.id);
          return {
            success: false,
            error: setsRes.error || 'Failed to create set records.',
            code: setsRes.code,
          };
        }
        createdSets = setsRes.data;
      }

      // Assemble full workout tree
      const fullExercises = createdExercises.map((ex) => ({
        ...ex,
        sets: createdSets.filter((s) => s.exercise_id === ex.id),
      }));

      const fullSession: FullWorkoutSession = {
        ...createdSession,
        exercises: fullExercises,
      };

      return {
        success: true,
        data: fullSession,
      };
    } catch (err: any) {
      // Emergency rollback
      await WorkoutSessionService.deleteSession(createdSession.id);
      return {
        success: false,
        error: err?.message || 'Unexpected error while persisting full session.',
        code: 'PERSISTENCE_ERROR',
      };
    }
  },

  /**
   * Fetches a full session tree with exercises and sets for a given session ID.
   */
  async getFullSessionById(sessionId: string): Promise<ServiceResult<FullWorkoutSession>> {
    const sessionRes = await WorkoutSessionService.getSessionById(sessionId);
    if (!sessionRes.success || !sessionRes.data) {
      return {
        success: false,
        error: sessionRes.error || 'Session not found.',
        code: sessionRes.code,
      };
    }

    const session = sessionRes.data;

    const exercisesRes = await WorkoutExerciseService.getSessionExercises(sessionId);
    if (!exercisesRes.success || !exercisesRes.data) {
      return {
        success: false,
        error: exercisesRes.error || 'Failed to fetch session exercises.',
        code: exercisesRes.code,
      };
    }

    const exercises = exercisesRes.data;
    const exerciseIds = exercises.map((e) => e.id);

    const setsRes = await WorkoutSetService.getExercisesSetsBatch(exerciseIds);
    if (!setsRes.success || !setsRes.data) {
      return {
        success: false,
        error: setsRes.error || 'Failed to fetch exercise sets.',
        code: setsRes.code,
      };
    }

    const sets = setsRes.data;

    const fullExercises = exercises.map((ex) => ({
      ...ex,
      sets: sets.filter((s) => s.exercise_id === ex.id),
    }));

    return {
      success: true,
      data: {
        ...session,
        exercises: fullExercises,
      },
    };
  },
};
