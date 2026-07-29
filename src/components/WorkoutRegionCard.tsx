import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { MuscleRegion } from '../constants/exerciseLibrary';

interface WorkoutRegionCardProps {
  region: MuscleRegion;
  onClick: (region: MuscleRegion) => void;
}

export const WorkoutRegionCard: React.FC<WorkoutRegionCardProps> = ({ region, onClick }) => {
  const exerciseCount = region.exercises.length;

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={() => onClick(region)}
      className="w-full bg-white border border-border-cool rounded-2xl p-4 flex items-center justify-between text-left hover:border-neutral-300 hover:shadow-xs active:bg-neutral-50/80 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
      aria-label={`Select ${region.name} muscle region with ${exerciseCount} exercises`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
        {/* Icon / Avatar Badge */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-lg shrink-0 group-hover:bg-neutral-100/80 transition-colors shadow-2xs self-center">
          <span>{region.icon || '💪'}</span>
        </div>

        {/* Region Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <h3 className="font-sans font-bold text-sm sm:text-base text-neutral-900 tracking-tight leading-snug group-hover:text-black transition-colors truncate min-w-0 flex-1">
              {region.name}
            </h3>
            <span className="text-[8.5px] font-bold tracking-wider text-neutral-500 bg-neutral-100 border border-neutral-200/80 px-1.5 py-0.5 rounded-full shrink-0 uppercase whitespace-nowrap">
              {exerciseCount} {exerciseCount === 1 ? 'Exercise' : 'Exercises'}
            </span>
          </div>

          <p className="text-xs text-neutral-500 font-normal leading-normal mt-0.5 line-clamp-2">
            {region.subtitle}
          </p>
        </div>
      </div>

      {/* Right Arrow */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-50 group-hover:bg-neutral-900 group-hover:text-white text-neutral-400 flex items-center justify-center shrink-0 transition-all duration-200 border border-border-cool group-hover:border-neutral-900 ml-1 self-center">
        <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  );
};
