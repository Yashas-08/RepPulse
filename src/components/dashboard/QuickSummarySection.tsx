import React from 'react';
import { Calendar, Scale, Flame } from 'lucide-react';

interface QuickSummarySectionProps {
  workoutsThisWeek: number;
  currentWeight: string | null;
  streakDays: number;
}

export const QuickSummarySection: React.FC<QuickSummarySectionProps> = ({
  workoutsThisWeek,
  currentWeight,
  streakDays,
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-500 pl-1">
        Quick Summary
      </h3>

      <div className="grid grid-cols-3 gap-2.5">
        {/* Workouts This Week */}
        <div className="bg-white border border-border-cool rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs hover:border-neutral-300 transition-all">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center mb-1.5 shrink-0">
            <Calendar size={14} />
          </div>
          <span className="font-display font-black text-xl text-neutral-900 tracking-tight leading-none">
            {workoutsThisWeek}
          </span>
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mt-1.5 line-clamp-1">
            This Week
          </span>
        </div>

        {/* Current Weight */}
        <div className="bg-white border border-border-cool rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs hover:border-neutral-300 transition-all">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center mb-1.5 shrink-0">
            <Scale size={14} />
          </div>
          <span className="font-display font-black text-xl text-neutral-900 tracking-tight leading-none truncate w-full">
            {currentWeight ? `${currentWeight}` : '--'}
          </span>
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mt-1.5 line-clamp-1">
            {currentWeight ? 'Weight (kg)' : 'Weight'}
          </span>
        </div>

        {/* Workout Streak */}
        <div className="bg-white border border-border-cool rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs hover:border-neutral-300 transition-all">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1.5 shrink-0">
            <Flame size={14} />
          </div>
          <span className="font-display font-black text-xl text-neutral-900 tracking-tight leading-none">
            {streakDays}
          </span>
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mt-1.5 line-clamp-1">
            {streakDays === 1 ? '1 Day Streak' : 'Streak Days'}
          </span>
        </div>
      </div>
    </div>
  );
};
