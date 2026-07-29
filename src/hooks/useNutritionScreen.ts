import { useState, useEffect, useCallback, FormEvent } from 'react';
import { User } from '@supabase/supabase-js';
import { NutritionLog, MealType, NutritionSummary } from '../types/nutrition';
import { NutritionService } from '../services/nutritionService';

export interface UseNutritionScreenProps {
  currentUser: User | null;
}

export function useNutritionScreen({ currentUser }: UseNutritionScreenProps) {
  const userId = currentUser?.id || 'guest';

  // Data States
  const [meals, setMeals] = useState<NutritionLog[]>([]);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMealType, setSelectedMealType] = useState<MealType | 'All'>('All');

  // Modal / Form States
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [editingMeal, setEditingMeal] = useState<NutritionLog | null>(null);

  // Form Fields
  const [mealType, setMealType] = useState<MealType>('Breakfast');
  const [mealName, setMealName] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [fiber, setFiber] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1 serving');
  const [notes, setNotes] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Delete Confirmation States
  const [mealToDelete, setMealToDelete] = useState<NutritionLog | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Toast Helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  // Load Meals and Daily Summary from NutritionService
  const loadNutritionData = useCallback(async (isSilentRefresh = false) => {
    if (!isSilentRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const [mealsRes, summaryRes] = await Promise.all([
        NutritionService.getTodaysMeals(userId),
        NutritionService.getNutritionSummary(userId),
      ]);

      if (mealsRes.success && mealsRes.data) {
        setMeals(mealsRes.data);
      } else if (mealsRes.error) {
        setError(mealsRes.error);
      }

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load nutrition data.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNutritionData();

    const handleNutritionUpdated = () => {
      loadNutritionData(true);
    };

    window.addEventListener('reppulse_nutrition_updated', handleNutritionUpdated);
    return () => {
      window.removeEventListener('reppulse_nutrition_updated', handleNutritionUpdated);
    };
  }, [loadNutritionData]);

  // Open Sheet to Add Meal
  const openAddSheet = () => {
    setEditingMeal(null);
    setMealType('Breakfast');
    setMealName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber('');
    setQuantity('1 serving');
    setNotes('');
    setFormError(null);
    setIsSheetOpen(true);
  };

  // Open Sheet to Edit Meal
  const openEditSheet = (meal: NutritionLog) => {
    setEditingMeal(meal);
    setMealType(meal.meal_type);
    setMealName(meal.meal_name || meal.food_name || '');
    setCalories(meal.calories.toString());
    setProtein(meal.protein ? meal.protein.toString() : '');
    setCarbs(meal.carbohydrates ? meal.carbohydrates.toString() : '');
    setFat(meal.fat ? meal.fat.toString() : '');
    setFiber(meal.fiber ? meal.fiber.toString() : '');
    setQuantity(meal.quantity ? String(meal.quantity) : '1 serving');
    setNotes(meal.notes || '');
    setFormError(null);
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setEditingMeal(null);
    setFormError(null);
  };

  // Save or Update Meal
  const handleSaveMeal = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = mealName.trim();
    if (!trimmedName) {
      setFormError('Meal name is required');
      return;
    }

    const calNum = parseInt(calories, 10);
    if (isNaN(calNum) || calNum < 0) {
      setFormError('Calories must be a non-negative number');
      return;
    }

    const proteinNum = protein ? parseFloat(protein) : 0;
    const carbsNum = carbs ? parseFloat(carbs) : 0;
    const fatNum = fat ? parseFloat(fat) : 0;
    const fiberNum = fiber ? parseFloat(fiber) : 0;

    setSubmitting(true);

    try {
      if (editingMeal) {
        const result = await NutritionService.updateMeal(
          {
            id: editingMeal.id,
            meal_type: mealType,
            meal_name: trimmedName,
            calories: calNum,
            protein: proteinNum,
            carbohydrates: carbsNum,
            fat: fatNum,
            fiber: fiberNum,
            quantity: quantity || '1 serving',
            notes: notes,
          },
          userId
        );

        if (result.success) {
          showToast('Meal updated successfully');
          setIsSheetOpen(false);
          await loadNutritionData(true);
          window.dispatchEvent(new Event('reppulse_nutrition_updated'));
        } else {
          setFormError(result.error || 'Failed to update meal');
        }
      } else {
        const result = await NutritionService.addMeal(
          {
            meal_type: mealType,
            meal_name: trimmedName,
            calories: calNum,
            protein: proteinNum,
            carbohydrates: carbsNum,
            fat: fatNum,
            fiber: fiberNum,
            quantity: quantity || '1 serving',
            notes: notes,
          },
          userId
        );

        if (result.success) {
          showToast('Meal logged successfully');
          setIsSheetOpen(false);
          await loadNutritionData(true);
          window.dispatchEvent(new Event('reppulse_nutrition_updated'));
        } else {
          setFormError(result.error || 'Failed to add meal');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Meal
  const handleDeleteMeal = async () => {
    if (!mealToDelete) return;
    setDeleting(true);

    try {
      const result = await NutritionService.deleteMeal(mealToDelete.id, userId);
      if (result.success) {
        showToast('Meal deleted successfully');
        setMealToDelete(null);
        await loadNutritionData(true);
        window.dispatchEvent(new Event('reppulse_nutrition_updated'));
      } else {
        showToast(result.error || 'Failed to delete meal', 'error');
      }
    } catch (err: unknown) {
      showToast('An error occurred during meal deletion', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return {
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
  };
}
