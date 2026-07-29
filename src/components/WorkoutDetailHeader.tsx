import React from 'react';
import { ArrowLeft, Calendar, Clock, Trophy } from 'lucide-react';
import { SavedWorkoutRecord } from '../services/workoutSaveService';

interface WorkoutDetailHeaderProps {
  record: SavedWorkoutRecord;
  onBack: () => void;
}

export const WorkoutDetailHeader: React.FC<WorkoutDetailHeaderProps> = ({
  record,
  onBack,
}) => {
  // Format Date (e.g., "20 July 2026")
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

  // Format Time (e.g., "08:30 AM")
  const formatTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return '--:--';
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '--:--';
    }
  };

  // Format Duration
  const formatDuration = (mins: number) => {
    if (!mins || mins <= 0) return '1 min';
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
    }
    return `${mins} mins`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* STICKY TOP BAR */}
      <header className="h-14 bg-white border-b border-border-cool flex items-center justify-between px-5 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-700 bg-neutral-50 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer shrink-0 border border-border-cool"
            aria-label="Back to workout history list"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase">
              Workout Details
            </h1>
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest -mt-0.5">
              History Log
            </p>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <div className="bg-neutral-900 text-white rounded-3xl p-5 mx-5 shadow-xl flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              Completed Session
            </span>
            <h2 className="font-display font-black text-2xl tracking-tight uppercase mt-0.5 text-white truncate">
              {record.workout_name}
            </h2>
          </div>

          <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0 border border-white/10">
            <Trophy size={22} />
          </div>
        </div>

        {/* TIME & DATE PILLS */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs font-medium text-neutral-300">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
            <Calendar size={13} className="text-amber-400" />
            <span>{formatDate(record.workout_date || record.created_at)}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
            <Clock size={13} className="text-amber-400" />
            <span>{formatDuration(record.duration_minutes)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 ml-auto">
            <span>
              {formatTime(record.start_time)} - {formatTime(record.end_time)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
