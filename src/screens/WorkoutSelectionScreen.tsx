import React from 'react';
import { motion } from 'motion/react';
import { Dumbbell, Sparkles } from 'lucide-react';
import { WORKOUT_CATEGORIES, WorkoutCategory } from '../constants/workoutCategories';
import { WorkoutCategoryCard } from '../components/WorkoutCategoryCard';

interface WorkoutSelectionScreenProps {
  currentUser?: any;
  onSelectCategory: (category: WorkoutCategory) => void;
}

export const WorkoutSelectionScreen: React.FC<WorkoutSelectionScreenProps> = ({
  onSelectCategory,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden select-none">
      {/* HEADER / WORKOUT SELECTION CARD */}
      <header className="bg-white border-b border-border-cool px-5 py-4 sticky top-0 z-40 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Dumbbell size={18} />
            </div>
            <div className="flex flex-col">
              <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase">
                Workout Selection
              </h1>
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mt-0.5">
                Choose Routine
              </p>

              {/* 🟢 Ready to Train status pill */}
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                  Ready to Train
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-50 border border-border-cool shrink-0">
            <Sparkles size={12} className="text-neutral-600" />
            <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
              Flexible Split
            </span>
          </div>
        </div>
      </header>

      {/* MAIN SCROLLABLE VIEWPORT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 flex flex-col gap-5 pb-28">
        {/* CATEGORIES LIST */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="font-display font-semibold text-xs text-neutral-900 uppercase tracking-wide">
              Workout Categories ({WORKOUT_CATEGORIES.length})
            </h3>
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
              Tap to Start
            </span>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-3"
          >
            {WORKOUT_CATEGORIES.map((category) => (
              <WorkoutCategoryCard
                key={category.id}
                category={category}
                onClick={onSelectCategory}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

