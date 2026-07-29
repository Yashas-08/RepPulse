import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Construction, ArrowLeft, Clock } from 'lucide-react';
import { WorkoutCategory } from '../constants/workoutCategories';
import { Button } from '../components/UI';

interface WorkoutPlaceholderScreenProps {
  category: WorkoutCategory;
  onBack: () => void;
}

export const WorkoutPlaceholderScreen: React.FC<WorkoutPlaceholderScreenProps> = ({
  category,
  onBack,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden select-none">
      {/* HEADER */}
      <header className="h-14 bg-white border-b border-border-cool flex items-center justify-between px-5 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer mr-1 border border-border-cool"
            aria-label="Back to workout selection"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase">
              {category.title} Workout
            </h1>
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest -mt-0.5">
              Workout Logger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
          <Clock size={12} className="text-amber-600" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Phase 2</span>
        </div>
      </header>

      {/* MAIN VIEWPORT CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-8 flex flex-col items-center justify-center text-center pb-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-sm bg-neutral-50 border border-border-cool rounded-3xl p-6 flex flex-col items-center shadow-xs relative overflow-hidden"
        >
          {/* CATEGORY EMOJI BADGE */}
          <div className="w-16 h-16 rounded-2xl bg-white border border-border-cool flex items-center justify-center text-3xl shadow-xs mb-4">
            <span role="img" aria-label={category.title}>
              {category.icon}
            </span>
          </div>

          <h2 className="font-display font-black text-2xl text-neutral-900 tracking-tight leading-tight">
            {category.title} Workout
          </h2>

          <p className="text-xs text-neutral-500 font-medium mt-1 mb-5 leading-relaxed max-w-[260px]">
            {category.subtitle}
          </p>

          <div className="w-full bg-white border border-border-cool rounded-2xl p-4 mb-6 flex flex-col items-center text-center shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <Construction size={16} />
            </div>
            <p className="font-sans font-bold text-xs text-neutral-900 uppercase tracking-wide">
              Custom Workout Builder
            </p>
            <p className="text-xs text-neutral-500 font-normal mt-1 leading-normal">
              Custom Workouts will be available in a future phase.
            </p>
          </div>

          <Button
            onClick={onBack}
            variant="secondary"
            className="w-full h-11 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-neutral-300 hover:border-neutral-400"
          >
            <ArrowLeft size={14} />
            <span>Back to Workout Selection</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
