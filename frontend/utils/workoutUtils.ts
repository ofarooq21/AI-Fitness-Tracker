export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  exercise: { id: string; name: string; category: string };
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  date: string; // ISO date
  duration: number; // minutes
  exercises: WorkoutExercise[];
  totalSets: number;
  totalVolume: number;
}

export function computeWorkoutTotals(session: WorkoutSession): Pick<WorkoutSession, 'totalSets' | 'totalVolume'> {
  const totalSets = session.exercises.reduce((t, ex) => t + ex.sets.length, 0);
  const totalVolume = session.exercises.reduce((t, ex) => t + ex.sets.reduce((s, set) => s + (set.reps * set.weight), 0), 0);
  return { totalSets, totalVolume };
}

export function computeWeeklySummary(workoutHistory: WorkoutSession[], nowDate: Date = new Date()) {
  const now = new Date(nowDate);
  const startOfWeek = new Date(now);
  const dayIndex = now.getDay();
  const diffToMonday = dayIndex === 0 ? 6 : dayIndex - 1;
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - diffToMonday);

  const workoutsThisWeek = workoutHistory.filter((w) => {
    const d = new Date(w.date);
    return d >= startOfWeek && d <= now;
  });

  const completedThisWeek = workoutsThisWeek.length;
  const totalMinutes = workoutsThisWeek.reduce((sum, w) => sum + (w.duration || 0), 0);

  const completedDates = new Set(workoutHistory.map((w) => new Date(w.date).toDateString()));
  let currentStreak = 0;
  const checkDate = new Date(now);
  checkDate.setHours(0, 0, 0, 0);
  while (completedDates.has(checkDate.toDateString())) {
    currentStreak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return { completedThisWeek, totalMinutes, currentStreak };
}

export function computeLocalTrends(workoutHistory: WorkoutSession[]) {
  const map: Record<string, { volume: number; sets: number }> = {};
  for (const w of workoutHistory) {
    const key = new Date(w.date).toISOString().split('T')[0];
    map[key] = map[key] || { volume: 0, sets: 0 };
    map[key].volume += w.totalVolume || 0;
    map[key].sets += w.totalSets || 0;
  }
  const entries = Object.entries(map).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  const maxVolume = entries.reduce((m, [, v]) => Math.max(m, v.volume), 0) || 1;
  return { entries, maxVolume };
}


