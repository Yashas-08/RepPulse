import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, CheckCircle2, AlertCircle, Loader2, X, Save } from 'lucide-react';
import { WorkoutCalculatedStats } from '../services/workoutSaveService';

interface SaveWorkoutDialogProps {
  isOpen: boolean;
  workoutName: string;
  stats: WorkoutCalculatedStats;
  isSaving: boolean;
  error: string | null;
  isSuccess: boolean;
  onCancel: () => void;
  onConfirmSave: () => void;
}

export const SaveWorkoutDialog: React.FC<SaveWorkoutDialogProps> = ({
  isOpen,
  workoutName,
  stats,
  isSaving,
  error,
  isSuccess,
  onCancel,
  onConfirmSave,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-3xl border border-border-cool p-6 w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col gap-4"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between pb-3 border-b border-border-cool">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-amber-400 flex items-center justify-center font-bold shadow-2xs">
                <Trophy size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-neutral-900 uppercase tracking-tight">
                  Save Workout?
                </h3>
                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                  {workoutName}
                </p>
              </div>
            </div>

            {!isSaving && !isSuccess && (
              <button
                onClick={onCancel}
                className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* SUCCESS STATE */}
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 flex flex-col items-center justify-center text-center gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="font-display font-black text-lg text-neutral-900 uppercase tracking-tight">
                Workout Saved Successfully!
              </h4>
              <p className="text-xs text-neutral-500 font-medium">
                Great job! Redirecting to dashboard...
              </p>
            </motion.div>
          ) : (
            <>
              {/* STATS OVERVIEW MINI CARD */}
              <div className="bg-neutral-50 border border-border-cool rounded-2xl p-3.5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-neutral-500">Duration</span>
                  <span className="font-mono font-bold text-neutral-900">{stats.formattedDuration}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-neutral-500">Exercises</span>
                  <span className="font-bold text-neutral-900">{stats.totalExercises}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-neutral-500">Completed Sets</span>
                  <span className="font-bold text-neutral-900">{stats.totalSets}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-neutral-200 pt-2">
                  <span className="font-bold text-neutral-800 uppercase tracking-wider text-[10px]">Total Weight Lifted</span>
                  <span className="font-display font-black text-sm text-neutral-900">{stats.totalWeightLifted.toLocaleString()} kg</span>
                </div>
              </div>

              {/* ERROR ALERT */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2 text-red-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider">Save Failed</p>
                    <p className="text-[11px] font-medium leading-tight mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-xl border border-border-cool text-xs font-bold uppercase tracking-wider text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onConfirmSave}
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs disabled:opacity-60 transition-all cursor-pointer active:scale-95"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{error ? 'Retry Save' : 'Save'}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
