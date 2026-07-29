import React from 'react';
import { TodaySummaryData } from '../../services/dashboardAnalyticsService';

interface TodaySummaryCardProps {
  summary: TodaySummaryData;
}

export const TodaySummaryCard: React.FC<TodaySummaryCardProps> = ({ summary }) => {
  return (
    <div className="bg-white border border-border-cool rounded-3xl p-5 shadow-2xs flex flex-col gap-3">
      <div className="flex items-center justify-between pl-1">
        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-500">
          Today's Summary
        </h3>
        <span className="text-[10px] font-semibold text-neutral-400">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Workouts */}
        <div className="bg-neutral-50/80 border border-neutral-100 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
          <span className="font-display font-black text-xl text-neutral-900 tracking-tight">
            {summary.workoutsToday}
          </span>
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-1">
            {summary.workoutsToday === 1 ? 'Workout' : 'Workouts'}
          </span>
        </div>

        {/* Duration */}
        <div className="bg-neutral-50/80 border border-neutral-100 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
          <span className="font-display font-black text-xl text-neutral-900 tracking-tight">
            {summary.durationMinutesToday}
          </span>
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-1">
            Minutes
          </span>
        </div>

        {/* Total Weight */}
        <div className="bg-neutral-50/80 border border-neutral-100 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
          <span className="font-display font-black text-xl text-neutral-900 tracking-tight truncate w-full">
            {(summary.weightLiftedTodayKg || (summary as any).totalVolumeTodayKg) ? Math.round(summary.weightLiftedTodayKg || (summary as any).totalVolumeTodayKg) : 0}
          </span>
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-1">
            kg Lifted
          </span>
        </div>
      </div>
    </div>
  );
};
