import React from 'react';
import { motion } from 'motion/react';
import { Dumbbell, ChevronRight, Check } from 'lucide-react';
import { Exercise } from '../constants/exerciseLibrary';

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  isCompleted?: boolean;
  isInSession?: boolean;
  onClick?: (exercise: Exercise) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  index,
  isCompleted,
  isInSession,
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3), ease: 'easeOut' }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick?.(exercise)}
      className={`w-full border rounded-2xl p-4 flex items-center justify-between text-left transition-all duration-200 cursor-pointer group ${
        isCompleted
          ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
          : isInSession
          ? 'bg-neutral-50 border-neutral-300'
          : 'bg-white border-border-cool hover:border-neutral-300 hover:shadow-xs'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-3">
        {/* Exercise Badge */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-xs shrink-0 shadow-2xs transition-colors ${
            isCompleted
              ? 'bg-emerald-600 text-white'
              : 'bg-neutral-900 text-white group-hover:bg-black'
          }`}
        >
          {isCompleted ? <Check size={18} /> : <Dumbbell size={16} />}
        </div>

        {/* Name and Equipment */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-sans font-bold text-sm text-neutral-900 tracking-tight leading-snug truncate">
              {exercise.name}
            </h4>

            {isCompleted && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                ✓ Completed
              </span>
            )}

            {!isCompleted && isInSession && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-700 bg-neutral-200 px-2 py-0.5 rounded-full shrink-0">
                ○ In Session
              </span>
            )}
          </div>

          {exercise.equipment && (
            <span className="inline-block mt-1 text-[10px] font-medium text-neutral-500 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-md">
              {exercise.equipment}
            </span>
          )}
        </div>
      </div>

      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isCompleted
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-neutral-50 text-neutral-400 group-hover:bg-neutral-100 group-hover:text-neutral-700'
        }`}
      >
        <ChevronRight size={16} />
      </div>
    </motion.div>
  );
};

