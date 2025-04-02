export interface WeightGoal {
  currentWeight: number;
  targetWeight: number;
  deadline: Date;
}

export interface UserProfile {
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  dietaryPreferences?: string[];
  goals: WeightGoal;
  points: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: Date;
}

export interface WeightEntry {
  date: Date;
  weight: number;
  notes?: string;
}

export interface MealEntry {
  id: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: FoodItem[];
  notes?: string;
  totalNutrition: NutritionInfo;
}

export interface FoodItem {
  name: string;
  portion: number;
  unit: string;
  nutrition: NutritionInfo;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  startDate: Date;
  endDate: Date;
  completed: boolean;
}

export interface DailyNutrition {
  date: Date;
  meals: MealEntry[];
  totalNutrition: NutritionInfo;
}

export interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

export interface OnboardingState {
  step: 'name' | 'gender' | 'age' | 'activity' | 'goals' | 'dietary' | 'complete';
  data: Partial<UserProfile>;
}