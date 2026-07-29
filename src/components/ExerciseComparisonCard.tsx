import React from 'react';
import { ArrowUpRight, ArrowDownRight, Equal, CheckCircle2 } from 'lucide-react';
import { SetComparisonResult } from '../services/workoutProgressService';

interface ExerciseComparisonCardProps {
  currentWeight: number;
  currentReps: number;
  prevSet?: { weight: number; reps: number };
  comparison: SetComparisonResult;
}

export const ExerciseComparisonCard: React.FC<ExerciseComparisonCardProps> = ({
  currentWeight,
  currentReps,
  prevSet,
  comparison,
}) => {
  if (comparison.type === 'no_previous') {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-neutral-500">
        <span className="text-[11px] font-medium">First time logging this set</span>
        <span className="font-mono font-bold text-neutral-800">
          {currentWeight} kg × {currentReps} reps
        </span>
      </div>
    );
  }

  const isPositive =
    comparison.type === 'improved_weight' ||
    comparison.type === 'improved_reps' ||
    comparison.type === 'weight_up' ||
    comparison.type === 'reps_up';

  const isLower =
    comparison.type === 'below_previous' ||
    comparison.type === 'lower';

  return (
    <div
      className={`border rounded-xl p-2.5 flex items-center justify-between text-xs transition-all ${
        isPositive
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          : isLower
          ? 'bg-amber-50/80 border-amber-200 text-amber-950'
          : 'bg-neutral-50 border-neutral-200 text-neutral-800'
      }`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          {isPositive && <ArrowUpRight size={14} className="text-emerald-700 shrink-0" />}
          {isLower && <ArrowDownRight size={14} className="text-amber-600 shrink-0" />}
          {!isPositive && !isLower && <Equal size={14} className="text-neutral-500 shrink-0" />}

          <span className="font-bold text-[11px] uppercase tracking-wider">
            {comparison.message}
          </span>
        </div>

        {prevSet && (
          <span className="text-[10px] text-neutral-500 font-medium mt-0.5">
            Previous: {prevSet.weight} kg × {prevSet.reps} reps
          </span>
        )}
      </div>

      <div className="font-mono font-bold text-xs shrink-0 text-right">
        <span>
          {currentWeight} kg × {currentReps}
        </span>
      </div>
    </div>
  );
};
