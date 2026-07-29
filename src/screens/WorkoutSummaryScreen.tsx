import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Trophy, Clock, Dumbbell, Layers, Check, ArrowLeft, AlertCircle, Repeat, Scale } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { ActiveWorkoutSession } from '../types/workoutSession';
import { WorkoutSaveService } from '../services/workoutSaveService';
import { WorkoutSessionService } from '../services/workoutSessionService';
import { WorkoutProgressService, WorkoutInsightsData } from '../services/workoutProgressService';
import { PersonalRecordService, NewlyAchievedPR } from '../services/personalRecordService';
import { PersonalRecordCard } from '../components/PersonalRecordCard';
import { WorkoutStatsCard } from '../components/WorkoutStatsCard';
import { WorkoutSummaryCard } from '../components/WorkoutSummaryCard';
import { WorkoutInsightCard } from '../components/WorkoutInsightCard';
import { SaveWorkoutDialog } from '../components/SaveWorkoutDialog';

interface WorkoutSummaryScreenProps {
  session: ActiveWorkoutSession;
  currentUser: User | null;
  onSaveSuccess: () => void;
  onBackToWorkout: () => void;
}

export const WorkoutSummaryScreen: React.FC<WorkoutSummaryScreenProps> = ({
  session,
  currentUser,
  onSaveSuccess,
  onBackToWorkout,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [achievedPRs, setAchievedPRs] = useState<NewlyAchievedPR[]>([]);

  const [insights, setInsights] = useState<WorkoutInsightsData | null>(null);

  const userId = currentUser?.id || 'guest';

  // Load workout insights on mount
  useEffect(() => {
    let isMounted = true;
    WorkoutProgressService.calculateWorkoutInsights(session, userId).then((data) => {
      if (isMounted) setInsights(data);
    });
    return () => {
      isMounted = false;
    };
  }, [session, userId]);

  // Auto calculate stats
  const stats = useMemo(() => {
    return WorkoutSaveService.calculateStats(session);
  }, [session]);

  const workoutName =
    session.categoryTitle ||
    session.exercises[0]?.regionName ||
    'Workout Session';

  const completedExercises = useMemo(() => {
    return session.exercises.filter((ex) => ex.sets.some((s) => s.completed));
  }, [session.exercises]);

  // Handle Finish Workout button click
  const handleInitiateSave = () => {
    setValidationError(null);
    const validation = WorkoutSaveService.validate(session);

    if (!validation.isValid) {
      setValidationError(validation.error || 'Please complete at least one set before saving.');
      return;
    }

    setSaveError(null);
    setIsDialogOpen(true);
  };

  // Perform save operation
  const handleConfirmSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    const userId = currentUser?.id || 'guest';

    // Step 3 / Step 10 Phase A.2: Complete workout session in Supabase
    if (session.id && userId !== 'guest') {
      const durationSec = Math.max(1, Math.floor((Date.now() - session.startTime) / 1000));
      const completeRes = await WorkoutSessionService.completeWorkoutSession(
        session.id,
        durationSec
      );

      if (!completeRes.success && completeRes.code !== 'ALREADY_COMPLETED') {
        setIsSaving(false);
        setSaveError(completeRes.error || 'Failed to complete workout session in Supabase.');
        return;
      }
    }

    const result = await WorkoutSaveService.saveWorkout(session, userId);

    setIsSaving(false);

    if (result.success) {
      localStorage.removeItem('reppulse_active_session');

      // Calculate newly achieved PRs after workout completion
      try {
        const prRes = await PersonalRecordService.calculateWorkoutPRs(
          userId,
          result.record || session
        );
        if (prRes.success && prRes.data && prRes.data.length > 0) {
          setAchievedPRs(prRes.data);
        }
      } catch (prErr) {
        console.warn('Error calculating PRs:', prErr);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        onSaveSuccess();
      }, 2000);
    } else {
      setSaveError(result.error || 'Failed to save workout. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden select-none">
      {/* HEADER */}
      <header className="min-h-14 py-2 bg-white border-b border-border-cool flex items-center justify-between px-5 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <button
            onClick={onBackToWorkout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer shrink-0 border border-border-cool"
            aria-label="Back to workout session"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-amber-400 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Trophy size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display font-bold text-sm sm:text-base text-neutral-900 tracking-tight uppercase truncate">
                Workout Summary
              </h1>
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest -mt-0.5 truncate">
                {workoutName}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 flex flex-col gap-5 pb-28">
        {/* VALIDATION ALERT IF ANY */}
        {validationError && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-2xs animate-fade-in">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Incomplete Workout
              </h4>
              <p className="text-xs text-amber-800 font-medium mt-0.5 leading-relaxed">
                {validationError}
              </p>
              <button
                onClick={onBackToWorkout}
                className="mt-2 text-xs font-bold text-amber-900 underline hover:text-black cursor-pointer"
              >
                Return to logging sets →
              </button>
            </div>
          </div>
        )}

        {/* ACHIEVED PR CELEBRATIONS */}
        {achievedPRs.map((pr, idx) => (
          <PersonalRecordCard
            key={idx}
            exerciseName={pr.exerciseName}
            recordType={pr.recordType}
            value={pr.value}
            onDismiss={() => {
              setAchievedPRs((prev) => prev.filter((_, i) => i !== idx));
            }}
          />
        ))}

        {/* BANNER CARD - INTRINSIC HEIGHT */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-neutral-900 text-white rounded-3xl p-5 sm:p-6 flex flex-col items-center text-center relative shadow-xl w-full h-auto min-h-0 shrink-0"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 mb-2.5 sm:mb-3 border border-white/10 shrink-0">
            <Trophy size={26} />
          </div>

          <h2 className="font-display font-black text-xl sm:text-2xl tracking-tight uppercase">
            Workout Summary
          </h2>
          <p className="text-xs text-neutral-400 font-normal mt-1 max-w-[280px] leading-relaxed">
            Review your logged session before saving to history.
          </p>
        </motion.div>

        {/* WORKOUT INSIGHTS CARD */}
        {insights && <WorkoutInsightCard insights={insights} />}

        {/* METRICS STATS GRID */}
        <div className="grid grid-cols-2 gap-3">
          <WorkoutStatsCard
            icon={<Clock size={16} />}
            label="Duration"
            value={stats.formattedDuration}
          />

          <WorkoutStatsCard
            icon={<Dumbbell size={16} />}
            label="Exercises"
            value={stats.totalExercises}
          />

          <WorkoutStatsCard
            icon={<Layers size={16} />}
            label="Total Sets"
            value={stats.totalSets}
          />

          <WorkoutStatsCard
            icon={<Repeat size={16} />}
            label="Total Reps"
            value={stats.totalReps}
          />

          <div className="col-span-2">
            <WorkoutStatsCard
              icon={<Scale size={16} />}
              label="Total Weight Lifted"
              value={stats.totalWeightLifted}
              unit="kg"
              subValue="Combined weight across all completed reps"
            />
          </div>
        </div>

        {/* EXERCISES BREAKDOWN LIST */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="font-display font-bold text-xs text-neutral-900 uppercase tracking-wide">
              Completed Exercises ({completedExercises.length})
            </h3>
          </div>

          {completedExercises.length === 0 ? (
            <div className="bg-neutral-50 border border-border-cool rounded-2xl p-6 text-center">
              <p className="text-xs text-neutral-500 font-medium italic">
                No exercises completed yet. Go back and check off logged sets.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {completedExercises.map((ex) => (
                <WorkoutSummaryCard key={ex.id} exercise={ex} />
              ))}
            </div>
          )}
        </div>

        {/* SAVE WORKOUT CTA BUTTON */}
        <div className="mt-2 flex flex-col gap-2">
          <button
            onClick={handleInitiateSave}
            className="w-full h-12 rounded-2xl bg-neutral-900 hover:bg-black text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98 transition-all"
          >
            <span>Finish & Save Workout</span>
            <Check size={18} />
          </button>

          <button
            onClick={onBackToWorkout}
            className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            Back to Session
          </button>
        </div>
      </div>

      {/* SAVE CONFIRMATION DIALOG */}
      <SaveWorkoutDialog
        isOpen={isDialogOpen}
        workoutName={workoutName}
        stats={stats}
        isSaving={isSaving}
        error={saveError}
        isSuccess={saveSuccess}
        onCancel={() => setIsDialogOpen(false)}
        onConfirmSave={handleConfirmSave}
      />
    </div>
  );
};
