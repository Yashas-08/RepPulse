import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCw,
  Dumbbell,
  Utensils,
  TrendingUp,
  X,
  Plus,
  Clock,
  Flame,
  Award,
  FileText,
  Activity,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { ScreenType } from '../types';
import {
  DayActivity,
  toLocalDateString,
} from '../services/calendarService';
import { SavedWorkoutRecord } from '../services/workoutSaveService';
import { useActivityCalendar, DAYS_OF_WEEK, MONTH_NAMES } from '../hooks/useActivityCalendar';

interface ActivityCalendarScreenProps {
  currentUser?: SupabaseUser | null;
  onNavigate?: (screen: ScreenType) => void;
  onBack?: () => void;
}

export const ActivityCalendarScreen: React.FC<ActivityCalendarScreenProps> = ({
  currentUser,
  onNavigate,
  onBack,
}) => {
  const userId = currentUser?.id || 'guest';

  const {
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
  } = useActivityCalendar({ userId });

  const handleJumpToToday = () => {
    const now = new Date();
    handleSelectDay(toLocalDateString(now));
  };

  // Generate calendar grid days array for current month view
  const calendarGrid = useMemo(() => {
    // 1st day of the month
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    // Number of days in current month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Get day of week for the 1st of the month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    // Convert to Monday-based index (0 = Mon, 1 = Tue, ..., 6 = Sun)
    const rawDayOfWeek = firstDayOfMonth.getDay();
    const mondayBasedFirstDay = rawDayOfWeek === 0 ? 6 : rawDayOfWeek - 1;

    // Previous month padding days
    const prevMonthDaysCount = mondayBasedFirstDay;
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();

    const grid = [];

    // Add padding days from previous month
    for (let i = prevMonthDaysCount - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevMonthNum = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYearNum = currentMonth === 1 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      grid.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Add days of current month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      grid.push({
        dayNum,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Add padding days for next month to complete standard 35 or 42 grid cells
    const totalCellsSoFar = grid.length;
    const targetTotalCells = totalCellsSoFar > 35 ? 42 : 35;
    const nextMonthPaddingCount = targetTotalCells - totalCellsSoFar;

    for (let dayNum = 1; dayNum <= nextMonthPaddingCount; dayNum++) {
      const nextMonthNum = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYearNum = currentMonth === 12 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      grid.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return grid;
  }, [currentYear, currentMonth, todayStr]);

  // Formatted date title for selected date bottom sheet
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateStr) return '';
    const parts = selectedDateStr.split('-');
    if (parts.length !== 3) return selectedDateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDateStr]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden select-none">
      {/* 1. HEADER BAR */}
      <header className="px-4 py-3 bg-white border-b border-border-cool flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack || (() => onNavigate && onNavigate('dashboard'))}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer border border-border-cool"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase leading-none">
              Activity Calendar
            </h1>
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mt-0.5">
              Central Timeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Today Jump Button */}
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Jump to Today"
          >
            <CalendarIcon size={12} />
            <span>Today</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchMonthlyData(true)}
            disabled={loading || refreshing}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer border border-border-cool disabled:opacity-50"
            title="Refresh Calendar"
          >
            <RotateCw size={14} className={refreshing ? 'animate-spin text-neutral-900' : ''} />
          </button>
        </div>
      </header>

      {/* MAIN SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 pb-24">
        {/* MONTH SELECTOR HEADER */}
        <div className="bg-neutral-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-emerald-400" />
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block leading-none">
                Viewing Month
              </span>
              <h2 className="text-lg font-black tracking-tight uppercase mt-0.5 text-white">
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* COLOR INDICATORS LEGEND */}
        <div className="bg-neutral-50 border border-border-cool rounded-xl p-2.5 flex items-center justify-around text-[10px] font-bold uppercase tracking-wider text-neutral-600 gap-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Workout</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>Nutrition</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span>Both</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
            <span>Weight</span>
          </div>
        </div>

        {/* ERROR NOTICE */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 text-xs font-medium flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => fetchMonthlyData(false)}
              className="text-[10px] font-bold uppercase underline tracking-wider cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* CALENDAR GRID CONTAINER */}
        <div className="bg-white border border-border-cool rounded-2xl p-3 shadow-2xs">
          {/* DAYS OF WEEK HEADER */}
          <div className="grid grid-cols-7 text-center mb-2 border-b border-neutral-100 pb-2">
            {DAYS_OF_WEEK.map((day) => (
              <span
                key={day}
                className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
              >
                {day}
              </span>
            ))}
          </div>

          {/* GRID CELLS */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <RotateCw size={24} className="animate-spin text-neutral-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Loading Calendar Data...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {calendarGrid.map((cell) => {
                const dayAct = activityMap[cell.dateStr];
                const hasW = dayAct?.hasWorkout;
                const hasN = dayAct?.hasNutrition;
                const hasP = dayAct?.hasProgress;
                const isSelected = cell.dateStr === selectedDateStr;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleSelectDay(cell.dateStr)}
                    className={`
                      min-h-[52px] p-1 rounded-xl flex flex-col items-center justify-between relative transition-all cursor-pointer active:scale-95
                      ${
                        cell.isCurrentMonth
                          ? isSelected
                            ? 'bg-neutral-900 text-white ring-2 ring-neutral-900 shadow-xs'
                            : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border border-neutral-100'
                          : 'bg-neutral-50/40 text-neutral-300 border border-transparent'
                      }
                      ${cell.isToday && !isSelected ? 'border-2 border-neutral-900 font-black' : ''}
                    `}
                  >
                    {/* DAY NUMBER & TODAY BADGE */}
                    <div className="w-full flex items-center justify-between px-0.5">
                      <span
                        className={`text-xs font-bold leading-none ${
                          isSelected ? 'text-white' : cell.isCurrentMonth ? 'text-neutral-900' : 'text-neutral-300'
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                      {cell.isToday && (
                        <span
                          className={`text-[7px] font-black uppercase tracking-tighter px-1 rounded-xs leading-tight ${
                            isSelected ? 'bg-emerald-400 text-neutral-950' : 'bg-neutral-900 text-white'
                          }`}
                        >
                          Today
                        </span>
                      )}
                    </div>

                    {/* ACTIVITY INDICATOR DOTS */}
                    <div className="w-full flex items-center justify-center gap-1 my-1 min-h-[8px]">
                      {hasW && hasN ? (
                        <span
                          className="w-2 h-2 rounded-full bg-blue-500 shrink-0"
                          title="Workout + Nutrition"
                        />
                      ) : (
                        <>
                          {hasW && (
                            <span
                              className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                              title="Workout"
                            />
                          )}
                          {hasN && (
                            <span
                              className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                              title="Nutrition"
                            />
                          )}
                        </>
                      )}
                      {hasP && (
                        <span
                          className="w-2 h-2 rounded-full bg-purple-500 shrink-0"
                          title="Weight Entry"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* QUICK STATS FOR VIEWED MONTH */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 flex flex-col items-center text-center">
            <Dumbbell size={16} className="text-emerald-600 mb-1" />
            <span className="text-base font-black text-emerald-950 leading-tight">
              {currentMonthActivities.reduce<number>((acc, curr: DayActivity) => acc + (curr.workouts?.length || 0), 0)}
            </span>
            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5">
              Workouts
            </span>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3 flex flex-col items-center text-center">
            <Utensils size={16} className="text-amber-600 mb-1" />
            <span className="text-base font-black text-amber-950 leading-tight">
              {currentMonthActivities.reduce<number>((acc, curr: DayActivity) => acc + (curr.nutrition?.meals?.length || 0), 0)}
            </span>
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mt-0.5">
              Meals
            </span>
          </div>

          <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-3 flex flex-col items-center text-center">
            <TrendingUp size={16} className="text-purple-600 mb-1" />
            <span className="text-base font-black text-purple-950 leading-tight">
              {currentMonthActivities.reduce<number>((acc, curr: DayActivity) => acc + (curr.progress?.length || 0), 0)}
            </span>
            <span className="text-[9px] font-bold text-purple-700 uppercase tracking-wider mt-0.5">
              Weight Logs
            </span>
          </div>
        </div>
      </div>

      {/* 2. DAY DETAILS BOTTOM SHEET */}
      <AnimatePresence>
        {isDetailOpen && selectedDayActivity && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs">
            {/* Backdrop click to dismiss */}
            <div className="flex-1" onClick={handleCloseDetail} />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="bg-white rounded-t-3xl border-t border-border-cool max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* SHEET HANDLE & HEADER */}
              <div className="p-4 border-b border-border-cool flex items-center justify-between shrink-0 bg-neutral-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <CalendarIcon size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 leading-none">
                      Day Summary
                    </h3>
                    <p className="text-sm font-black text-neutral-900 tracking-tight mt-0.5">
                      {formattedSelectedDate}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 flex items-center justify-center text-neutral-700 cursor-pointer transition-all"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* SHEET SCROLLABLE BODY */}
              <div className="p-4 overflow-y-auto flex flex-col gap-4 pb-12">
                {/* CHECK IF NO ACTIVITY EXISTS */}
                {!selectedDayActivity.hasWorkout &&
                !selectedDayActivity.hasNutrition &&
                !selectedDayActivity.hasProgress ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mb-3">
                      <Activity size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">
                      No Activity Recorded
                    </h4>
                    <p className="text-xs text-neutral-500 max-w-xs mt-1 mb-6">
                      No workouts, meals, or weight entries were logged for this date.
                    </p>

                    {/* QUICK ACTION BUTTONS */}
                    <div className="w-full max-w-xs flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseDetail();
                          if (onNavigate) onNavigate('workout');
                        }}
                        className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-98 transition-all cursor-pointer shadow-2xs"
                      >
                        <Dumbbell size={14} />
                        <span>Log Workout</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleCloseDetail();
                            if (onNavigate) onNavigate('nutrition');
                          }}
                          className="py-2.5 bg-neutral-100 text-neutral-900 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-neutral-200 active:scale-98 transition-all cursor-pointer border border-border-cool"
                        >
                          <Utensils size={14} />
                          <span>Log Meal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleCloseDetail();
                            if (onNavigate) onNavigate('progress');
                          }}
                          className="py-2.5 bg-neutral-100 text-neutral-900 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-neutral-200 active:scale-98 transition-all cursor-pointer border border-border-cool"
                        >
                          <TrendingUp size={14} />
                          <span>Weight</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 1. WORKOUT SECTION */}
                    {selectedDayActivity.hasWorkout && (
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                            <Dumbbell size={14} />
                            <span>Workouts Completed ({selectedDayActivity.workouts.length})</span>
                          </span>
                        </div>

                        {selectedDayActivity.workouts.map((w) => {
                          const isExpanded = expandedWorkoutId === w.id;
                          return (
                            <div
                              key={w.id}
                              className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-3.5 flex flex-col gap-3 shadow-2xs"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mb-1">
                                    {w.category_title || 'Workout'}
                                  </span>
                                  <h4 className="text-sm font-black text-neutral-900 tracking-tight leading-snug">
                                    {w.workout_name}
                                  </h4>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedWorkoutId(isExpanded ? null : w.id)
                                  }
                                  className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider underline cursor-pointer hover:text-emerald-900"
                                >
                                  {isExpanded ? 'Hide Details' : 'View Exercises'}
                                </button>
                              </div>

                              {/* METRICS ROW */}
                              <div className="grid grid-cols-4 gap-1.5 bg-white border border-emerald-100/80 rounded-xl p-2 text-center">
                                <div>
                                  <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                                    Duration
                                  </span>
                                  <span className="text-xs font-black text-neutral-900">
                                    {w.duration_minutes || 1} m
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                                    Exercises
                                  </span>
                                  <span className="text-xs font-black text-neutral-900">
                                    {w.total_exercises || w.exercises_data?.length || 1}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                                    Sets
                                  </span>
                                  <span className="text-xs font-black text-neutral-900">
                                    {w.total_sets || 0}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                                    Volume
                                  </span>
                                  <span className="text-xs font-black text-neutral-900">
                                    {w.total_weight_lifted} kg
                                  </span>
                                </div>
                              </div>

                              {/* EXERCISES BREAKDOWN */}
                              {isExpanded && w.exercises_data && w.exercises_data.length > 0 && (
                                <div className="mt-1 flex flex-col gap-2 pt-2 border-t border-emerald-100">
                                  {w.exercises_data.map((ex, idx) => (
                                    <div
                                      key={ex.id || idx}
                                      className="bg-white rounded-xl p-2.5 border border-emerald-100 text-xs flex flex-col gap-1"
                                    >
                                      <span className="font-bold text-neutral-900">
                                        {idx + 1}. {ex.name}
                                      </span>
                                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                                        {ex.completed_sets.map((st, stIdx) => (
                                          <span
                                            key={stIdx}
                                            className="text-[10px] font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md"
                                          >
                                            Set {st.set_number}: {st.weight}kg × {st.reps}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. NUTRITION SECTION */}
                    {selectedDayActivity.hasNutrition && selectedDayActivity.nutrition && (
                      <div className="flex flex-col gap-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                          <Utensils size={14} />
                          <span>Nutrition Summary</span>
                        </span>

                        <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-3.5 flex flex-col gap-3 shadow-2xs">
                          {/* MACROS CARD */}
                          <div className="grid grid-cols-4 gap-1.5 bg-white border border-amber-100/80 rounded-xl p-2.5 text-center">
                            <div>
                              <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                                Calories
                              </span>
                              <span className="text-xs font-black text-amber-950">
                                {Math.round(selectedDayActivity.nutrition.totalCalories)} kcal
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                                Protein
                              </span>
                              <span className="text-xs font-black text-neutral-900">
                                {Math.round(selectedDayActivity.nutrition.totalProtein)}g
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                                Carbs
                              </span>
                              <span className="text-xs font-black text-neutral-900">
                                {Math.round(selectedDayActivity.nutrition.totalCarbs)}g
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                                Fat
                              </span>
                              <span className="text-xs font-black text-neutral-900">
                                {Math.round(selectedDayActivity.nutrition.totalFat)}g
                              </span>
                            </div>
                          </div>

                          {/* MEALS LIST */}
                          <div className="flex flex-col gap-1.5">
                            {selectedDayActivity.nutrition.meals.map((m) => (
                              <div
                                key={m.id}
                                className="bg-white border border-amber-100 rounded-xl p-2.5 flex items-center justify-between"
                              >
                                <div>
                                  <span className="text-[8px] font-black uppercase tracking-widest text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded leading-none inline-block mb-0.5">
                                    {m.meal_type}
                                  </span>
                                  <h5 className="text-xs font-bold text-neutral-900 leading-tight">
                                    {m.meal_name}
                                  </h5>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-black text-neutral-900 block">
                                    {m.calories} kcal
                                  </span>
                                  <span className="text-[9px] font-medium text-neutral-400">
                                    P: {m.protein}g | C: {m.carbohydrates}g | F: {m.fat}g
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. PROGRESS / WEIGHT LOGS */}
                    {selectedDayActivity.hasProgress && (
                      <div className="flex flex-col gap-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                          <TrendingUp size={14} />
                          <span>Weight Log</span>
                        </span>

                        <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-3.5 flex flex-col gap-2 shadow-2xs">
                          {selectedDayActivity.progress.map((p) => (
                            <div
                              key={p.id}
                              className="bg-white border border-purple-100 rounded-xl p-3 flex items-center justify-between"
                            >
                              <div>
                                <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                                  Body Weight
                                </span>
                                <span className="text-base font-black text-neutral-900">
                                  {p.weight ? `${p.weight} kg` : 'Recorded'}
                                </span>
                                {p.body_fat_percentage && (
                                  <span className="text-[10px] text-purple-700 font-bold block mt-0.5">
                                    Body Fat: {p.body_fat_percentage}%
                                  </span>
                                )}
                              </div>
                              {p.notes && (
                                <p className="text-xs text-neutral-500 italic max-w-[140px] text-right">
                                  "{p.notes}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
