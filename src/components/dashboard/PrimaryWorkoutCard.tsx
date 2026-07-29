import React from 'react';
import { motion } from 'motion/react';
import { Play, Dumbbell } from 'lucide-react';

interface PrimaryWorkoutCardProps {
  onStartWorkout: () => void;
  hasActiveSession?: boolean;
}

export const PrimaryWorkoutCard: React.FC<PrimaryWorkoutCardProps> = ({
  onStartWorkout,
  hasActiveSession = false,
}) => {
  return (
    <div className="relative bg-neutral-900 text-white rounded-3xl p-6 shadow-md border border-neutral-800 overflow-hidden flex flex-col justify-between gap-6 transition-all hover:border-neutral-700 w-full shrink-0">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -right-8 -top-8 w-44 h-44 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between relative z-10 gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              {hasActiveSession ? 'Active Session' : "Today's Workout"}
            </span>
          </div>
          <h2 className="font-display font-black text-2xl text-white tracking-tight leading-tight">
            {hasActiveSession ? 'Workout In Progress' : 'Ready for Today’s Workout?'}
          </h2>
          <p className="text-xs text-neutral-400 font-normal leading-relaxed max-w-[280px]">
            {hasActiveSession
              ? 'Continue your session and track every set.'
              : 'Log your custom routine, track weight & reps, and build momentum.'}
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 text-white shadow-2xs">
          <Dumbbell size={22} className="text-amber-400" />
        </div>
      </div>

      <div className="relative z-10 w-full pt-1 pb-0.5">
        <motion.button
          type="button"
          onClick={onStartWorkout}
          whileTap={{ scale: 0.98 }}
          className="w-full h-14 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer border-none px-4 select-none"
        >
          <Play size={18} className="fill-neutral-900 text-neutral-900 shrink-0 ml-0.5" />
          <span className="text-neutral-900 font-extrabold tracking-wider">
            {hasActiveSession ? 'Resume Workout' : 'Start Workout'}
          </span>
        </motion.button>
      </div>
    </div>
  );
};
