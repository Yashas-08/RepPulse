import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { ScreenType } from '../types';
import { WorkoutCategory } from '../constants/workoutCategories';
import { MuscleRegion, Exercise, EXERCISE_LIBRARY } from '../constants/exerciseLibrary';
import { ActiveWorkoutSession, SessionExercise, WorkoutSet } from '../types/workoutSession';
import { WorkoutSelectionScreen } from './WorkoutSelectionScreen';
import { WorkoutRegionScreen } from './WorkoutRegionScreen';
import { ExerciseListScreen } from './ExerciseListScreen';
import { WorkoutPlaceholderScreen } from './WorkoutPlaceholderScreen';
import { WorkoutSessionScreen } from './WorkoutSessionScreen';
import { WorkoutSummaryScreen } from './WorkoutSummaryScreen';
import { WorkoutSessionBar } from '../components/WorkoutSessionBar';
import { useWorkoutScreen } from '../hooks/useWorkoutScreen';
import { WorkoutSessionService } from '../services/workoutSessionService';
import { WorkoutExerciseService } from '../services/workoutExerciseService';
import { WorkoutSetService } from '../services/workoutSetService';
import { WorkoutPersistenceFacade } from '../services/workoutPersistenceFacade';
import { generateUUID } from '../lib/uuid';

interface WorkoutScreenProps {
  currentUser: User | null;
  onNavigate?: (screen: ScreenType) => void;
}

export const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ currentUser, onNavigate }) => {
  const {
    selectedCategory,
    setSelectedCategory,
    selectedRegion,
    setSelectedRegion,
    viewMode,
    setViewMode,
    session,
    setSession,
    isLoadingSession,
    isDiscardingSession,
    sessionError,
    setSessionError,
    customExercises,
    checkActiveSession,
    handleSelectCategory,
    handleSelectRegion,
    handleCreateCustomExercise: handleAddCustomExercise,
    handleToggleExerciseInWorkout: handleSelectExercise,
    handleUpdateSession,
    handleOpenActiveSession,
    handleFinishWorkout,
    handleDiscardSession: handleDiscardWorkout,
    handleCloseSummary,
  } = useWorkoutScreen({ currentUser });

  const handleSaveSuccess = () => {
    handleCloseSummary();
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  // Render view mode: Summary
  if (viewMode === 'summary' && session) {
    return (
      <WorkoutSummaryScreen
        session={session}
        currentUser={currentUser}
        onSaveSuccess={handleSaveSuccess}
        onBackToWorkout={() => setViewMode('session')}
      />
    );
  }

  // Render view mode: Active Workout Session
  if (viewMode === 'session' && session) {
    return (
      <WorkoutSessionScreen
        session={session}
        currentUser={currentUser}
        onUpdateSession={setSession}
        onAddExercise={() => {
          if (selectedCategory && selectedRegion) {
            setViewMode('exercise_list');
          } else if (selectedCategory) {
            setViewMode('region');
          } else {
            setViewMode('selection');
          }
        }}
        onFinishWorkout={() => setViewMode('summary')}
        onDiscardWorkout={handleDiscardWorkout}
        isDiscarding={isDiscardingSession}
        onBack={() => {
          if (selectedRegion && selectedCategory) {
            setViewMode('exercise_list');
          } else {
            setViewMode('selection');
          }
        }}
      />
    );
  }

  // Render Custom Workout Placeholder
  if (viewMode === 'custom_placeholder' && selectedCategory) {
    return (
      <WorkoutPlaceholderScreen
        category={selectedCategory}
        onBack={() => {
          setSelectedCategory(null);
          setSelectedRegion(null);
          setViewMode('selection');
        }}
      />
    );
  }

  // Render Exercise List View
  if (viewMode === 'exercise_list' && selectedCategory && selectedRegion) {
    const regionCustomExs = customExercises[selectedRegion.id] || [];
    return (
      <div className="flex-1 flex flex-col h-full relative">
        <ExerciseListScreen
          category={selectedCategory}
          region={selectedRegion}
          customExercises={regionCustomExs}
          activeSession={session}
          onSelectExercise={handleSelectExercise}
          onAddCustomExercise={(newEx) => handleAddCustomExercise(selectedRegion.id, newEx)}
          onBack={() => {
            const regions = EXERCISE_LIBRARY[selectedCategory.id] || [];
            if (regions.length === 1) {
              setSelectedCategory(null);
              setSelectedRegion(null);
              setViewMode('selection');
            } else {
              setSelectedRegion(null);
              setViewMode('region');
            }
          }}
        />

        {session && (
          <WorkoutSessionBar
            session={session}
            onOpenSession={() => setViewMode('session')}
            onFinishWorkout={() => setViewMode('summary')}
          />
        )}
      </div>
    );
  }

  // Render Muscle Region View
  if (viewMode === 'region' && selectedCategory) {
    return (
      <div className="flex-1 flex flex-col h-full relative">
        <WorkoutRegionScreen
          category={selectedCategory}
          onSelectRegion={(region) => {
            setSelectedRegion(region);
            setViewMode('exercise_list');
          }}
          onBack={() => {
            setSelectedCategory(null);
            setSelectedRegion(null);
            setViewMode('selection');
          }}
        />

        {session && (
          <WorkoutSessionBar
            session={session}
            onOpenSession={() => setViewMode('session')}
            onFinishWorkout={() => setViewMode('summary')}
          />
        )}
      </div>
    );
  }

  // Default: Workout Category Selection View
  return (
    <div className="flex-1 flex flex-col h-full relative">
      {sessionError && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-900 text-xs shadow-2xs z-30">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{sessionError}</span>
          </div>
          <button
            onClick={() => setSessionError(null)}
            className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoadingSession && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-50 flex items-center justify-center flex-col gap-2">
          <Loader2 size={28} className="animate-spin text-neutral-900" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Connecting Session...
          </span>
        </div>
      )}

      <WorkoutSelectionScreen
        currentUser={currentUser}
        onSelectCategory={(category) => {
          setSelectedCategory(category);
          if (category.id === 'custom') {
            setViewMode('custom_placeholder');
            return;
          }

          const regions = EXERCISE_LIBRARY[category.id] || [];
          if (regions.length === 1) {
            setSelectedRegion(regions[0]);
            setViewMode('exercise_list');
          } else {
            setViewMode('region');
          }
        }}
      />

      {session && (
        <WorkoutSessionBar
          session={session}
          onOpenSession={() => setViewMode('session')}
          onFinishWorkout={() => setViewMode('summary')}
        />
      )}
    </div>
  );
};
