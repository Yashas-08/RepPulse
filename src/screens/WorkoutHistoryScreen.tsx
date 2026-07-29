import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  History,
  Dumbbell,
  Clock,
  Layers,
  Repeat,
  Scale,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Trash2,
  X,
} from 'lucide-react';
import { ScreenType } from '../types';
import { SavedWorkoutRecord } from '../services/workoutSaveService';
import { WorkoutHistoryService } from '../services/workoutHistoryService';
import { DataManagementService } from '../services/dataManagementService';
import { useWorkoutHistoryScreen } from '../hooks/useWorkoutHistoryScreen';
import { WorkoutHistoryList } from '../components/WorkoutHistoryList';
import { WorkoutDetailHeader } from '../components/WorkoutDetailHeader';
import { WorkoutStatsCard } from '../components/WorkoutStatsCard';
import { ExerciseHistoryCard } from '../components/ExerciseHistoryCard';

interface WorkoutHistoryScreenProps {
  currentUser: User | null;
  onNavigate: (screen: ScreenType) => void;
}

export const WorkoutHistoryScreen: React.FC<WorkoutHistoryScreenProps> = ({
  currentUser,
  onNavigate,
}) => {
  const {
    historyRecords,
    isLoading,
    isDetailsLoading,
    errorMsg,
    selectedRecord,
    setSelectedRecord,
    toast,
    showDeleteHistoryConfirm,
    setShowDeleteHistoryConfirm,
    isDeletingHistory,
    userId,
    showToast,
    loadHistory,
    handleSelectRecord,
    handleClearHistory,
  } = useWorkoutHistoryScreen({ currentUser });

  // Handle deleting a single record
  const handleDeleteSingleRecord = async (recordId: string) => {
    const res = await WorkoutHistoryService.deleteWorkoutRecord(recordId, userId);
    if (res.success) {
      showToast('Workout deleted.', 'success');
      loadHistory();
    } else {
      showToast(res.error || 'Failed to delete workout.', 'error');
    }
  };

  const handleDeleteAllHistory = handleClearHistory;

  // If a record is selected, show Workout Details Screen
  if (selectedRecord) {
    return (
      <div className="flex-1 flex flex-col bg-white h-full relative overflow-y-auto no-scrollbar pb-20 select-none">
        <WorkoutDetailHeader
          record={selectedRecord}
          onBack={() => setSelectedRecord(null)}
        />

        {isDetailsLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-2">
            <Loader2 size={24} className="animate-spin text-neutral-900" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Loading Workout Details...
            </span>
          </div>
        ) : (
          <div className="px-5 py-4 flex flex-col gap-6">
            {/* WORKOUT STATS GRID */}
            <div className="flex flex-col gap-2">
              <h3 className="font-display font-bold text-xs text-neutral-900 uppercase tracking-wide px-0.5">
                Workout Metrics
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <WorkoutStatsCard
                  icon={<Dumbbell size={16} />}
                  label="Exercises"
                  value={selectedRecord.total_exercises || (selectedRecord.exercises_data?.length || 0)}
                />

                <WorkoutStatsCard
                  icon={<Layers size={16} />}
                  label="Total Sets"
                  value={selectedRecord.total_sets || 0}
                />

                <WorkoutStatsCard
                  icon={<Repeat size={16} />}
                  label="Total Reps"
                  value={selectedRecord.total_reps || 0}
                />

                <WorkoutStatsCard
                  icon={<Scale size={16} />}
                  label="Total Weight"
                  value={selectedRecord.total_weight_lifted || 0}
                  unit="kg"
                />
              </div>
            </div>

            {/* EXERCISES BREAKDOWN */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-0.5">
                <h3 className="font-display font-bold text-xs text-neutral-900 uppercase tracking-wide">
                  Logged Exercises ({(selectedRecord.exercises_data || []).length})
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                {(selectedRecord.exercises_data || []).map((exercise, idx) => (
                  <ExerciseHistoryCard key={exercise.id || idx} exercise={exercise} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Workout History List Screen
  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-y-auto no-scrollbar pb-24 select-none">
      {/* HEADER */}
      <header className="h-14 bg-white border-b border-border-cool flex items-center justify-between px-5 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-700 bg-neutral-50 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer shrink-0 border border-border-cool"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold shadow-2xs">
              <History size={16} />
            </div>
            <div>
              <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase">
                Workout History
              </h1>
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest -mt-0.5">
                Past Sessions & Logs
              </p>
            </div>
          </div>
        </div>

        {historyRecords.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDeleteHistoryConfirm(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-rose-600 bg-neutral-50 hover:bg-rose-50 border border-border-cool hover:border-rose-200 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Delete All Workout History"
            aria-label="Delete All Workout History"
          >
            <Trash2 size={16} />
          </button>
        )}
      </header>

      {/* CONTENT */}
      <div className="px-5 py-5 flex flex-col gap-4">
        {errorMsg && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-amber-900 text-xs gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={loadHistory}
              className="flex items-center gap-1 font-bold bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-lg text-amber-950 transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-neutral-400 gap-2">
            <Loader2 size={24} className="animate-spin text-neutral-900" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Loading Workout History...
            </span>
          </div>
        ) : (
          <WorkoutHistoryList
            records={historyRecords}
            onSelectRecord={handleSelectRecord}
            onStartNewWorkout={() => onNavigate('workout')}
            onDeleteRecord={handleDeleteSingleRecord}
          />
        )}
      </div>

      {/* DELETE ALL HISTORY CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteHistoryConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-3xl border border-border-cool p-6 w-full max-w-xs shadow-2xl relative overflow-hidden flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>

                {!isDeletingHistory && (
                  <button
                    onClick={() => setShowDeleteHistoryConfirm(false)}
                    className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-neutral-900 tracking-tight">
                  Delete All History?
                </h3>
                <p className="text-xs font-normal text-neutral-500 leading-relaxed mt-1">
                  This will permanently delete all completed workout logs. This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  disabled={isDeletingHistory}
                  onClick={() => setShowDeleteHistoryConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border-cool bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isDeletingHistory}
                  onClick={handleDeleteAllHistory}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingHistory ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete All</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full border shadow-lg flex items-center gap-2 ${
              toast.type === 'error'
                ? 'bg-rose-900 border-rose-800 text-white'
                : 'bg-neutral-900 border-neutral-800 text-white'
            }`}
          >
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-xs font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

