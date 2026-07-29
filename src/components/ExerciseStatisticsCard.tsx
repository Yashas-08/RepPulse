import React from 'react';
import { Dumbbell, Trophy, Calendar, Hash, Layers, Scale } from 'lucide-react';
import { ExerciseStats } from '../services/workoutProgressService';

interface ExerciseStatisticsCardProps {
  stats: ExerciseStats;
  onClose?: () => void;
}

export const ExerciseStatisticsCard: React.FC<ExerciseStatisticsCardProps> = ({
  stats,
  onClose,
}) => {
  // Format Date (e.g. "20 July 2026")
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-border-cool rounded-3xl p-4 shadow-sm flex flex-col gap-3.5 select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            <Dumbbell size={16} />
          </div>
          <div className="min-w-0">
            <h4 className="font-display font-bold text-xs text-neutral-900 uppercase tracking-tight truncate">
              {stats.exerciseName}
            </h4>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
              Lifetime Exercise Statistics
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 text-xs font-bold uppercase tracking-wider px-2 py-1"
          >
            Close
          </button>
        )}
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* HIGHEST WEIGHT */}
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-2.5 flex flex-col">
          <div className="flex items-center gap-1.5 text-amber-600 mb-1">
            <Trophy size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Max Weight</span>
          </div>
          <span className="font-display font-black text-sm text-neutral-900">
            {stats.highestWeight > 0 ? `${stats.highestWeight} kg` : 'N/A'}
          </span>
        </div>

        {/* HIGHEST REPS */}
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-2.5 flex flex-col">
          <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
            <Hash size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Max Reps</span>
          </div>
          <span className="font-display font-black text-sm text-neutral-900">
            {stats.highestReps > 0 ? `${stats.highestReps} reps` : 'N/A'}
          </span>
        </div>

        {/* TOTAL SESSIONS */}
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-2.5 flex flex-col">
          <div className="flex items-center gap-1.5 text-blue-600 mb-1">
            <Layers size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Sessions</span>
          </div>
          <span className="font-display font-black text-sm text-neutral-900">
            {stats.totalSessions} {stats.totalSessions === 1 ? 'Session' : 'Sessions'}
          </span>
        </div>

        {/* TOTAL SETS */}
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-2.5 flex flex-col">
          <div className="flex items-center gap-1.5 text-purple-600 mb-1">
            <Hash size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Total Sets</span>
          </div>
          <span className="font-display font-black text-sm text-neutral-900">
            {stats.totalSets}
          </span>
        </div>

        {/* AVG WEIGHT */}
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-2.5 flex flex-col">
          <div className="flex items-center gap-1.5 text-neutral-600 mb-1">
            <Scale size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Avg Weight</span>
          </div>
          <span className="font-display font-black text-sm text-neutral-900">
            {stats.averageWeight > 0 ? `${stats.averageWeight} kg` : 'N/A'}
          </span>
        </div>

        {/* LAST PERFORMED */}
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-2.5 flex flex-col">
          <div className="flex items-center gap-1.5 text-rose-600 mb-1">
            <Calendar size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Last Done</span>
          </div>
          <span className="font-display font-bold text-xs text-neutral-900 mt-0.5 truncate">
            {formatDate(stats.lastPerformedDate)}
          </span>
        </div>
      </div>
    </div>
  );
};
