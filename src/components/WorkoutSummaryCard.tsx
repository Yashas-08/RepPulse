import React from 'react';
import { Dumbbell, Check, Layers } from 'lucide-react';
import { SessionExercise } from '../types/workoutSession';

interface WorkoutSummaryCardProps {
  exercise: SessionExercise;
}

export const WorkoutSummaryCard: React.FC<WorkoutSummaryCardProps> = ({ exercise }) => {
  const completedSets = exercise.sets.filter((s) => s.completed);

  if (completedSets.length === 0) return null;

  return (
    <div className="bg-white border border-border-cool rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2.5 shadow-2xs hover:border-neutral-300 transition-colors">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            <Dumbbell size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-sans font-bold text-sm sm:text-base text-neutral-900 tracking-tight truncate">
              {exercise.name}
            </h4>
            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest block truncate mt-0.5">
              {exercise.regionName} • {exercise.equipment || 'Standard'}
            </span>
          </div>
        </div>

        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 shadow-2xs whitespace-nowrap">
          <Check size={12} />
          <span>
            {completedSets.length} {completedSets.length === 1 ? 'Set' : 'Sets'}
          </span>
        </span>
      </div>

      {/* SETS BADGES BREAKDOWN */}
      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-100">
        {completedSets.map((s, idx) => (
          <span
            key={s.id}
            className="text-[11px] font-mono font-medium text-neutral-800 bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded-lg flex items-center gap-1"
          >
            <span className="text-[10px] font-bold text-neutral-400">#{idx + 1}</span>
            <span>
              {s.weight}kg × {s.reps}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};
