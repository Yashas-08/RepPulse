import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Dumbbell, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ActiveWorkoutSession } from '../types/workoutSession';

interface WorkoutSessionBarProps {
  session: ActiveWorkoutSession;
  onOpenSession: () => void;
  onFinishWorkout: () => void;
}

export const WorkoutSessionBar: React.FC<WorkoutSessionBarProps> = ({
  session,
  onOpenSession,
  onFinishWorkout,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((now - session.startTime) / 1000);
      setElapsedSeconds(diff > 0 ? diff : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session.startTime]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalExercises = session.exercises.length;
  const completedExercises = session.exercises.filter((ex) => ex.completed).length;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed bottom-2 left-4 right-4 z-40 max-w-lg mx-auto bg-neutral-900 text-white rounded-2xl p-3 shadow-xl border border-neutral-800 flex items-center justify-between"
    >
      <div
        onClick={onOpenSession}
        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2"
      >
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-white font-bold">
          <Dumbbell size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white truncate">
              Workout Session
            </h4>
            <span className="text-[10px] font-mono font-bold text-neutral-300 bg-white/10 px-1.5 py-0.5 rounded">
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          <p className="text-[11px] text-neutral-400 font-normal truncate mt-0.5">
            {totalExercises === 0
              ? 'No exercises added yet'
              : `${completedExercises}/${totalExercises} Exercises Completed`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onOpenSession}
          className="px-3 py-2 rounded-xl bg-white text-neutral-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
        >
          <span>Session</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};
