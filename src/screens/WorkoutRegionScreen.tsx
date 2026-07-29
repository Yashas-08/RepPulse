import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Dumbbell, Sparkles } from 'lucide-react';
import { WorkoutCategory } from '../constants/workoutCategories';
import { MuscleRegion, EXERCISE_LIBRARY } from '../constants/exerciseLibrary';
import { WorkoutRegionCard } from '../components/WorkoutRegionCard';

interface WorkoutRegionScreenProps {
  category: WorkoutCategory;
  onSelectRegion: (region: MuscleRegion) => void;
  onBack: () => void;
}

export const WorkoutRegionScreen: React.FC<WorkoutRegionScreenProps> = ({
  category,
  onSelectRegion,
  onBack,
}) => {
  const regions: MuscleRegion[] = EXERCISE_LIBRARY[category.id] || [];

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
            <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase flex items-center gap-1.5">
              <span>{category.icon}</span>
              <span>{category.title}</span>
            </h1>
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest -mt-0.5">
              Select Muscle Region
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-50 border border-border-cool">
          <Sparkles size={12} className="text-neutral-600" />
          <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
            {regions.length} {regions.length === 1 ? 'Region' : 'Regions'}
          </span>
        </div>
      </header>

      {/* MAIN SCROLLABLE CONTAINER */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 flex flex-col gap-5 pb-28">
        {/* HERO BANNER - COMPACT DYNAMIC HEIGHT */}
        <div className="bg-neutral-50/80 border border-border-cool rounded-3xl p-3.5 sm:p-4 flex flex-col items-start relative overflow-hidden shadow-2xs w-full">
          <div className="inline-flex items-center gap-1.5 bg-white border border-border-cool px-2.5 py-1 rounded-full mb-2 shadow-2xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-neutral-900" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">
              Targeted Training
            </span>
          </div>

          <h2 className="font-display font-black text-xl text-neutral-900 tracking-tight leading-tight">
            {category.title} Split
          </h2>
          <p className="text-xs text-neutral-500 font-normal leading-relaxed mt-1">
            {category.subtitle}
          </p>
        </div>

        {/* REGIONS LIST */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="font-display font-semibold text-xs text-neutral-900 uppercase tracking-wide">
              Muscle Regions
            </h3>
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
              Choose Target
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col gap-3"
          >
            {regions.map((region) => (
              <WorkoutRegionCard
                key={region.id}
                region={region}
                onClick={onSelectRegion}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
