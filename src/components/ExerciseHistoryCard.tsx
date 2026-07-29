import React, { useState } from 'react';
import { Dumbbell, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { SetHistoryCard } from './SetHistoryCard';

interface ExerciseHistoryCardProps {
  exercise: {
    id: string;
    exercise_id: string;
    name: string;
    equipment?: string;
    region_name: string;
    completed_sets: {
      set_number: number;
      weight: number;
      reps: number;
    }[];
  };
}

export const ExerciseHistoryCard: React.FC<ExerciseHistoryCardProps> = ({ exercise }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const sets = exercise.completed_sets || [];

  return (
    <div className="bg-white border border-border-cool rounded-2xl p-4 shadow-2xs hover:border-neutral-300 transition-colors flex flex-col gap-3">
      {/* HEADER */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            <Dumbbell size={16} />
          </div>

          <div className="min-w-0">
            <h4 className="font-sans font-bold text-sm text-neutral-900 tracking-tight truncate">
              {exercise.name || 'Exercise'}
            </h4>
            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest block truncate">
              {exercise.region_name || 'Workout'} • {exercise.equipment || 'Standard'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Check size={12} />
            <span>
              {sets.length}{' '}
              {sets.length === 1 ? 'Set' : 'Sets'}
            </span>
          </span>

          <button className="text-neutral-400 hover:text-neutral-700">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* EXPANDABLE SET BREAKDOWN */}
      {isExpanded && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-100">
          {sets.map((set, idx) => (
            <SetHistoryCard
              key={idx}
              setNumber={set.set_number || idx + 1}
              weight={set.weight || 0}
              reps={set.reps || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};
