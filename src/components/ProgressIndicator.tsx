import React from 'react';
import { ArrowUpRight, ArrowDownRight, Equal, Sparkles, HelpCircle } from 'lucide-react';
import { SetComparisonResult } from '../services/workoutProgressService';

interface ProgressIndicatorProps {
  comparison: SetComparisonResult;
  size?: 'sm' | 'md';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  comparison,
  size = 'md',
}) => {
  if (comparison.type === 'no_previous') {
    return (
      <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
        <HelpCircle size={10} />
        <span>First Log</span>
      </span>
    );
  }

  if (comparison.type === 'weight_up' || comparison.type === 'improved_weight') {
    return (
      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
        <ArrowUpRight size={12} className="text-emerald-700 shrink-0" />
        <span>{comparison.weightDiff > 0 ? `+${comparison.weightDiff} kg` : 'Improved'}</span>
      </span>
    );
  }

  if (comparison.type === 'reps_up' || comparison.type === 'improved_reps') {
    return (
      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
        <ArrowUpRight size={12} className="text-emerald-700 shrink-0" />
        <span>{comparison.repsDiff > 0 ? `+${comparison.repsDiff} Reps` : 'Improved'}</span>
      </span>
    );
  }

  if (comparison.type === 'matched') {
    return (
      <span className="text-[10px] font-bold text-neutral-700 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
        <Equal size={10} className="text-neutral-500 shrink-0" />
        <span>Matched Prev</span>
      </span>
    );
  }

  // Lower
  return (
    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
      <ArrowDownRight size={12} className="text-amber-600 shrink-0" />
      <span>Lower</span>
    </span>
  );
};
