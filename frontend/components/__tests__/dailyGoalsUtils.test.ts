import { computeDailyProgress, toggleCheckboxTask, updateCounterTask, ensureDefaults, DailyTask } from '../../utils/dailyGoalsUtils';

describe('dailyGoalsUtils', () => {
  test('computeDailyProgress handles empty', () => {
    expect(computeDailyProgress([])).toBe(0);
  });

  test('computeDailyProgress mixes checkbox and counter', () => {
    const tasks: DailyTask[] = [
      { id: 'a', name: 'Workout', type: 'checkbox', completed: true },
      { id: 'b', name: 'Water', type: 'counter', target: 8, value: 4 },
      { id: 'c', name: 'Protein', type: 'checkbox', completed: false },
    ];
    // 3 tasks -> achieved: workout true = 1, water 4/8 not met, protein false = 0 => 1/3 ~ 33%
    expect(computeDailyProgress(tasks)).toBe(33);
  });

  test('toggleCheckboxTask flips completed', () => {
    const tasks: DailyTask[] = [{ id: 'x', name: 'Task', type: 'checkbox', completed: false }];
    const next = toggleCheckboxTask(tasks, 'x');
    expect(next[0].completed).toBe(true);
  });

  test('updateCounterTask increments and not below zero', () => {
    const tasks: DailyTask[] = [{ id: 'y', name: 'Water', type: 'counter', target: 8, value: 0 }];
    let next = updateCounterTask(tasks, 'y', +3);
    expect(next[0].value).toBe(3);
    next = updateCounterTask(next, 'y', -5);
    expect(next[0].value).toBe(0);
  });

  test('ensureDefaults returns defaults when empty', () => {
    const defaults = ensureDefaults([]);
    expect(defaults.length).toBeGreaterThan(0);
  });
});


