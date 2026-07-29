import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Trash2, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';
import { WorkoutSet } from '../types/workoutSession';
import { SetComparisonResult } from '../services/workoutProgressService';
import { ProgressIndicator } from './ProgressIndicator';

interface WorkoutSetCardProps {
  set: WorkoutSet;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  prevSet?: { weight: number; reps: number };
  comparison?: SetComparisonResult;
  onUpdateSet: (setId: string, weight: string, reps: string, completed: boolean) => void;
  onDeleteSet: (setId: string) => void;
}

export const WorkoutSetCard: React.FC<WorkoutSetCardProps> = ({
  set,
  index,
  isExpanded,
  onToggleExpand,
  prevSet,
  comparison,
  onUpdateSet,
  onDeleteSet,
}) => {
  const [weight, setWeight] = useState(set.weight);
  const [reps, setReps] = useState(set.reps);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setWeight(set.weight);
    setReps(set.reps);
  }, [set.id, set.weight, set.reps]);

  const handleComplete = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const numWeight = parseFloat(weight);
    const numReps = parseInt(reps, 10);

    if (isNaN(numWeight) || numWeight <= 0) {
      setErrorMsg('Please enter a valid weight (> 0 kg)');
      return;
    }
    if (isNaN(numReps) || numReps <= 0) {
      setErrorMsg('Please enter valid reps (> 0)');
      return;
    }

    setErrorMsg(null);
    onUpdateSet(set.id, weight, reps, true);
  };

  return (
    <div
      className={`w-full rounded-2xl border transition-all duration-200 overflow-hidden ${
        set.completed
          ? 'bg-emerald-50/50 border-emerald-200/80 shadow-2xs'
          : isExpanded
          ? 'bg-white border-neutral-900 shadow-sm'
          : 'bg-white border-border-cool shadow-2xs hover:border-neutral-300'
      }`}
    >
      {/* COLLAPSED / EXPANDED HEADER BAR (Always visible, tap header to expand/collapse) */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full py-3.5 px-4 flex items-center justify-between text-left cursor-pointer transition-colors active:bg-neutral-50"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
              set.completed
                ? 'bg-emerald-600 text-white'
                : isExpanded
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-800'
            }`}
          >
            {index + 1}
          </span>
          <span className="font-display font-bold text-sm text-neutral-900 uppercase tracking-tight truncate">
            Set {index + 1}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {set.completed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              <Check size={12} strokeWidth={2.5} />
              <span>{set.weight ? `${set.weight} kg × ${set.reps}` : 'Done'}</span>
            </span>
          )}

          <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500">
            {isExpanded ? (
              <ChevronDown size={16} className="text-neutral-900" />
            ) : (
              <ChevronRight size={16} />
            )}
          </div>
        </div>
      </button>

      {/* ACCORDION EXPANDED CONTENT */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-neutral-100 bg-neutral-50/50 px-4 pt-4 pb-4"
          >
            <div className="flex flex-col gap-4">
              {/* Previous Set Reference / Comparison Badge */}
              {prevSet && (
                <div className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-xl border border-neutral-200/80">
                  <span className="text-neutral-500 font-medium">Previous Best:</span>
                  <span className="font-mono font-bold text-neutral-800">
                    {prevSet.weight} kg × {prevSet.reps} reps
                  </span>
                </div>
              )}

              {/* INPUTS SECTION */}
              <div className="grid grid-cols-2 gap-3">
                {/* Weight Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider pl-0.5">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    placeholder="0"
                    value={weight || ''}
                    onChange={(e) => {
                      setWeight(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full h-12 text-center text-lg font-black rounded-2xl bg-white border border-neutral-200 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900 shadow-2xs transition-all"
                  />
                </div>

                {/* Reps Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider pl-0.5">
                    Reps
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    placeholder="0"
                    value={reps || ''}
                    onChange={(e) => {
                      setReps(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full h-12 text-center text-lg font-black rounded-2xl bg-white border border-neutral-200 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900 shadow-2xs transition-all"
                  />
                </div>
              </div>

              {/* Comparison Indicator if set is completed */}
              {comparison && set.completed && (
                <div className="flex items-center gap-1.5 text-xs">
                  <ProgressIndicator comparison={comparison} />
                </div>
              )}

              {/* Error Message Display */}
              {errorMsg && (
                <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium pl-1 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* BUTTONS STACK (Vertical: Complete on top, Delete below) */}
              <div className="flex flex-col gap-2 pt-1">
                {/* Complete / Update Button */}
                <button
                  type="button"
                  onClick={handleComplete}
                  className={`w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99] transition-all ${
                    set.completed
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-neutral-900 hover:bg-black text-white'
                  }`}
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>{set.completed ? 'Update Set' : 'Complete Set'}</span>
                </button>

                {/* Delete Button (Secondary, outlined, placed BELOW Complete) */}
                <button
                  type="button"
                  onClick={() => onDeleteSet(set.id)}
                  className="w-full py-2.5 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <Trash2 size={15} />
                  <span>Delete Set</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
