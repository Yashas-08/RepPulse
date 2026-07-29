import React from 'react';
import { History, Calendar, Scale, AlertTriangle, RefreshCw } from 'lucide-react';
import { PreviousExercisePerformance } from '../services/previousWorkoutService';

interface PreviousWorkoutCardProps {
  performance: PreviousExercisePerformance | null;
  isLoading?: boolean;
  errorMsg?: string | null;
  onRetry?: () => void;
}

export const PreviousWorkoutCard: React.FC<PreviousWorkoutCardProps> = ({
  performance,
  isLoading = false,
  errorMsg = null,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="bg-neutral-50/80 border border-border-cool rounded-2xl p-4 flex items-center justify-center gap-2 text-neutral-400">
        <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Fetching previous history...</span>
      </div>
    );
  }

  // Step 10: Display error message with Retry button
  if (errorMsg) {
    return (
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-900 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <span className="font-medium truncate">{errorMsg || 'Unable to load previous workout.'}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 font-bold bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-lg text-amber-950 transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  // Step 4: If no previous workout found
  if (!performance || performance.completedSets.length === 0) {
    return (
      <div className="bg-neutral-50/80 border border-border-cool rounded-2xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-neutral-200/80 text-neutral-500 flex items-center justify-center shrink-0">
          <History size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-tight">
            Previous Workout
          </h4>
          <p className="text-[11px] font-medium text-neutral-500 mt-0.5">
            No previous workout found.
          </p>
        </div>
      </div>
    );
  }

  // Format Date (e.g. "20 July 2026")
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-neutral-900 text-white border border-neutral-800 rounded-3xl p-4 flex flex-col gap-3 shadow-md relative overflow-hidden select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/10 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-white/10">
            <History size={16} />
          </div>

          <div className="min-w-0">
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider truncate">
              Previous Workout
            </h4>
            <div className="flex items-center gap-1 text-[10px] text-amber-300 font-mono mt-0.5">
              <Calendar size={11} className="shrink-0" />
              <span>{formatDate(performance.workoutDate)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 border border-white/10 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shrink-0 text-right">
          <Scale size={12} className="text-amber-400" />
          <div className="flex flex-col items-end leading-none">
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Total Vol</span>
            <span className="font-display font-black text-xs text-white mt-0.5">
              {performance.totalVolume.toLocaleString()} kg
            </span>
          </div>
        </div>
      </div>

      {/* COMPLETED SETS LIST */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {performance.completedSets.map((set, idx) => (
          <div
            key={idx}
            className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px]"
          >
            <span className="font-bold text-neutral-400 text-[10px]">
              Set {set.setNumber || idx + 1}
            </span>
            <span className="font-mono font-bold text-white">
              {set.weight} kg × {set.reps}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
