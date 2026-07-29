import { SavedWorkoutRecord } from './workoutSaveService';
import { DashboardService } from './dashboardService';

export interface TodaySummaryData {
  workoutsToday: number;
  durationMinutesToday: number;
  weightLiftedTodayKg: number;
  formattedDuration: string;
  formattedWeight: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

export interface LatestPRData {
  exerciseName: string;
  recordType: string;
  value: string;
  date: string;
}

export interface RedesignedDashboardData {
  hasAnyWorkouts: boolean;
  todaySummary: TodaySummaryData | null;
  streak: StreakData;
  latestWorkout: SavedWorkoutRecord | null;
  latestPR: LatestPRData | null;
}

export const DashboardAnalyticsService = {
  async getRedesignedDashboardData(userId: string = 'guest'): Promise<RedesignedDashboardData> {
    const res = await DashboardService.getDashboardData(userId);
    if (res.success && res.data) {
      const d = res.data;
      return {
        hasAnyWorkouts: d.hasAnyWorkouts,
        todaySummary: d.todaySummary
          ? {
              workoutsToday: d.todaySummary.workoutsToday,
              durationMinutesToday: d.todaySummary.durationMinutesToday,
              weightLiftedTodayKg: d.todaySummary.totalVolumeTodayKg,
              formattedDuration: d.todaySummary.formattedDuration,
              formattedWeight: d.todaySummary.formattedWeight,
            }
          : null,
        streak: d.streak,
        latestWorkout: d.latestWorkout?.rawRecord || null,
        latestPR: d.latestPR
          ? {
              exerciseName: d.latestPR.exerciseName,
              recordType: d.latestPR.recordType,
              value: d.latestPR.value,
              date: d.latestPR.date,
            }
          : null,
      };
    }

    // Fallback if error
    return {
      hasAnyWorkouts: false,
      todaySummary: null,
      streak: { currentStreak: 0, longestStreak: 0 },
      latestWorkout: null,
      latestPR: null,
    };
  },
};

