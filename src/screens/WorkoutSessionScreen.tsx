import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Dumbbell, Plus, Check, Play, Trophy, History, Info, Sparkles, BarChart2, Trash2, AlertTriangle } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { ActiveWorkoutSession, SessionExercise, WorkoutSet } from '../types/workoutSession';
import { WorkoutSetCard } from '../components/WorkoutSetCard';
import { PreviousWorkoutCard } from '../components/PreviousWorkoutCard';
import { PersonalRecordCard } from '../components/PersonalRecordCard';
import { PersonalRecordDisplayCard } from '../components/PersonalRecordDisplayCard';
import { ExerciseStatisticsCard } from '../components/ExerciseStatisticsCard';
import {
  WorkoutProgressService,
  ExerciseStats,
  SetComparisonResult,
} from '../services/workoutProgressService';
import { PreviousWorkoutService, PreviousExercisePerformance } from '../services/previousWorkoutService';
import { WorkoutSetService } from '../services/workoutSetService';
import { WorkoutExerciseService } from '../services/workoutExerciseService';
import { generateUUID } from '../lib/uuid';

interface WorkoutSessionScreenProps {
  session: ActiveWorkoutSession;
  currentUser?: User | null;
  onUpdateSession: (updatedSession: ActiveWorkoutSession) => void;
  onAddExercise: () => void;
  onFinishWorkout: () => void;
  onDiscardWorkout?: () => void;
  onBack: () => void;
  isDiscarding?: boolean;
}

export const WorkoutSessionScreen: React.FC<WorkoutSessionScreenProps> = ({
  session,
  currentUser,
  onUpdateSession,
  onAddExercise,
  onFinishWorkout,
  onDiscardWorkout,
  onBack,
  isDiscarding = false,
}) => {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Determine active exercise index
  const activeExerciseIndex = session.exercises.findIndex(
    (ex) => ex.id === session.activeExerciseId
  );
  
  const activeExercise: SessionExercise | undefined =
    session.exercises[activeExerciseIndex !== -1 ? activeExerciseIndex : 0];

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const userId = currentUser?.id || 'guest';

  // Smart Workout Tracker State
  const [prevPerformance, setPrevPerformance] = useState<PreviousExercisePerformance | null>(null);
  const [isLoadingPrev, setIsLoadingPrev] = useState(false);
  const [prevErrorMsg, setPrevErrorMsg] = useState<string | null>(null);
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [prAlert, setPrAlert] = useState<{
    exerciseName: string;
    recordType: 'Highest Weight' | 'Highest Reps' | 'Highest Total Volume' | 'Personal Record';
    value: string;
  } | null>(null);

  // Accordion state for logged sets (only one expanded at a time)
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);

  // Auto-expand first incomplete set when active exercise changes
  useEffect(() => {
    if (activeExercise && activeExercise.sets.length > 0) {
      if (!expandedSetId || !activeExercise.sets.some((s) => s.id === expandedSetId)) {
        const firstIncomplete = activeExercise.sets.find((s) => !s.completed);
        setExpandedSetId(firstIncomplete ? firstIncomplete.id : activeExercise.sets[0].id);
      }
    } else {
      setExpandedSetId(null);
    }
  }, [activeExercise?.id]);

  // Load Previous Exercise Performance & Lifetime Stats (Steps 1, 9, 10, 11)
  const loadData = React.useCallback(async () => {
    if (!activeExercise) {
      setPrevPerformance(null);
      setExerciseStats(null);
      setPrevErrorMsg(null);
      return;
    }

    setIsLoadingPrev(true);
    setPrevErrorMsg(null);

    try {
      const perfRes = await PreviousWorkoutService.getPreviousExercise(userId, activeExercise.name);
      if (perfRes.success) {
        setPrevPerformance(perfRes.data);
      } else {
        setPrevErrorMsg(perfRes.error || 'Unable to load previous workout.');
      }

      const stats = await WorkoutProgressService.getExerciseStatistics(
        activeExercise.name,
        userId
      );
      setExerciseStats(stats);
    } catch (err: any) {
      setPrevErrorMsg('Unable to load previous workout.');
    } finally {
      setIsLoadingPrev(false);
    }
  }, [activeExercise?.name, userId]);

  useEffect(() => {
    let isMounted = true;
    if (activeExercise) {
      loadData();
    }
    return () => {
      isMounted = false;
    };
  }, [activeExercise?.name, loadData]);

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

  // Sync error state
  const [syncError, setSyncError] = useState<string | null>(null);

  // Helper to update sets for active exercise
  const handleUpdateSet = async (setId: string, weight: string, reps: string, completed: boolean) => {
    if (!activeExercise || !session.id) return;

    // Step 9: Validation - Sanitize negative values
    const numWeight = Math.max(0, parseFloat(weight) || 0);
    const numReps = Math.max(0, parseInt(reps, 10) || 0);

    // Check PR when completing set
    if (completed && numWeight > 0 && numReps > 0) {
      const vol = numWeight * numReps;
      const prCheck = await WorkoutProgressService.checkPersonalRecord(
        activeExercise.name,
        numWeight,
        numReps,
        vol,
        userId
      );

      if (prCheck.isNewWeightPR) {
        setPrAlert({
          exerciseName: activeExercise.name,
          recordType: 'Highest Weight',
          value: `${numWeight} kg`,
        });
      } else if (prCheck.isNewRepsPR) {
        setPrAlert({
          exerciseName: activeExercise.name,
          recordType: 'Highest Reps',
          value: `${numReps} reps`,
        });
      }
    }

    const updatedSets = activeExercise.sets.map((s) =>
      s.id === setId ? { ...s, weight, reps, completed } : s
    );

    // Check if exercise should be marked completed
    const isExerciseCompleted = updatedSets.length > 0 && updatedSets.some((s) => s.completed);

    const updatedExercises = session.exercises.map((ex) =>
      ex.id === activeExercise.id
        ? { ...ex, sets: updatedSets, completed: isExerciseCompleted }
        : ex
    );

    // Step 8: Update local UI state immediately to keep UI responsive
    onUpdateSession({
      ...session,
      exercises: updatedExercises,
    });

    // Auto-advance expanded accordion to next incomplete set when completed, or collapse if no incomplete sets remain
    if (completed) {
      const nextIncomplete = updatedSets.find((s) => s.id !== setId && !s.completed);
      if (nextIncomplete) {
        setExpandedSetId(nextIncomplete.id);
      } else {
        setExpandedSetId(null);
      }
    }

    // Step 3: Edit set - Persist update in Supabase
    // Pass exercise_id and set_number context so updateSet creates the row if missing
    const targetSet = activeExercise.sets.find((s) => s.id === setId);
    const updateRes = await WorkoutSetService.updateSet(setId, {
      exercise_id: activeExercise.id,
      set_number: targetSet?.setNumber || 1,
      weight: numWeight,
      reps: numReps,
      completed,
    });

    // Step 10 & 11: Error handling & offline safety
    if (!updateRes.success) {
      const codeDetail = updateRes.code ? `[Code: ${updateRes.code}] ` : '';
      setSyncError(`Failed to update set: ${codeDetail}${updateRes.error}`);
    } else {
      setSyncError(null);
    }
  };

  // Helper to add a new set
  const handleAddSet = async () => {
    if (!activeExercise || !session.id) return;

    const nextSetNum = activeExercise.sets.length + 1;
    const lastSet = activeExercise.sets[activeExercise.sets.length - 1];
    const tempSetId = generateUUID();

    const newSet: WorkoutSet = {
      id: tempSetId,
      setNumber: nextSetNum,
      weight: lastSet ? lastSet.weight : '',
      reps: lastSet ? lastSet.reps : '',
      completed: false,
    };

    const updatedSets = [...activeExercise.sets, newSet];
    const updatedExercises = session.exercises.map((ex) =>
      ex.id === activeExercise.id ? { ...ex, sets: updatedSets } : ex
    );

    // Update local UI state immediately for responsive feel
    onUpdateSession({
      ...session,
      exercises: updatedExercises,
    });

    // Expand newly added set in accordion
    setExpandedSetId(tempSetId);

    // Create workout_sets record in Supabase
    const numWeight = Math.max(0, parseFloat(newSet.weight) || 0);
    const numReps = Math.max(0, parseInt(newSet.reps, 10) || 0);

    const createRes = await WorkoutSetService.createSet({
      id: tempSetId,
      exercise_id: activeExercise.id,
      set_number: nextSetNum,
      weight: numWeight,
      reps: numReps,
      completed: false,
    });

    if (!createRes.success) {
      setSyncError("Couldn't save new set to cloud. Local data saved. Tap to retry.");
    } else {
      setSyncError(null);

      // Receive real database ID from insertion result and replace temporary UUID in local state
      const realDatabaseId = createRes.data?.id;
      if (realDatabaseId && realDatabaseId !== tempSetId) {
        setExpandedSetId((prev) => (prev === tempSetId ? realDatabaseId : prev));

        const replacedSets = updatedSets.map((s) =>
          s.id === tempSetId ? { ...s, id: realDatabaseId } : s
        );
        const replacedExercises = session.exercises.map((ex) =>
          ex.id === activeExercise.id ? { ...ex, sets: replacedSets } : ex
        );

        onUpdateSession({
          ...session,
          exercises: replacedExercises,
        });
      }
    }
  };

  // Helper to delete a set
  const handleDeleteSet = async (setId: string) => {
    if (!activeExercise) return;

    const filteredSets = activeExercise.sets.filter((s) => s.id !== setId);
    const renumberedSets = filteredSets.map((s, idx) => ({ ...s, setNumber: idx + 1 }));

    const isExerciseCompleted = renumberedSets.length > 0 && renumberedSets.some((s) => s.completed);

    const updatedExercises = session.exercises.map((ex) =>
      ex.id === activeExercise.id
        ? { ...ex, sets: renumberedSets, completed: isExerciseCompleted }
        : ex
    );

    // Step 8: Update local UI immediately
    onUpdateSession({
      ...session,
      exercises: updatedExercises,
    });

    // Step 4: Delete set from Supabase
    const deleteRes = await WorkoutSetService.deleteSet(setId);
    if (!deleteRes.success) {
      setSyncError("Couldn't delete set from cloud. Tap to retry.");
    } else {
      setSyncError(null);
      // Renumber remaining sets in Supabase
      renumberedSets.forEach((s) => {
        WorkoutSetService.updateSet(s.id, {
          exercise_id: activeExercise.id,
          set_number: s.setNumber,
        });
      });
    }
  };

  // Switch active exercise tab
  const handleSelectExercise = (exerciseId: string) => {
    onUpdateSession({
      ...session,
      activeExerciseId: exerciseId,
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden select-none">
      {/* HEADER */}
      <header className="h-14 bg-white border-b border-border-cool flex items-center justify-between px-5 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer border border-border-cool"
            aria-label="Back"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase flex items-center gap-1.5">
              <span>Workout Session</span>
            </h1>
            <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest -mt-0.5">
              Timer: {formatTime(elapsedSeconds)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDiscardWorkout && (
            <button
              type="button"
              onClick={() => setShowDiscardConfirm(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 border border-red-200 active:scale-95 transition-all cursor-pointer"
              aria-label="Discard workout"
              title="Discard Workout"
            >
              <Trash2 size={16} />
            </button>
          )}

          <button
            onClick={onFinishWorkout}
            className="px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
          >
            <Check size={14} />
            <span>Finish</span>
          </button>
        </div>
      </header>

      {/* SYNC ERROR BANNER */}
      {syncError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-amber-900 text-xs shrink-0 z-30 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <span>{syncError}</span>
          </div>
          <button
            onClick={() => setSyncError(null)}
            className="font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer ml-2 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 flex flex-col gap-6 pb-28">
        
        {/* CURRENT WORKOUT EXERCISES BAR (SWITCHER) */}
        {session.exercises.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                Session Exercises ({session.exercises.length})
              </span>
              <button
                onClick={onAddExercise}
                className="text-[11px] font-bold text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Exercise</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {session.exercises.map((ex) => {
                const isActive = ex.id === activeExercise?.id;
                return (
                  <button
                    key={ex.id}
                    onClick={() => handleSelectExercise(ex.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                        : ex.completed
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-neutral-50 border-border-cool text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{ex.completed ? '✓' : '○'}</span>
                    <span className="truncate max-w-[130px]">{ex.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIVE EXERCISE VIEW */}
        {activeExercise ? (
          <div className="flex flex-col gap-5">
            {/* EXERCISE TITLE & REGION */}
            <div className="bg-neutral-50 border border-border-cool rounded-3xl p-5 flex flex-col items-start relative overflow-hidden">
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 bg-white border border-border-cool px-2.5 py-0.5 rounded-full shadow-2xs">
                  {activeExercise.regionName}
                </span>

                <div className="flex items-center gap-2">
                  {exerciseStats && (
                    <button
                      onClick={() => setShowStats(!showStats)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                        showStats
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-700 border-border-cool hover:bg-neutral-100'
                      }`}
                    >
                      <BarChart2 size={12} />
                      <span>{showStats ? 'Hide Stats' : 'Lifetime Stats'}</span>
                    </button>
                  )}

                  {activeExercise.completed && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={12} />
                      <span>Completed</span>
                    </span>
                  )}
                </div>
              </div>

              <h2 className="font-display font-black text-2xl text-neutral-900 tracking-tight leading-tight">
                {activeExercise.name}
              </h2>

              {activeExercise.equipment && (
                <p className="text-xs text-neutral-500 font-medium mt-1">
                  Equipment: <span className="text-neutral-800">{activeExercise.equipment}</span>
                </p>
              )}
            </div>

            {/* PERSONAL RECORD ALERT IF BROKEN */}
            <AnimatePresence>
              {prAlert && (
                <PersonalRecordCard
                  exerciseName={prAlert.exerciseName}
                  recordType={prAlert.recordType}
                  value={prAlert.value}
                  onDismiss={() => setPrAlert(null)}
                />
              )}
            </AnimatePresence>

            {/* LIFETIME EXERCISE STATISTICS CARD */}
            {showStats && exerciseStats && (
              <ExerciseStatisticsCard
                stats={exerciseStats}
                onClose={() => setShowStats(false)}
              />
            )}

            {/* PERSONAL RECORD DISPLAY CARD */}
            <PersonalRecordDisplayCard
              userId={userId}
              exerciseName={activeExercise.name}
            />

            {/* PREVIOUS WORKOUT CARD */}
            <PreviousWorkoutCard
              performance={prevPerformance}
              isLoading={isLoadingPrev}
              errorMsg={prevErrorMsg}
              onRetry={loadData}
            />

            {/* SETS SECTION */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-display font-bold text-xs text-neutral-900 uppercase tracking-wide">
                  Logged Sets
                </h3>
                <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
                  Target: 8-12 Reps
                </span>
              </div>

              {/* SET CARDS LIST */}
              <div className="flex flex-col gap-2.5">
                <AnimatePresence>
                  {activeExercise.sets.map((setItem, idx) => {
                    const prevSet = prevPerformance?.completedSets[idx];
                    const numW = parseFloat(setItem.weight) || 0;
                    const numR = parseInt(setItem.reps, 10) || 0;
                    const comparison = PreviousWorkoutService.compareWorkoutPerformance(
                      numW,
                      numR,
                      prevSet
                    );

                    return (
                      <WorkoutSetCard
                        key={setItem.id}
                        set={setItem}
                        index={idx}
                        isExpanded={expandedSetId === setItem.id}
                        onToggleExpand={() => {
                          setExpandedSetId((prev) => (prev === setItem.id ? null : setItem.id));
                        }}
                        prevSet={prevSet}
                        comparison={comparison}
                        onUpdateSet={handleUpdateSet}
                        onDeleteSet={handleDeleteSet}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* ADD SET BUTTON */}
              <button
                type="button"
                onClick={handleAddSet}
                className="w-full py-3 rounded-2xl border border-dashed border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 text-neutral-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 mt-1"
              >
                <Plus size={16} />
                <span>Add Set</span>
              </button>
            </div>
          </div>
        ) : (
          /* NO EXERCISES ADDED YET STATE */
          <div className="bg-neutral-50 border border-border-cool rounded-3xl p-8 flex flex-col items-center justify-center text-center my-6">
            <div className="w-12 h-12 rounded-2xl bg-white border border-border-cool flex items-center justify-center text-neutral-400 mb-3 shadow-2xs">
              <Dumbbell size={24} />
            </div>
            <h3 className="font-display font-bold text-base text-neutral-900 uppercase tracking-tight">
              No Exercises in Workout
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-[240px] leading-relaxed">
              Add movements to your workout session to begin logging sets.
            </p>
            <button
              onClick={onAddExercise}
              className="mt-4 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xs cursor-pointer active:scale-98 transition-all"
            >
              <Plus size={16} />
              <span>Add Exercise</span>
            </button>
          </div>
        )}

        {/* WORKOUT SESSION CONTROLLER ACTIONS */}
        <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide px-0.5">
            Current Workout Controls
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onAddExercise}
              className="py-3 px-4 rounded-2xl border border-border-cool bg-white hover:bg-neutral-50 font-bold text-xs uppercase tracking-wider text-neutral-900 flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-98 transition-all"
            >
              <Plus size={16} />
              <span>Add Exercise</span>
            </button>

            <button
              onClick={onFinishWorkout}
              className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-98 transition-all"
            >
              <Trophy size={16} />
              <span>Finish Workout</span>
            </button>
          </div>

          {onDiscardWorkout && (
            <button
              onClick={() => setShowDiscardConfirm(true)}
              className="py-2.5 px-4 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 font-bold text-xs uppercase tracking-wider text-red-700 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all mt-1"
            >
              <Trash2 size={15} />
              <span>Discard Workout</span>
            </button>
          )}
        </div>
      </div>

      {/* DISCARD WORKOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDiscardConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-neutral-200 flex flex-col gap-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-neutral-900 tracking-tight">
                  Discard this workout?
                </h3>
                <p className="text-xs text-neutral-500 font-normal mt-1 leading-relaxed">
                  Are you sure you want to discard this workout session? This active session will be permanently deleted from Supabase.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  disabled={isDiscarding}
                  className="flex-1 py-3 rounded-2xl border border-neutral-200 hover:bg-neutral-50 font-bold text-xs uppercase tracking-wider text-neutral-700 cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDiscardWorkout) onDiscardWorkout();
                  }}
                  disabled={isDiscarding}
                  className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-wider text-white shadow-2xs cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {isDiscarding ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Discard</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
