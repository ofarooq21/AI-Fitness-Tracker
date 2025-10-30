export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  time: string;
}

export interface MacroGoal {
  id: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  startDate: string;
  endDate: string;
  duration: number;
}

export function getTotalCalories(meals: Meal[]): number {
  return meals.reduce((total, meal) => total + meal.calories, 0);
}

export function getTotalProtein(meals: Meal[]): number {
  return meals.reduce((total, meal) => total + meal.protein, 0);
}

export function getTotalFat(meals: Meal[]): number {
  return meals.reduce((total, meal) => total + meal.fat, 0);
}

export function getTotalCarbs(meals: Meal[]): number {
  return meals.reduce((total, meal) => total + meal.carbs, 0);
}

export function getGoalProgress(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min((current / target) * 100, 100);
}

export function getDaysRemaining(goal: MacroGoal | null): number {
  if (!goal) return 0;
  const today = new Date();
  const endDate = new Date(goal.endDate);
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function validateMealDraft(draft: { name: string; calories: string; protein: string; fat: string; carbs: string; }): string[] {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push('Meal name is required');
  const fields: Array<[keyof typeof draft, string]> = [
    ['calories', 'Calories'],
    ['protein', 'Protein'],
    ['fat', 'Fat'],
    ['carbs', 'Carbs'],
  ];
  for (const [key, label] of fields) {
    const value = parseInt(draft[key] as string);
    if (Number.isNaN(value)) errors.push(`${label} must be a number`);
    else if (value < 0) errors.push(`${label} cannot be negative`);
  }
  return errors;
}

export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}


