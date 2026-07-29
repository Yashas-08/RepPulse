import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  NutritionLog,
  MealType,
  NutritionSummary,
  AddMealInput,
  UpdateMealInput,
  ServiceResult,
} from '../types/nutrition';

const LOCAL_STORAGE_KEY_PREFIX = 'reppulse_meals_';

/**
 * Normalizes a raw DB record into a standard NutritionLog object.
 * Supports standard names as well as database schema aliases (protein_g, carbs_g, fat_g, fiber_g).
 */
function normalizeMealRecord(raw: any): NutritionLog {
  if (!raw) {
    return {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `meal_${Date.now()}`,
      user_id: 'guest',
      meal_type: 'Breakfast',
      meal_name: 'Logged Meal',
      food_name: 'Logged Meal',
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      quantity: '1 serving',
      meal_time: new Date().toISOString(),
      notes: '',
      created_at: new Date().toISOString(),
    };
  }

  const mealName = raw.meal_name || raw.food_name || raw.name || 'Logged Meal';

  // Support both standard names and _g / _grams suffixes from Supabase or legacy tables
  const proteinVal = raw.protein ?? raw.protein_g ?? raw.protein_grams ?? 0;
  const carbsVal = raw.carbohydrates ?? raw.carbs_g ?? raw.carbs ?? raw.carbohydrates_g ?? 0;
  const fatVal = raw.fat ?? raw.fat_g ?? raw.fats ?? raw.fat_grams ?? 0;
  const fiberVal = raw.fiber ?? raw.fiber_g ?? raw.fiber_grams ?? 0;

  return {
    id: raw.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `meal_${Date.now()}`),
    user_id: raw.user_id || 'guest',
    meal_type: (raw.meal_type as MealType) || 'Breakfast',
    meal_name: mealName,
    food_name: mealName, // For backwards compatibility
    calories: Number(raw.calories) || 0,
    protein: Number(proteinVal) || 0,
    carbohydrates: Number(carbsVal) || 0,
    fat: Number(fatVal) || 0,
    fiber: Number(fiberVal) || 0,
    quantity: raw.quantity || '1 serving',
    meal_time: raw.meal_time || raw.created_at || new Date().toISOString(),
    notes: raw.notes || '',
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || undefined,
  };
}

/**
 * Reads local storage backup
 */
function getLocalMeals(userId: string): NutritionLog[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeMealRecord);
  } catch (err) {
    console.error('Error reading local meals:', err);
    return [];
  }
}

/**
 * Writes local storage backup
 */
function saveLocalMeals(userId: string, meals: NutritionLog[]): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(meals));
  } catch (err) {
    console.error('Error saving local meals:', err);
  }
}

/**
 * Emits global sync event for real-time app reactivity
 */
function notifyNutritionUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('reppulse_nutrition_updated'));
  }
}

export const NutritionService = {
  /**
   * Retrieves all meals for a user, optionally filtered by date (YYYY-MM-DD)
   */
  async getMeals(
    userId: string = 'guest',
    filterDate?: string
  ): Promise<ServiceResult<NutritionLog[]>> {
    try {
      let fetchedFromDb = false;
      let logs: NutritionLog[] = [];

      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        // Try fetching from nutrition_logs table first
        try {
          const { data, error } = await supabase
            .from('nutrition_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            logs = data.map(normalizeMealRecord);
            fetchedFromDb = true;
          } else {
            // Fallback to legacy 'meals' table if nutrition_logs does not exist
            const { data: legacyData, error: legacyErr } = await supabase
              .from('meals')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });

            if (!legacyErr && legacyData) {
              logs = legacyData.map(normalizeMealRecord);
              fetchedFromDb = true;
            }
          }
        } catch (dbErr) {
          console.warn('Supabase fetch failed for nutrition_logs/meals:', dbErr);
        }
      }

      // If DB failed or offline or guest, use local storage fallback
      if (!fetchedFromDb) {
        logs = getLocalMeals(userId);
      } else {
        // Sync local storage cache
        saveLocalMeals(userId, logs);
      }

      // Filter by date if requested
      if (filterDate) {
        logs = logs.filter((m) => {
          const rawDate = m.meal_time || m.created_at || '';
          let mDate = '';
          try {
            const parsed = new Date(rawDate);
            if (!isNaN(parsed.getTime())) {
              mDate = parsed.toLocaleDateString('sv-SE');
            } else {
              mDate = rawDate.split('T')[0] || rawDate.substring(0, 10);
            }
          } catch {
            mDate = rawDate.split('T')[0] || rawDate.substring(0, 10);
          }
          return mDate === filterDate;
        });
      }

      // Sort newest first
      logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { success: true, data: logs };
    } catch (err: unknown) {
      console.warn('Network or DB issue in getMeals, returning local data:', err);
      const localLogs = getLocalMeals(userId);
      return {
        success: true,
        data: localLogs,
      };
    }
  },

  /**
   * Retrieves today's meals for a user
   */
  async getTodaysMeals(userId: string = 'guest'): Promise<ServiceResult<NutritionLog[]>> {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    return this.getMeals(userId, todayStr);
  },

  /**
   * Calculates daily nutrition summary for a given date (defaults to today)
   */
  async getNutritionSummary(
    userId: string = 'guest',
    date?: string
  ): Promise<ServiceResult<NutritionSummary>> {
    try {
      const targetDate = date || new Date().toLocaleDateString('sv-SE');
      const mealsRes = await this.getMeals(userId, targetDate);

      const meals = mealsRes.data || [];

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbohydrates = 0;
      let totalFat = 0;
      let totalFiber = 0;

      const mealTypeCounts: Record<MealType, number> = {
        Breakfast: 0,
        Lunch: 0,
        Dinner: 0,
        Snack: 0,
      };

      const mealTypeCalories: Record<MealType, number> = {
        Breakfast: 0,
        Lunch: 0,
        Dinner: 0,
        Snack: 0,
      };

      meals.forEach((m) => {
        totalCalories += m.calories || 0;
        totalProtein += m.protein || 0;
        totalCarbohydrates += m.carbohydrates || 0;
        totalFat += m.fat || 0;
        totalFiber += m.fiber || 0;

        if (m.meal_type in mealTypeCounts) {
          mealTypeCounts[m.meal_type] += 1;
          mealTypeCalories[m.meal_type] += m.calories || 0;
        }
      });

      const summary: NutritionSummary = {
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalCarbohydrates: Math.round(totalCarbohydrates * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10,
        totalFiber: Math.round(totalFiber * 10) / 10,
        totalMeals: meals.length,
        mealTypeCounts,
        mealTypeCalories,
      };

      return { success: true, data: summary };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to calculate nutrition summary.';
      return {
        success: false,
        error: message,
        code: 'SUMMARY_CALC_ERROR',
      };
    }
  },

  /**
   * Adds a new meal log
   */
  async addMeal(
    input: AddMealInput,
    userId: string = 'guest'
  ): Promise<ServiceResult<NutritionLog>> {
    try {
      const now = new Date().toISOString();
      const newId = crypto.randomUUID ? crypto.randomUUID() : `meal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const mealName = (input.meal_name || '').trim();

      if (!mealName) {
        return { success: false, error: 'Meal name is required.', code: 'INVALID_INPUT' };
      }

      if (typeof input.calories !== 'number' || input.calories < 0) {
        return { success: false, error: 'Valid positive calorie value is required.', code: 'INVALID_INPUT' };
      }

      const newLog: NutritionLog = {
        id: newId,
        user_id: userId,
        meal_type: input.meal_type || 'Breakfast',
        meal_name: mealName,
        food_name: mealName,
        calories: Math.round(input.calories),
        protein: input.protein ? Math.round(input.protein * 10) / 10 : 0,
        carbohydrates: input.carbohydrates ? Math.round(input.carbohydrates * 10) / 10 : 0,
        fat: input.fat ? Math.round(input.fat * 10) / 10 : 0,
        fiber: input.fiber ? Math.round(input.fiber * 10) / 10 : 0,
        quantity: input.quantity || '1 serving',
        meal_time: input.meal_time || now,
        notes: (input.notes || '').trim(),
        created_at: now,
        updated_at: now,
      };

      let persistedInDb = false;

      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          // 1. Primary insert attempting both standard names and _g alias names for maximum database compatibility
          const primaryPayload: Record<string, any> = {
            id: newLog.id,
            user_id: userId,
            meal_type: newLog.meal_type,
            meal_name: newLog.meal_name,
            food_name: newLog.meal_name,
            calories: newLog.calories,
            protein: newLog.protein,
            protein_g: newLog.protein,
            carbohydrates: newLog.carbohydrates,
            carbs_g: newLog.carbohydrates,
            fat: newLog.fat,
            fat_g: newLog.fat,
            fiber: newLog.fiber,
            fiber_g: newLog.fiber,
            quantity: String(newLog.quantity),
            meal_time: newLog.meal_time,
            notes: newLog.notes,
            created_at: newLog.created_at,
            updated_at: newLog.updated_at,
          };

          const { error } = await supabase.from('nutrition_logs').insert(primaryPayload);

          if (!error) {
            persistedInDb = true;
          } else {
            // 2. Fallback insert with standard field names if alias columns do not exist
            const standardPayload = {
              id: newLog.id,
              user_id: userId,
              meal_type: newLog.meal_type,
              meal_name: newLog.meal_name,
              calories: newLog.calories,
              protein: newLog.protein,
              carbohydrates: newLog.carbohydrates,
              fat: newLog.fat,
              fiber: newLog.fiber,
              quantity: String(newLog.quantity),
              meal_time: newLog.meal_time,
              notes: newLog.notes,
              created_at: newLog.created_at,
              updated_at: newLog.updated_at,
            };

            const { error: err2 } = await supabase.from('nutrition_logs').insert(standardPayload);
            if (!err2) {
              persistedInDb = true;
            } else {
              // 3. Fallback to legacy 'meals' table with macro fields included
              const { error: legacyErr } = await supabase.from('meals').insert({
                id: newLog.id,
                user_id: userId,
                meal_type: newLog.meal_type,
                food_name: newLog.meal_name,
                calories: newLog.calories,
                protein: newLog.protein,
                protein_g: newLog.protein,
                carbohydrates: newLog.carbohydrates,
                carbs_g: newLog.carbohydrates,
                fat: newLog.fat,
                fat_g: newLog.fat,
                fiber: newLog.fiber,
                fiber_g: newLog.fiber,
                created_at: newLog.created_at,
                updated_at: newLog.updated_at,
              });

              if (!legacyErr) {
                persistedInDb = true;
              }
            }
          }
        } catch (dbErr) {
          console.warn('Supabase insert error for meal:', dbErr);
        }
      }

      // Always update local cache for smooth immediate offline/online behavior
      const existingLocal = getLocalMeals(userId);
      saveLocalMeals(userId, [newLog, ...existingLocal]);

      notifyNutritionUpdated();

      return { success: true, data: newLog };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add meal.';
      return { success: false, error: message, code: 'ADD_MEAL_ERROR' };
    }
  },

  /**
   * Updates an existing meal log
   */
  async updateMeal(
    input: UpdateMealInput,
    userId: string = 'guest'
  ): Promise<ServiceResult<NutritionLog>> {
    try {
      if (!input.id) {
        return { success: false, error: 'Meal ID is required.', code: 'INVALID_INPUT' };
      }

      const now = new Date().toISOString();
      const existingLocal = getLocalMeals(userId);
      const targetIndex = existingLocal.findIndex((m) => m.id === input.id);

      const previousMeal = targetIndex !== -1 ? existingLocal[targetIndex] : null;

      const mealName = input.meal_name !== undefined ? input.meal_name.trim() : previousMeal?.meal_name || 'Logged Meal';

      const updatedMeal: NutritionLog = {
        id: input.id,
        user_id: userId,
        meal_type: input.meal_type || previousMeal?.meal_type || 'Breakfast',
        meal_name: mealName,
        food_name: mealName,
        calories: input.calories !== undefined ? Math.round(input.calories) : previousMeal?.calories || 0,
        protein: input.protein !== undefined ? Math.round(input.protein * 10) / 10 : previousMeal?.protein || 0,
        carbohydrates: input.carbohydrates !== undefined ? Math.round(input.carbohydrates * 10) / 10 : previousMeal?.carbohydrates || 0,
        fat: input.fat !== undefined ? Math.round(input.fat * 10) / 10 : previousMeal?.fat || 0,
        fiber: input.fiber !== undefined ? Math.round(input.fiber * 10) / 10 : previousMeal?.fiber || 0,
        quantity: input.quantity !== undefined ? input.quantity : previousMeal?.quantity || '1 serving',
        meal_time: input.meal_time || previousMeal?.meal_time || now,
        notes: input.notes !== undefined ? input.notes.trim() : previousMeal?.notes || '',
        created_at: previousMeal?.created_at || now,
        updated_at: now,
      };

      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          const primaryUpdate: Record<string, any> = {
            meal_type: updatedMeal.meal_type,
            meal_name: updatedMeal.meal_name,
            food_name: updatedMeal.meal_name,
            calories: updatedMeal.calories,
            protein: updatedMeal.protein,
            protein_g: updatedMeal.protein,
            carbohydrates: updatedMeal.carbohydrates,
            carbs_g: updatedMeal.carbohydrates,
            fat: updatedMeal.fat,
            fat_g: updatedMeal.fat,
            fiber: updatedMeal.fiber,
            fiber_g: updatedMeal.fiber,
            quantity: String(updatedMeal.quantity),
            meal_time: updatedMeal.meal_time,
            notes: updatedMeal.notes,
            updated_at: updatedMeal.updated_at,
          };

          const { error } = await supabase
            .from('nutrition_logs')
            .update(primaryUpdate)
            .eq('id', input.id)
            .eq('user_id', userId);

          if (error) {
            const standardUpdate = {
              meal_type: updatedMeal.meal_type,
              meal_name: updatedMeal.meal_name,
              calories: updatedMeal.calories,
              protein: updatedMeal.protein,
              carbohydrates: updatedMeal.carbohydrates,
              fat: updatedMeal.fat,
              fiber: updatedMeal.fiber,
              quantity: String(updatedMeal.quantity),
              meal_time: updatedMeal.meal_time,
              notes: updatedMeal.notes,
              updated_at: updatedMeal.updated_at,
            };

            const { error: err2 } = await supabase
              .from('nutrition_logs')
              .update(standardUpdate)
              .eq('id', input.id)
              .eq('user_id', userId);

            if (err2) {
              // Try legacy meals table update
              await supabase
                .from('meals')
                .update({
                  meal_type: updatedMeal.meal_type,
                  food_name: updatedMeal.meal_name,
                  calories: updatedMeal.calories,
                  protein: updatedMeal.protein,
                  protein_g: updatedMeal.protein,
                  carbohydrates: updatedMeal.carbohydrates,
                  carbs_g: updatedMeal.carbohydrates,
                  fat: updatedMeal.fat,
                  fat_g: updatedMeal.fat,
                  fiber: updatedMeal.fiber,
                  fiber_g: updatedMeal.fiber,
                  updated_at: updatedMeal.updated_at,
                })
                .eq('id', input.id)
                .eq('user_id', userId);
            }
          }
        } catch (dbErr) {
          console.warn('Supabase update error for meal:', dbErr);
        }
      }

      // Update local storage
      const updatedList = existingLocal.map((m) => (m.id === input.id ? updatedMeal : m));
      saveLocalMeals(userId, updatedList);

      notifyNutritionUpdated();

      return { success: true, data: updatedMeal };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update meal.';
      return { success: false, error: message, code: 'UPDATE_MEAL_ERROR' };
    }
  },

  /**
   * Deletes a meal log by ID
   */
  async deleteMeal(id: string, userId: string = 'guest'): Promise<ServiceResult<boolean>> {
    try {
      if (!id) {
        return { success: false, error: 'Meal ID is required.', code: 'INVALID_INPUT' };
      }

      if (isSupabaseConfigured && supabase && userId !== 'guest') {
        try {
          const { error } = await supabase
            .from('nutrition_logs')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

          if (error) {
            await supabase.from('meals').delete().eq('id', id).eq('user_id', userId);
          }
        } catch (dbErr) {
          console.warn('Supabase delete error for meal:', dbErr);
        }
      }

      // Remove from local storage
      const existingLocal = getLocalMeals(userId);
      const filtered = existingLocal.filter((m) => m.id !== id);
      saveLocalMeals(userId, filtered);

      notifyNutritionUpdated();

      return { success: true, data: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete meal.';
      return { success: false, error: message, code: 'DELETE_MEAL_ERROR' };
    }
  },

  /**
   * Searches meals by name, meal type, or notes (case-insensitive)
   */
  async searchMeals(
    userId: string = 'guest',
    query: string,
    filterDate?: string
  ): Promise<ServiceResult<NutritionLog[]>> {
    try {
      const allRes = await this.getMeals(userId, filterDate);
      if (!allRes.success || !allRes.data) {
        return allRes;
      }

      const cleanQuery = query.trim().toLowerCase();
      if (!cleanQuery) {
        return { success: true, data: allRes.data };
      }

      const filtered = allRes.data.filter(
        (m) =>
          m.meal_name.toLowerCase().includes(cleanQuery) ||
          (m.food_name && m.food_name.toLowerCase().includes(cleanQuery)) ||
          m.meal_type.toLowerCase().includes(cleanQuery) ||
          (m.notes && m.notes.toLowerCase().includes(cleanQuery))
      );

      return { success: true, data: filtered };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to search meals.';
      return { success: false, error: message, code: 'SEARCH_MEALS_ERROR' };
    }
  },

  /**
   * Filters meals by meal type (or 'All')
   */
  async filterMeals(
    userId: string = 'guest',
    mealType: MealType | 'All',
    filterDate?: string
  ): Promise<ServiceResult<NutritionLog[]>> {
    try {
      const allRes = await this.getMeals(userId, filterDate);
      if (!allRes.success || !allRes.data) {
        return allRes;
      }

      if (mealType === 'All') {
        return { success: true, data: allRes.data };
      }

      const filtered = allRes.data.filter((m) => m.meal_type === mealType);
      return { success: true, data: filtered };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to filter meals.';
      return { success: false, error: message, code: 'FILTER_MEALS_ERROR' };
    }
  },
};
