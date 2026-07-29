import React from 'react';
import { History, Clock, Dumbbell, ChevronRight, Check } from 'lucide-react';
import { SavedWorkoutRecord } from '../../services/workoutSaveService';
import { Workout } from '../../types';

interface RecentActivityCardProps {
  latestWorkout: SavedWorkoutRecord | Workout | null;
  onViewHistory: () => void;
  onSelectWorkout?: (workout: SavedWorkoutRecord | Workout) => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  latestWorkout,
  onViewHistory,
  onSelectWorkout,
}) => {
  if (!latestWorkout) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between pl-1">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-500">
            Recent Activity
          </h3>
        </div>

        <div className="bg-white border border-border-cool rounded-3xl p-6 flex flex-col items-center text-center shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-2">
            <Dumbbell size={20} />
          </div>
          <p className="font-display font-semibold text-xs text-neutral-700 uppercase tracking-wider">
            No workouts completed yet.
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Log your first workout to start tracking your activity.
          </p>
        </div>
      </div>
    );
  }

  const isSavedRecord = 'workout_name' in latestWorkout;
  const name = isSavedRecord
    ? (latestWorkout as SavedWorkoutRecord).workout_name
    : (latestWorkout as Workout).exercise_name || 'Workout Session';

  const rawDate = isSavedRecord
    ? (latestWorkout as SavedWorkoutRecord).workout_date || (latestWorkout as SavedWorkoutRecord).created_at
    : (latestWorkout as Workout).completed_at || (latestWorkout as Workout).updated_at || (latestWorkout as Workout).created_at;

  const dateFormatted = rawDate
    ? new Date(rawDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'Recent';

  const mins = isSavedRecord
    ? (latestWorkout as SavedWorkoutRecord).duration_minutes ||
      Math.round(((latestWorkout as SavedWorkoutRecord).duration_seconds || 0) / 60)
    : 30;

  const exerciseCount = isSavedRecord
    ? (latestWorkout as SavedWorkoutRecord).total_exercises ||
      (latestWorkout as SavedWorkoutRecord).exercises_data?.length || 1
    : 1;

  const totalSets = isSavedRecord
    ? (latestWorkout as SavedWorkoutRecord).total_sets || 0
    : (latestWorkout as Workout).sets || 0;

  const totalWeight = isSavedRecord
    ? (latestWorkout as SavedWorkoutRecord).total_weight_lifted
    : (latestWorkout as Workout).weight;

  const handleCardClick = () => {
    if (onSelectWorkout) {
      onSelectWorkout(latestWorkout);
    } else {
      onViewHistory();
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between pl-1">
        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-500">
          Recent Activity
        </h3>
        <button
          onClick={onViewHistory}
          className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 uppercase tracking-wider cursor-pointer transition-colors"
        >
          <History size={13} />
          <span>View All</span>
        </button>
      </div>

      <div
        onClick={handleCardClick}
        className="bg-white border border-border-cool rounded-3xl p-5 flex items-center justify-between shadow-2xs hover:border-neutral-400 transition-all cursor-pointer active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Check size={18} strokeWidth={2.5} />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-display font-bold text-base text-neutral-900 truncate">
              {name}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-medium mt-0.5 flex-wrap">
              <span>{dateFormatted}</span>
              {mins > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {mins} mins
                  </span>
                </>
              )}
              <span>•</span>
              <span>{exerciseCount} {exerciseCount === 1 ? 'Exercise' : 'Exercises'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs font-bold text-neutral-900 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200">
            {totalWeight ? `${totalWeight} kg` : `${totalSets} sets`}
          </span>
          <ChevronRight size={18} className="text-neutral-400" />
        </div>
      </div>
    </div>
  );
};
