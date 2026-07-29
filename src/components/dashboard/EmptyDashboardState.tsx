import React from 'react';
import { Dumbbell, Play } from 'lucide-react';
import { Button } from '../UI';

interface EmptyDashboardStateProps {
  onStartWorkout: () => void;
}

export const EmptyDashboardState: React.FC<EmptyDashboardStateProps> = ({ onStartWorkout }) => {
  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-3xl p-8 flex flex-col items-center text-center shadow-lg border border-neutral-700 my-2">
      <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/10 text-amber-400 shadow-md">
        <Dumbbell size={32} />
      </div>

      <h2 className="font-display font-black text-2xl uppercase tracking-tight text-white">
        Welcome to RepPulse
      </h2>

      <p className="text-sm text-neutral-300 max-w-[280px] mt-2 mb-6 leading-relaxed font-normal">
        Your fitness journey starts here. Start your first workout to track sets, duration, and personal records.
      </p>

      <Button
        onClick={onStartWorkout}
        variant="primary"
        className="w-full max-w-[280px] h-14 rounded-2xl text-base font-bold uppercase tracking-wider flex items-center justify-center gap-3 bg-white text-neutral-900 hover:bg-neutral-100 shadow-md cursor-pointer border-none active:scale-[0.99] transition-all"
      >
        <Play size={18} className="fill-neutral-900 text-neutral-900 ml-0.5" />
        <span>Start Workout</span>
      </Button>
    </div>
  );
};
