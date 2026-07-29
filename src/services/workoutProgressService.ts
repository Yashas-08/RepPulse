import { SavedWorkoutRecord } from './workoutSaveService';
import { WorkoutHistoryService } from './workoutHistoryService';
import { ActiveWorkoutSession } from '../types/workoutSession';
import { PreviousWorkoutService, PreviousExercisePerformance as NewPrevPerf } from './previousWorkoutService';

export interface PreviousExercisePerformance {
  workoutName: string;
  workoutDate: string;
  exerciseName: string;
  completedSets: {
    setNumber: number;
    weight: number;
    reps: number;
  }[];
  totalVolume: number;
}

export interface SetComparisonResult {
  type: 'weight_up' | 'reps_up' | 'matched' | 'lower' | 'no_previous' | 'improved_weight' | 'improved_reps' | 'below_previous';
  weightDiff: number;
  repsDiff: number;
  message: string;
}

export interface PersonalRecordInfo {
  isNewWeightPR: boolean;
  isNewRepsPR: boolean;
  isNewVolumePR: boolean;
  prevMaxWeight: number;
  prevMaxReps: number;
  prevMaxVolume: number;
  newWeight: number;
  newReps: number;
  newVolume: number;
}

export interface ExerciseStats {
  exerciseName: string;
  highestWeight: number;
  highestReps: number;
  lastPerformedDate: string | null;
  totalSessions: number;
  totalSets: number;
  averageWeight: number;
  averageReps: number;
}

export interface WorkoutInsightsData {
  exercisesImprovedCount: number;
  personalRecordsCount: number;
  netWeightIncreaseKg: number;
  netRepsIncrease: number;
  netVolumeIncreaseKg: number;
  prList: { exerciseName: string; type: string; value: string }[];
}

export const WorkoutProgressService = {
  /**
   * Retrieves the most recent previous performance for a given exercise.
   */
  async getPreviousExercisePerformance(
    exerciseName: string,
    userId: string = 'guest',
    prefetchedHistory?: SavedWorkoutRecord[]
  ): Promise<PreviousExercisePerformance | null> {
    if (!prefetchedHistory) {
      const res = await PreviousWorkoutService.getPreviousExercise(userId, exerciseName);
      if (res.success && res.data) {
        return {
          workoutName: res.data.workoutName,
          workoutDate: res.data.workoutDate,
          exerciseName: res.data.exerciseName,
          completedSets: res.data.completedSets,
          totalVolume: res.data.totalVolume,
        };
      }
      if (res.data === null) return null;
    }

    const history = prefetchedHistory || (await WorkoutHistoryService.fetchWorkoutHistory(userId));
    if (!history || history.length === 0) return null;

    const normalizedName = exerciseName.trim().toLowerCase();

    // Find the latest completed workout that contains this exercise
    for (const record of history) {
      if (!record.exercises_data || record.exercises_data.length === 0) continue;

      const foundEx = record.exercises_data.find(
        (ex) =>
          ex.name.trim().toLowerCase() === normalizedName ||
          ex.exercise_id?.trim().toLowerCase() === normalizedName
      );

      if (foundEx && foundEx.completed_sets && foundEx.completed_sets.length > 0) {
        const totalVolume = foundEx.completed_sets.reduce(
          (acc, set) => acc + (set.weight || 0) * (set.reps || 0),
          0
        );

        return {
          workoutName: record.workout_name,
          workoutDate: record.workout_date || record.created_at,
          exerciseName: foundEx.name,
          completedSets: foundEx.completed_sets.map((s, idx) => ({
            setNumber: s.set_number || idx + 1,
            weight: s.weight,
            reps: s.reps,
          })),
          totalVolume,
        };
      }
    }

    return null;
  },

  /**
   * Compares a current set against a corresponding set from a previous performance.
   */
  compareSetWithPrevious(
    currentWeight: number,
    currentReps: number,
    prevSet?: { weight: number; reps: number }
  ): SetComparisonResult {
    if (!prevSet) {
      return {
        type: 'no_previous',
        weightDiff: 0,
        repsDiff: 0,
        message: 'First recorded set',
      };
    }

    const weightDiff = Math.round((currentWeight - prevSet.weight) * 10) / 10;
    const repsDiff = currentReps - prevSet.reps;

    if (weightDiff > 0) {
      return {
        type: 'weight_up',
        weightDiff,
        repsDiff,
        message: `↑ Weight Increased (+${weightDiff} kg)`,
      };
    }

    if (weightDiff === 0 && repsDiff > 0) {
      return {
        type: 'reps_up',
        weightDiff: 0,
        repsDiff,
        message: `↑ Reps Increased (+${repsDiff} reps)`,
      };
    }

    if (weightDiff === 0 && repsDiff === 0) {
      return {
        type: 'matched',
        weightDiff: 0,
        repsDiff: 0,
        message: 'Matched Previous Set',
      };
    }

    return {
      type: 'lower',
      weightDiff,
      repsDiff,
      message: '↓ Lower than Previous Workout',
    };
  },

  /**
   * Checks if current set performance breaks any all-time personal record for this exercise.
   */
  async checkPersonalRecord(
    exerciseName: string,
    currentWeight: number,
    currentReps: number,
    currentVolume: number,
    userId: string = 'guest',
    prefetchedHistory?: SavedWorkoutRecord[]
  ): Promise<PersonalRecordInfo> {
    const history = prefetchedHistory || (await WorkoutHistoryService.fetchWorkoutHistory(userId));
    const stats = await this.getExerciseStatistics(exerciseName, userId, history);

    const isNewWeightPR = currentWeight > 0 && currentWeight > stats.highestWeight;
    const isNewRepsPR = currentReps > 0 && currentReps > stats.highestReps;

    // Highest volume in a single set or exercise
    let prevMaxVolume = 0;

    const normalizedName = exerciseName.trim().toLowerCase();
    history.forEach((record) => {
      record.exercises_data?.forEach((ex) => {
        if (ex.name.trim().toLowerCase() === normalizedName) {
          const vol = ex.completed_sets?.reduce(
            (sum, s) => sum + s.weight * s.reps,
            0
          );
          if (vol && vol > prevMaxVolume) {
            prevMaxVolume = vol;
          }
        }
      });
    });

    const isNewVolumePR = currentVolume > 0 && currentVolume > prevMaxVolume;

    return {
      isNewWeightPR,
      isNewRepsPR,
      isNewVolumePR,
      prevMaxWeight: stats.highestWeight,
      prevMaxReps: stats.highestReps,
      prevMaxVolume,
      newWeight: currentWeight,
      newReps: currentReps,
      newVolume: currentVolume,
    };
  },

  /**
   * Retrieves full aggregated statistics for an exercise across user's history.
   */
  async getExerciseStatistics(
    exerciseName: string,
    userId: string = 'guest',
    prefetchedHistory?: SavedWorkoutRecord[]
  ): Promise<ExerciseStats> {
    const history = prefetchedHistory || (await WorkoutHistoryService.fetchWorkoutHistory(userId));
    const normalizedName = exerciseName.trim().toLowerCase();

    let highestWeight = 0;
    let highestReps = 0;
    let totalSessions = 0;
    let totalSets = 0;
    let sumWeight = 0;
    let sumReps = 0;
    let lastPerformedDate: string | null = null;

    history.forEach((record) => {
      let foundInSession = false;

      record.exercises_data?.forEach((ex) => {
        if (ex.name.trim().toLowerCase() === normalizedName) {
          foundInSession = true;

          if (!lastPerformedDate) {
            lastPerformedDate = record.workout_date || record.created_at;
          }

          ex.completed_sets?.forEach((s) => {
            if (s.weight > highestWeight) highestWeight = s.weight;
            if (s.reps > highestReps) highestReps = s.reps;

            totalSets += 1;
            sumWeight += s.weight;
            sumReps += s.reps;
          });
        }
      });

      if (foundInSession) {
        totalSessions += 1;
      }
    });

    const averageWeight = totalSets > 0 ? Math.round((sumWeight / totalSets) * 10) / 10 : 0;
    const averageReps = totalSets > 0 ? Math.round((sumReps / totalSets) * 10) / 10 : 0;

    return {
      exerciseName,
      highestWeight,
      highestReps,
      lastPerformedDate,
      totalSessions,
      totalSets,
      averageWeight,
      averageReps,
    };
  },

  /**
   * Computes comprehensive workout insights by comparing current session with previous workout logs.
   */
  async calculateWorkoutInsights(
    session: ActiveWorkoutSession,
    userId: string = 'guest'
  ): Promise<WorkoutInsightsData> {
    const history = await WorkoutHistoryService.fetchWorkoutHistory(userId);

    let exercisesImprovedCount = 0;
    let personalRecordsCount = 0;
    let netWeightIncreaseKg = 0;
    let netRepsIncrease = 0;
    let netVolumeIncreaseKg = 0;
    const prList: { exerciseName: string; type: string; value: string }[] = [];

    for (const ex of session.exercises) {
      const completedSets = ex.sets.filter((s) => s.completed);
      if (completedSets.length === 0) continue;

      const currentExVolume = completedSets.reduce(
        (sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps, 10) || 0),
        0
      );

      const prevPerf = await this.getPreviousExercisePerformance(ex.name, userId, history);
      const exStats = await this.getExerciseStatistics(ex.name, userId, history);

      let exHasImprovement = false;

      // Check max weight/reps in current sets vs previous
      const currentMaxWeight = Math.max(...completedSets.map((s) => parseFloat(s.weight) || 0));
      const currentMaxReps = Math.max(...completedSets.map((s) => parseInt(s.reps, 10) || 0));

      if (exStats.highestWeight > 0 && currentMaxWeight > exStats.highestWeight) {
        personalRecordsCount += 1;
        prList.push({
          exerciseName: ex.name,
          type: 'Highest Weight',
          value: `${currentMaxWeight} kg`,
        });
      } else if (exStats.highestReps > 0 && currentMaxReps > exStats.highestReps) {
        personalRecordsCount += 1;
        prList.push({
          exerciseName: ex.name,
          type: 'Highest Reps',
          value: `${currentMaxReps} reps`,
        });
      }

      if (prevPerf && prevPerf.completedSets.length > 0) {
        const prevMaxWeight = Math.max(...prevPerf.completedSets.map((s) => s.weight));
        const prevMaxReps = Math.max(...prevPerf.completedSets.map((s) => s.reps));

        if (currentMaxWeight > prevMaxWeight) {
          exHasImprovement = true;
          netWeightIncreaseKg += Math.round((currentMaxWeight - prevMaxWeight) * 10) / 10;
        }

        if (currentMaxReps > prevMaxReps) {
          exHasImprovement = true;
          netRepsIncrease += currentMaxReps - prevMaxReps;
        }

        if (currentExVolume > prevPerf.totalVolume) {
          exHasImprovement = true;
          netVolumeIncreaseKg += Math.round((currentExVolume - prevPerf.totalVolume) * 10) / 10;
        }
      } else {
        // First time doing exercise is an improvement
        exHasImprovement = true;
      }

      if (exHasImprovement) {
        exercisesImprovedCount += 1;
      }
    }

    return {
      exercisesImprovedCount,
      personalRecordsCount,
      netWeightIncreaseKg,
      netRepsIncrease,
      netVolumeIncreaseKg,
      prList,
    };
  },
};
