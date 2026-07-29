import React from 'react';
import { History, Clock, Dumbbell, ChevronRight, Check } from 'lucide-react';
import { SavedWorkoutRecord } from '../../services/workoutSaveService';

interface LatestWorkoutCardProps {
  latestWorkout: SavedWorkoutRecord | null;
  onViewHistory: () => void;
  onSelectWorkout?: (workout: SavedWorkoutRecord) => void;
}

export const LatestWorkoutCard: React.FC<LatestWorkoutCardProps> = ({
  latestWorkout,
  onViewHistory,
  onSelectWorkout,
}) => {
  if (!latestWorkout) return null;

  const dateFormatted = new Date(
    latestWorkout.workout_date || latestWorkout.created_at || latestWorkout.start_time
  ).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const mins =
    latestWorkout.duration_minutes || Math.round((latestWorkout.duration_seconds || 0) / 60);

  const exerciseCount =
    latestWorkout.total_exercises || latestWorkout.exercises_data?.length || 0;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between pl-1">
        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-500">
          Latest Workout
        </h3>
        <button
          onClick={onViewHistory}
          className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
        >
          <History size={13} />
          <span>View All</span>
        </button>
      </div>

      <div
        onClick={() => (onSelectWorkout ? onSelectWorkout(latestWorkout) : onViewHistory())}
        className="bg-white border border-border-cool rounded-3xl p-5 flex items-center justify-between shadow-2xs hover:border-neutral-400 transition-all cursor-pointer active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Check size={18} strokeWidth={2.5} />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-display font-bold text-base text-neutral-900 truncate">
              {latestWorkout.workout_name}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-medium mt-0.5">
              <span>{dateFormatted}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {mins} mins
              </span>
              <span>•</span>
              <span>{exerciseCount} Exercises</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-neutral-900 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200">
            {latestWorkout.total_weight_lifted
              ? `${latestWorkout.total_weight_lifted} kg`
              : `${latestWorkout.total_sets || 0} sets`}
          </span>
          <ChevronRight size={18} className="text-neutral-400" />
        </div>
      </div>
    </div>
  );
};
