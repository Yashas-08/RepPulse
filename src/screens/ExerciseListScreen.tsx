import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Dumbbell, SearchX, Plus } from 'lucide-react';
import { WorkoutCategory } from '../constants/workoutCategories';
import { MuscleRegion, Exercise } from '../constants/exerciseLibrary';
import { ExerciseCard } from '../components/ExerciseCard';
import { SearchBar } from '../components/SearchBar';
import { AddCustomExerciseModal } from '../components/AddCustomExerciseModal';
import { ActiveWorkoutSession } from '../types/workoutSession';

interface ExerciseListScreenProps {
  category: WorkoutCategory;
  region: MuscleRegion;
  customExercises?: Exercise[];
  activeSession?: ActiveWorkoutSession | null;
  onSelectExercise: (exercise: Exercise) => void;
  onAddCustomExercise: (exercise: Exercise) => void;
  onBack: () => void;
}

export const ExerciseListScreen: React.FC<ExerciseListScreenProps> = ({
  category,
  region,
  customExercises = [],
  activeSession,
  onSelectExercise,
  onAddCustomExercise,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Combine standard library exercises with custom exercises added by user
  const allExercises = useMemo(() => {
    return [...region.exercises, ...customExercises];
  }, [region.exercises, customExercises]);

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return allExercises;
    }
    const q = searchQuery.toLowerCase().trim();
    return allExercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        (ex.equipment && ex.equipment.toLowerCase().includes(q))
    );
  }, [allExercises, searchQuery]);

  // Helper map for session completion check
  const sessionStatusMap = useMemo(() => {
    if (!activeSession) return {};
    const map: Record<string, { completed: boolean; inSession: boolean }> = {};
    activeSession.exercises.forEach((ex) => {
      map[ex.exerciseId] = {
        completed: ex.completed,
        inSession: true,
      };
    });
    return map;
  }, [activeSession]);

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden select-none">
      {/* HEADER */}
      <header className="h-14 bg-white border-b border-border-cool flex items-center justify-between px-5 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer shrink-0 border border-border-cool"
            aria-label="Back"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase truncate">
              {region.name}
            </h1>
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest -mt-0.5 truncate">
              {category.title} Exercises
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 text-white shrink-0">
          <Dumbbell size={12} />
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {filteredExercises.length} {filteredExercises.length === 1 ? 'Movement' : 'Movements'}
          </span>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 flex flex-col gap-4 pb-28">
        {/* SEARCH BAR */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${region.name} exercises...`}
        />

        {/* REGION SUBTITLE INFO */}
        <div className="px-1">
          <p className="text-xs text-neutral-500 font-normal leading-relaxed">
            {region.subtitle}
          </p>
        </div>

        {/* EXERCISES LIST */}
        <div className="flex flex-col gap-2.5 mt-1">
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise, index) => {
              const status = sessionStatusMap[exercise.id];
              return (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  isCompleted={status?.completed}
                  isInSession={status?.inSession}
                  onClick={onSelectExercise}
                />
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-neutral-50 border border-border-cool rounded-2xl p-6 flex flex-col items-center justify-center text-center my-4"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-border-cool flex items-center justify-center text-neutral-400 mb-3 shadow-2xs">
                <SearchX size={20} />
              </div>
              <h3 className="font-display font-bold text-sm text-neutral-900 uppercase tracking-wide">
                No Exercises Found
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-[220px]">
                No movements match "{searchQuery}".
              </p>
            </motion.div>
          )}
        </div>

        {/* ADD CUSTOM EXERCISE BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="w-full py-3.5 rounded-2xl border border-dashed border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 text-neutral-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            <Plus size={16} />
            <span>Add Custom Exercise</span>
          </button>
        </div>
      </div>

      {/* CUSTOM EXERCISE MODAL */}
      <AddCustomExerciseModal
        isOpen={isAddModalOpen}
        regionName={region.name}
        onClose={() => setIsAddModalOpen(false)}
        onAddExercise={onAddCustomExercise}
      />
    </div>
  );
};

