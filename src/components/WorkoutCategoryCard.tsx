import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { WorkoutCategory } from '../constants/workoutCategories';

interface WorkoutCategoryCardProps {
  category: WorkoutCategory;
  onClick: (category: WorkoutCategory) => void;
}

export const WorkoutCategoryCard: React.FC<WorkoutCategoryCardProps> = ({ category, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={() => onClick(category)}
      className="w-full bg-white border border-border-cool rounded-2xl p-4 flex items-center justify-between text-left hover:border-neutral-300 hover:shadow-xs active:bg-neutral-50/80 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
      aria-label={`Select ${category.title} workout routine`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-3">
        {/* Category Icon Badge */}
        <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-xl shrink-0 group-hover:bg-neutral-100/80 transition-colors shadow-2xs">
          <span role="img" aria-label={category.title}>
            {category.icon}
          </span>
        </div>

        {/* Category Details */}
        <div className="min-w-0 flex-1">
          <h3 className="font-sans font-bold text-base text-neutral-900 tracking-tight leading-snug group-hover:text-black transition-colors">
            {category.title}
          </h3>
          <p className="text-xs text-neutral-500 font-normal leading-normal mt-0.5 line-clamp-2">
            {category.subtitle}
          </p>
        </div>
      </div>

      {/* Right Arrow Indicator */}
      <div className="w-8 h-8 rounded-full bg-neutral-50 group-hover:bg-neutral-900 group-hover:text-white text-neutral-400 flex items-center justify-center shrink-0 transition-all duration-200 border border-border-cool group-hover:border-neutral-900">
        <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  );
};
