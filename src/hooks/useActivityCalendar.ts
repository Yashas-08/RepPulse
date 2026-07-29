import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarService,
  MonthActivityMap,
  DayActivity,
  toLocalDateString,
} from '../services/calendarService';

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface UseActivityCalendarProps {
  userId: string;
}

export function useActivityCalendar({ userId }: UseActivityCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1); // 1 to 12

  // Activity Data state
  const [activityMap, setActivityMap] = useState<MonthActivityMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected date state for bottom sheet
  const todayStr = useMemo(() => toLocalDateString(today), [today]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  // Fetch monthly activity
  const fetchMonthlyData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await CalendarService.getMonthlyActivity(userId, currentYear, currentMonth);
      if (res.success) {
        setActivityMap(res.data);
      } else {
        setError(res.error || 'Failed to fetch calendar activity data.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error loading calendar.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, currentYear, currentMonth]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  // Real-time auto-refresh event listeners
  useEffect(() => {
    const handleUpdate = () => {
      fetchMonthlyData(true);
    };

    window.addEventListener('reppulse_workouts_updated', handleUpdate);
    window.addEventListener('reppulse_workout_updated', handleUpdate);
    window.addEventListener('reppulse_workout_completed', handleUpdate);
    window.addEventListener('reppulse_nutrition_updated', handleUpdate);
    window.addEventListener('reppulse_meals_updated', handleUpdate);
    window.addEventListener('reppulse_progress_updated', handleUpdate);
    window.addEventListener('reppulse_weight_updated', handleUpdate);
    window.addEventListener('reppulse_weight_history_updated', handleUpdate);

    return () => {
      window.removeEventListener('reppulse_workouts_updated', handleUpdate);
      window.removeEventListener('reppulse_workout_updated', handleUpdate);
      window.removeEventListener('reppulse_workout_completed', handleUpdate);
      window.removeEventListener('reppulse_nutrition_updated', handleUpdate);
      window.removeEventListener('reppulse_meals_updated', handleUpdate);
      window.removeEventListener('reppulse_progress_updated', handleUpdate);
      window.removeEventListener('reppulse_weight_updated', handleUpdate);
      window.removeEventListener('reppulse_weight_history_updated', handleUpdate);
    };
  }, [fetchMonthlyData]);

  // Navigation handlers
  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const handleSelectDay = useCallback((dateStr: string) => {
    setSelectedDateStr(dateStr);
    setIsDetailOpen(true);
    setExpandedWorkoutId(null);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setExpandedWorkoutId(null);
  }, []);

  // Filtered activities strictly belonging to current viewed month for summary stats
  const currentMonthPrefix = useMemo(
    () => `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
    [currentYear, currentMonth]
  );

  const currentMonthActivities = useMemo(() => {
    return Object.values(activityMap).filter((a: DayActivity) =>
      a.dateStr.startsWith(currentMonthPrefix)
    );
  }, [activityMap, currentMonthPrefix]);

  // Activity for the currently selected date
  const selectedDayActivity: DayActivity | null = useMemo(() => {
    if (!selectedDateStr) return null;
    return activityMap[selectedDateStr] || {
      dateStr: selectedDateStr,
      workouts: [],
      nutrition: null,
      progress: [],
    };
  }, [activityMap, selectedDateStr]);

  return {
    todayStr,
    currentYear,
    currentMonth,
    activityMap,
    loading,
    refreshing,
    error,
    selectedDateStr,
    selectedDayActivity,
    isDetailOpen,
    expandedWorkoutId,
    currentMonthActivities,
    setExpandedWorkoutId,
    fetchMonthlyData,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDay,
    handleCloseDetail,
  };
}
