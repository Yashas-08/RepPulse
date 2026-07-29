import React from 'react';

interface WorkoutStatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  accentColor?: 'neutral' | 'emerald' | 'amber';
}

export const WorkoutStatsCard: React.FC<WorkoutStatsCardProps> = ({
  icon,
  label,
  value,
  unit,
  subValue,
  accentColor = 'neutral',
}) => {
  return (
    <div className="bg-neutral-50 border border-border-cool rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs min-w-0 h-full">
      <div className="flex items-center gap-1.5 text-neutral-500 mb-1 min-w-0">
        <div className="text-neutral-600 shrink-0">{icon}</div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate min-w-0 flex-1">
          {label}
        </span>
      </div>

      <div className="flex items-baseline gap-1 my-0.5 min-w-0">
        <span className="font-display font-black text-xl sm:text-2xl text-neutral-900 tracking-tight truncate">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-xs font-semibold text-neutral-500 shrink-0">{unit}</span>}
      </div>

      {subValue && (
        <span className="text-[10px] font-medium text-neutral-400 mt-1 leading-normal">
          {subValue}
        </span>
      )}
    </div>
  );
};
