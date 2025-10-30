export type DailyTaskType = 'checkbox' | 'counter';

export interface DailyTask {
  id: string;
  name: string;
  type: DailyTaskType;
  target?: number; // for counter
  unit?: string;   // for display e.g., cups, steps
  value?: number;  // current value for counter
  completed?: boolean; // for checkbox
}

export function computeDailyProgress(tasks: DailyTask[]): number {
  if (!tasks || tasks.length === 0) return 0;
  let total = 0;
  let achieved = 0;
  for (const t of tasks) {
    if (t.type === 'checkbox') {
      total += 1;
      if (t.completed) achieved += 1;
    } else if (t.type === 'counter') {
      const target = t.target || 0;
      const value = t.value || 0;
      if (target > 0) {
        total += 1;
        if (value >= target) achieved += 1;
      }
    }
  }
  if (total === 0) return 0;
  return Math.min(100, Math.round((achieved / total) * 100));
}

export function toggleCheckboxTask(tasks: DailyTask[], id: string): DailyTask[] {
  return tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
}

export function updateCounterTask(tasks: DailyTask[], id: string, delta: number): DailyTask[] {
  return tasks.map(t => {
    if (t.id !== id) return t;
    const next = Math.max(0, (t.value || 0) + delta);
    return { ...t, value: next };
  });
}

export function ensureDefaults(tasks: DailyTask[] | undefined): DailyTask[] {
  if (tasks && tasks.length > 0) return tasks;
  return [
    { id: 'water', name: 'Drink Water', type: 'counter', unit: 'cups', target: 8, value: 0 },
    { id: 'steps', name: 'Steps', type: 'counter', unit: 'steps', target: 8000, value: 0 },
    { id: 'protein', name: 'Protein Hit', type: 'checkbox', completed: false },
    { id: 'workout', name: 'Workout Done', type: 'checkbox', completed: false },
  ];
}


