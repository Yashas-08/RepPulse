import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  Dumbbell,
  Layers,
  Scale,
  ChevronDown,
  ChevronRight,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { SavedWorkoutRecord } from '../services/workoutSaveService';

interface WorkoutHistoryCardProps {
  record: SavedWorkoutRecord;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewDetails: () => void;
  onDeleteRecord: (recordId: string) => Promise<void> | void;
}

export const WorkoutHistoryCard: React.FC<WorkoutHistoryCardProps> = ({
  record,
  isExpanded,
  onToggleExpand,
  onViewDetails,
  onDeleteRecord,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format Date (e.g. "23 July 2026")
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

  // Format Duration (e.g. "1 min" or "58 mins")
  const formatDuration = (mins: number) => {
    if (!mins || mins <= 0) return '1 min';
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
    }
    return `${mins} mins`;
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteRecord(record.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const workoutName = record.workout_name || 'Workout Session';
  const workoutDateStr = formatDate(
    record.workout_date || record.created_at || new Date().toISOString()
  );
  const durationStr = formatDuration(record.duration_minutes || 0);

  return (
    <>
      <div className="bg-white border border-border-cool rounded-3xl p-4 shadow-2xs hover:border-neutral-300 transition-all select-none overflow-hidden">
        {/* COLLAPSED / HEADER ROW (Tap to expand/collapse) */}
        <div
          onClick={onToggleExpand}
          className="flex items-center justify-between gap-3 cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Dumbbell size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-display font-black text-sm sm:text-base text-neutral-900 tracking-tight uppercase truncate">
                {workoutName}
              </h3>

              <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 mt-0.5 truncate">
                <Calendar size={12} className="shrink-0" />
                <span>
                  {workoutDateStr} • {durationStr}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* DELETE BUTTON */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-rose-50 border border-border-cool hover:border-rose-200 flex items-center justify-center text-neutral-400 hover:text-rose-600 transition-all cursor-pointer"
              title="Delete Workout"
              aria-label="Delete Workout"
            >
              <Trash2 size={14} />
            </button>

            {/* EXPAND TOGGLE CHEVRON */}
            <div className="w-8 h-8 rounded-full bg-neutral-50 border border-border-cool flex items-center justify-center text-neutral-400 group-hover:text-neutral-900 group-hover:bg-neutral-100 transition-colors">
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <ChevronDown size={16} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* EXPANDED ACCORDION CONTENT */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-3.5 mt-3 border-t border-neutral-100 flex flex-col gap-3">
                {/* METRICS GRID */}
                <div className="grid grid-cols-4 gap-2 bg-neutral-50/80 border border-neutral-100 rounded-2xl p-3">
                  {/* TIME */}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                      <Clock size={11} />
                      <span>Time</span>
                    </div>
                    <span className="font-display font-bold text-xs text-neutral-900">
                      {durationStr}
                    </span>
                  </div>

                  {/* EXERCISES */}
                  <div className="flex flex-col items-center text-center border-l border-neutral-200/60 pl-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                      <Dumbbell size={11} />
                      <span>Exs</span>
                    </div>
                    <span className="font-display font-bold text-xs text-neutral-900">
                      {record.total_exercises || (record.exercises_data?.length || 0)}
                    </span>
                  </div>

                  {/* SETS */}
                  <div className="flex flex-col items-center text-center border-l border-neutral-200/60 pl-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                      <Layers size={11} />
                      <span>Sets</span>
                    </div>
                    <span className="font-display font-bold text-xs text-neutral-900">
                      {record.total_sets || 0}
                    </span>
                  </div>

                  {/* WEIGHT LIFTED */}
                  <div className="flex flex-col items-center text-center border-l border-neutral-200/60 pl-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                      <Scale size={11} />
                      <span>Lifted</span>
                    </div>
                    <span className="font-display font-bold text-xs text-neutral-900 truncate max-w-full">
                      {(record.total_weight_lifted || 0).toLocaleString()} kg
                    </span>
                  </div>
                </div>

                {/* VIEW FULL WORKOUT BUTTON */}
                <button
                  type="button"
                  onClick={onViewDetails}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>View Full Workout</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-3xl border border-border-cool p-6 w-full max-w-xs shadow-2xl relative overflow-hidden flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>

                {!isDeleting && (
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-neutral-900 tracking-tight">
                  Delete Workout?
                </h3>
                <p className="text-xs font-normal text-neutral-500 leading-relaxed mt-1">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border-cool bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
