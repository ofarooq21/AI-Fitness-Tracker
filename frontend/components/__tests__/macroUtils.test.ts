import { 
  getTotalCalories,
  getTotalProtein,
  getTotalFat,
  getTotalCarbs,
  getGoalProgress,
  getDaysRemaining,
  formatDisplayDate,
} from '../../utils/macroUtils';

const meals = [
  { id: '1', name: 'a', calories: 200, protein: 20, fat: 10, carbs: 15, time: '' },
  { id: '2', name: 'b', calories: 300, protein: 30, fat: 5, carbs: 40, time: '' },
];

describe('macroUtils totals', () => {
  test('totals compute correctly', () => {
    expect(getTotalCalories(meals)).toBe(500);
    expect(getTotalProtein(meals)).toBe(50);
    expect(getTotalFat(meals)).toBe(15);
    expect(getTotalCarbs(meals)).toBe(55);
  });
});

describe('macroUtils progress', () => {
  test('progress clamps between 0 and 100', () => {
    expect(getGoalProgress(0, 2000)).toBe(0);
    expect(getGoalProgress(1000, 2000)).toBe(50);
    expect(getGoalProgress(3000, 2000)).toBe(100);
    expect(getGoalProgress(0, 0)).toBe(0);
  });
});

describe('macroUtils dates', () => {
  test('days remaining non-negative', () => {
    const today = new Date();
    const future = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const goal: any = { endDate: future.toISOString().split('T')[0] };
    expect(getDaysRemaining(goal)).toBeGreaterThanOrEqual(0);
  });

  test('formatDisplayDate returns human readable', () => {
    const s = formatDisplayDate('2025-01-15');
    expect(typeof s).toBe('string');
    expect(s.length).toBeGreaterThan(5);
  });
});


