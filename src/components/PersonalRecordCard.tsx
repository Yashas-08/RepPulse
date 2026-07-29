import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, X } from 'lucide-react';

interface PersonalRecordCardProps {
  exerciseName: string;
  recordType: 'Highest Weight' | 'Highest Reps' | 'Highest Total Volume' | 'Personal Record';
  value: string;
  onDismiss?: () => void;
}

export const PersonalRecordCard: React.FC<PersonalRecordCardProps> = ({
  exerciseName,
  recordType,
  value,
  onDismiss,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl p-4 shadow-lg border border-amber-400/30 relative overflow-hidden flex items-center justify-between gap-3"
    >
      {/* BACKGROUND DECORATIVE SHINE */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center gap-3.5 min-w-0 z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0 border border-white/20 shadow-xs">
          <Trophy size={24} className="text-amber-200 animate-bounce" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <Sparkles size={12} className="text-amber-200 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-100">
              New Personal Record!
            </span>
          </div>

          <h4 className="font-display font-black text-base uppercase tracking-tight text-white truncate leading-tight mt-0.5">
            {exerciseName}
          </h4>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono font-bold bg-black/20 border border-white/20 px-2 py-0.5 rounded-lg text-amber-100">
              {value}
            </span>
            <span className="text-[11px] font-medium text-amber-100/90">
              Congratulations! 🎉
            </span>
          </div>
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/30 text-amber-100 flex items-center justify-center cursor-pointer shrink-0 border border-white/10 z-10"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
};
