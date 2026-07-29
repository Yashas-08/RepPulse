export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface NutritionLog {
  id: string;
  user_id: string;
  meal_type: MealType;
  meal_name: string;
  food_name?: string; // Backwards compatibility
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  quantity: string | number;
  meal_time: string;
  notes: string;
  created_at: string;
  updated_at?: string;
}

export type Meal = NutritionLog;

export interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbohydrates: number;
  totalFat: number;
  totalFiber: number;
  totalMeals: number;
  mealTypeCounts: Record<MealType, number>;
  mealTypeCalories: Record<MealType, number>;
}

export interface AddMealInput {
  meal_type: MealType;
  meal_name: string;
  calories: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  quantity?: string | number;
  meal_time?: string;
  notes?: string;
}

export interface UpdateMealInput extends Partial<AddMealInput> {
  id: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
