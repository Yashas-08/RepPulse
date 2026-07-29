import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Utensils,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  RotateCcw,
  Flame,
  Zap,
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { NutritionLog, MealType, NutritionSummary } from '../types/nutrition';
import { NutritionService } from '../services/nutritionService';
import { useNutritionScreen } from '../hooks/useNutritionScreen';
import { Button, Input } from '../components/UI';

interface NutritionScreenProps {
  currentUser: User | null;
}

export const NutritionScreen: React.FC<NutritionScreenProps> = ({ currentUser }) => {
  const {
    userId,
    meals,
    summary,
    loading,
    refreshing,
    error,
    toast,
    searchQuery,
    setSearchQuery,
    selectedMealType,
    setSelectedMealType,
    isSheetOpen,
    setIsSheetOpen,
    editingMeal,
    mealType,
    setMealType,
    mealName,
    setMealName,
    calories,
    setCalories,
    protein,
    setProtein,
    carbs,
    setCarbs,
    fat,
    setFat,
    fiber,
    setFiber,
    quantity,
    setQuantity,
    notes,
    setNotes,
    formError,
    submitting,
    mealToDelete,
    setMealToDelete,
    deleting,
    showToast,
    loadNutritionData,
    openAddSheet,
    openEditSheet,
    closeSheet,
    handleSaveMeal,
    handleDeleteMeal,
  } = useNutritionScreen({ currentUser });

  // Time formatter
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // Filtered Meals Calculation
  const filteredMeals = meals.filter((meal) => {
    // 1. Meal Type Filter
    if (selectedMealType !== 'All' && meal.meal_type !== selectedMealType) {
      return false;
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const mName = (meal.meal_name || meal.food_name || '').toLowerCase();
      const mType = (meal.meal_type || '').toLowerCase();
      const mNotes = (meal.notes || '').toLowerCase();
      return mName.includes(q) || mType.includes(q) || mNotes.includes(q);
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden select-none">
      {/* TOP APP BAR */}
      <header className="h-14 bg-white border-b border-border-cool flex items-center justify-between px-5 sticky top-0 z-40 shrink-0">
        <div>
          <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase">
            Nutrition
          </h1>
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest -mt-0.5">
            Track meals & macros
          </p>
        </div>

        {/* Sync & Refresh controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadNutritionData(true)}
            disabled={refreshing}
            className="w-8 h-8 rounded-full border border-border-cool bg-bg-snow flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Nutrition"
          >
            <RotateCcw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-1 bg-bg-snow px-2.5 py-1 rounded-full border border-border-cool">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">
              Supabase Synced
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 flex flex-col gap-5 pb-28">
        {/* ERROR STATE BANNER */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-red-700">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <AlertTriangle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadNutritionData()}
              className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-red-700 transition-all cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* DAILY SUMMARY CARD */}
        {summary && (
          <div className="bg-neutral-900 text-white rounded-3xl p-5 shadow-sm border border-neutral-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-amber-400">
                  <Flame size={15} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-300">
                    Today's Nutrition
                  </h3>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">
                    {summary.totalMeals} {summary.totalMeals === 1 ? 'Meal' : 'Meals'} Logged
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-display font-black text-2xl text-white tracking-tight">
                  {summary.totalCalories.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">
                  kcal
                </span>
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
              <div className="bg-white/5 rounded-2xl p-2.5 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                  Protein
                </span>
                <span className="font-display font-bold text-sm text-white mt-0.5">
                  {summary.totalProtein}g
                </span>
              </div>
              <div className="bg-white/5 rounded-2xl p-2.5 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                  Carbs
                </span>
                <span className="font-display font-bold text-sm text-white mt-0.5">
                  {summary.totalCarbohydrates}g
                </span>
              </div>
              <div className="bg-white/5 rounded-2xl p-2.5 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                  Fat
                </span>
                <span className="font-display font-bold text-sm text-white mt-0.5">
                  {summary.totalFat}g
                </span>
              </div>
              <div className="bg-white/5 rounded-2xl p-2.5 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                  Fiber
                </span>
                <span className="font-display font-bold text-sm text-white mt-0.5">
                  {summary.totalFiber}g
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH AND MEAL TYPE FILTERS */}
        <div className="flex flex-col gap-3">
          {/* Search Field */}
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meal name or notes..."
              className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-2xl pl-11 pr-10 text-xs font-medium placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all duration-150"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 text-neutral-400 hover:text-neutral-900 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Meal Type Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {(['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedMealType(type)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  selectedMealType === type
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-bg-snow text-neutral-500 hover:text-neutral-900 border border-border-cool'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING SKELETON */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-4 border border-neutral-100 rounded-2xl flex items-center justify-between animate-pulse bg-neutral-50/50 h-20"
              >
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-neutral-200 rounded w-1/3" />
                  <div className="h-2 bg-neutral-200 rounded w-1/4" />
                </div>
                <div className="w-12 h-6 bg-neutral-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : meals.length === 0 ? (
          /* EMPTY STATE DESIGN */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 border border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50">
            <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mb-4 shadow-xs">
              <Utensils size={24} className="text-neutral-400" />
            </div>

            <h3 className="font-display font-semibold text-base text-neutral-900 uppercase tracking-wide">
              No meals logged today.
            </h3>

            <p className="text-xs text-neutral-500 max-w-[240px] mt-1.5 leading-relaxed font-normal">
              Start tracking your nutrition. Log your breakfast, lunch, dinner, or snacks to reach your daily targets.
            </p>

            <Button onClick={openAddSheet} variant="primary" className="mt-6 w-full max-w-[220px]">
              Add Meal
            </Button>
          </div>
        ) : filteredMeals.length === 0 ? (
          /* NO FILTER MATCH STATE */
          <div className="flex flex-col items-center justify-center text-center py-12 bg-white border border-neutral-100 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center mb-3">
              <Search size={18} className="text-neutral-400" />
            </div>
            <h4 className="font-display font-bold text-xs text-neutral-900 uppercase tracking-wide">
              No meals found matching criteria.
            </h4>
            <p className="text-[11px] text-neutral-400 max-w-[200px] mt-1 font-normal">
              Try adjusting your search or filter options.
            </p>
          </div>
        ) : (
          /* MEAL LIST CARDS */
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pl-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-display">
                Logged Meals ({filteredMeals.length})
              </span>
              <span className="text-[10px] font-bold text-neutral-900 bg-bg-snow border border-border-cool px-2.5 py-0.5 rounded-full">
                {filteredMeals.reduce((acc, m) => acc + (m.calories || 0), 0)} kcal total
              </span>
            </div>

            {filteredMeals.map((meal) => (
              <div
                key={meal.id}
                className="bg-white border border-border-cool rounded-2xl p-4 flex items-center justify-between hover:border-neutral-300 transition-all duration-200 shadow-2xs"
              >
                {/* Left: Meal Details */}
                <div className="flex flex-col min-w-0 mr-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest font-display bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                      {meal.meal_type}
                    </span>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-medium">
                      <Clock size={10} />
                      {formatTime(meal.meal_time || meal.created_at)}
                    </span>
                  </div>

                  <span className="font-sans font-semibold text-sm text-neutral-900 mt-2 truncate">
                    {meal.meal_name || meal.food_name}
                  </span>

                  {/* Macros line */}
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-medium text-neutral-500">
                    <span className="font-bold text-neutral-900">{meal.calories} kcal</span>
                    {meal.protein > 0 && <span>P: {meal.protein}g</span>}
                    {meal.carbohydrates > 0 && <span>C: {meal.carbohydrates}g</span>}
                    {meal.fat > 0 && <span>F: {meal.fat}g</span>}
                  </div>

                  {meal.notes && (
                    <span className="text-[10px] text-neutral-400 italic mt-1 truncate">
                      "{meal.notes}"
                    </span>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditSheet(meal)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 active:scale-90 transition-all cursor-pointer"
                    title="Edit Meal"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => setMealToDelete(meal)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50/50 active:scale-90 transition-all cursor-pointer"
                    title="Delete Meal"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTON */}
      <button
        onClick={openAddSheet}
        className="absolute bottom-6 right-6 w-14 h-14 bg-neutral-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 hover:bg-neutral-800 transition-all cursor-pointer z-30 border border-neutral-800"
        title="Add Meal"
      >
        <Plus size={24} />
      </button>

      {/* ADD / EDIT MEAL BOTTOM SHEET MODAL */}
      <AnimatePresence>
        {isSheetOpen && (
          <>
            {/* Sheet Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSheetOpen(false)}
              className="absolute inset-0 bg-neutral-950/30 backdrop-blur-xs z-45"
            />

            {/* Sheet Content Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-border-cool rounded-t-[28px] shadow-2xl z-50 px-6 pt-5 pb-8 flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border-cool mb-4">
                <div>
                  <h4 className="font-display font-semibold text-base text-neutral-900 uppercase tracking-wide">
                    {editingMeal ? 'Edit Meal' : 'Add Meal'}
                  </h4>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
                    {editingMeal ? 'Update meal & macro record' : 'Log food & macro nutrition'}
                  </p>
                </div>
                <button
                  onClick={() => setIsSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-neutral-900 cursor-pointer border border-border-cool"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Meal Input Form */}
              <form onSubmit={handleSaveMeal} className="flex flex-col gap-4">
                {formError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-red-100">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Meal Type Segmented Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-secondary-text pl-1">
                    Meal Type *
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-bg-snow p-1 rounded-2xl border border-border-cool">
                    {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as MealType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMealType(type)}
                        className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center transition-all cursor-pointer ${
                          mealType === type
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meal Name Field */}
                <Input
                  label="Meal / Food Name *"
                  type="text"
                  required
                  placeholder="e.g. Scrambled Eggs & Toast"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                />

                {/* Calories & Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Calories (kcal) *"
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 450"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                  />
                  <Input
                    label="Serving / Quantity"
                    type="text"
                    placeholder="e.g. 1 serving"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                {/* Macros Input Grid */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-secondary-text pl-1">
                    Macros (Optional)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      label="Protein (g)"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                    />
                    <Input
                      label="Carbs (g)"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                    />
                    <Input
                      label="Fat (g)"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                    />
                    <Input
                      label="Fiber (g)"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={fiber}
                      onChange={(e) => setFiber(e.target.value)}
                    />
                  </div>
                </div>

                {/* Notes Field */}
                <Input
                  label="Notes"
                  type="text"
                  placeholder="e.g. Post-workout breakfast"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Button type="button" onClick={() => setIsSheetOpen(false)} variant="secondary">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    variant="primary"
                    className="flex items-center justify-center gap-1.5"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    <span>Save Meal</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {mealToDelete && (
          <>
            {/* Dialog Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-6"
            >
              {/* Dialog Content */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white border border-border-cool rounded-[24px] max-w-sm w-full p-6 shadow-xl flex flex-col text-center"
              >
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle size={20} />
                </div>

                <h3 className="font-display font-semibold text-base text-neutral-900 uppercase tracking-wide">
                  Delete Meal?
                </h3>

                <p className="text-xs text-neutral-500 mt-2 leading-relaxed font-normal">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-neutral-800">
                    "{mealToDelete.meal_name || mealToDelete.food_name}"
                  </span>
                  ? This action cannot be undone.
                </p>

                {/* Dialog Actions */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <Button
                    onClick={() => setMealToDelete(null)}
                    variant="secondary"
                    className="!h-11"
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteMeal}
                    variant="danger"
                    className="!h-11 flex items-center justify-center gap-1.5"
                    disabled={deleting}
                  >
                    {deleting && <Loader2 size={15} className="animate-spin" />}
                    <span>Delete</span>
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FLOATING SUCCESS/INFO TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="absolute bottom-5 left-4 right-4 bg-neutral-900 text-white py-3 px-4 rounded-xl shadow-lg border border-neutral-800 z-50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
          >
            {toast.type === 'success' ? (
              <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
