import React from 'react';
import { Flame, Trophy } from 'lucide-react';
import { StreakData } from '../../services/dashboardAnalyticsService';

interface WorkoutStreakCardProps {
  streak: StreakData;
}

export const WorkoutStreakCard: React.FC<WorkoutStreakCardProps> = ({ streak }) => {
  const isBroken = streak.currentStreak === 0;

  return (
    <div className="bg-white border border-border-cool rounded-3xl p-5 shadow-2xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 pl-1">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Flame size={16} />
          </div>
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-500">
            Workout Streak
          </h3>
        </div>

        {streak.longestStreak > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-[10px] text-neutral-600 font-semibold">
            <Trophy size={11} className="text-amber-500" />
            <span>Best: {streak.longestStreak} Days</span>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between pt-0.5">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-3xl text-neutral-900 tracking-tight">
              {streak.currentStreak}
            </span>
            <span className="font-display font-bold text-sm text-neutral-400">
              {streak.currentStreak === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          <p className="text-xs text-neutral-500 font-normal mt-1">
            {isBroken
              ? "Let's start a new streak today."
              : `${streak.currentStreak} consecutive days logged. Keep it up! 🔥`}
          </p>
        </div>
      </div>
    </div>
  );
};
