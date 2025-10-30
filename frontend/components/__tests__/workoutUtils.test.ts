import { computeWeeklySummary, computeLocalTrends, computeWorkoutTotals, WorkoutSession } from '../../utils/workoutUtils';

const makeSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: overrides.id || '1',
  name: overrides.name || 'Test',
  date: overrides.date || new Date().toISOString().split('T')[0],
  duration: overrides.duration ?? 30,
  exercises: overrides.exercises || [
    {
      id: 'e1',
      exercise: { id: 'x', name: 'Bench Press', category: 'Chest' },
      sets: [
        { id: 's1', reps: 10, weight: 50, completed: true },
        { id: 's2', reps: 8, weight: 60, completed: true },
      ],
    },
  ],
  totalSets: overrides.totalSets ?? 2,
  totalVolume: overrides.totalVolume ?? (10*50 + 8*60),
});

describe('computeWorkoutTotals', () => {
  test('totals sets and volume from sets', () => {
    const s = makeSession({ totalSets: 0, totalVolume: 0 });
    const totals = computeWorkoutTotals(s);
    expect(totals.totalSets).toBe(2);
    expect(totals.totalVolume).toBe(10*50 + 8*60);
  });
});

describe('computeWeeklySummary', () => {
  test('counts sessions and minutes this week', () => {
    const today = new Date('2025-01-08T12:00:00Z'); // Wednesday
    const history: WorkoutSession[] = [
      makeSession({ id: 'a', date: '2025-01-06', duration: 40 }), // Monday
      makeSession({ id: 'b', date: '2025-01-07', duration: 20 }), // Tuesday
      makeSession({ id: 'c', date: '2024-12-30', duration: 50 }), // last week
    ];
    const sum = computeWeeklySummary(history, today);
    expect(sum.completedThisWeek).toBe(2);
    expect(sum.totalMinutes).toBe(60);
    expect(sum.currentStreak).toBeGreaterThanOrEqual(0);
  });
});

describe('computeLocalTrends', () => {
  test('aggregates volume per day and finds maxVolume', () => {
    const history: WorkoutSession[] = [
      makeSession({ id: 'a', date: '2025-01-01', totalVolume: 100, totalSets: 4 }),
      makeSession({ id: 'b', date: '2025-01-01', totalVolume: 50, totalSets: 2 }),
      makeSession({ id: 'c', date: '2025-01-02', totalVolume: 200, totalSets: 6 }),
    ];
    const { entries, maxVolume } = computeLocalTrends(history);
    expect(entries.length).toBe(2);
    const day1 = entries[0];
    const day2 = entries[1];
    expect(day1[0]).toBe('2025-01-01');
    expect(day1[1].volume).toBe(150);
    expect(day2[1].volume).toBe(200);
    expect(maxVolume).toBe(200);
  });
});


