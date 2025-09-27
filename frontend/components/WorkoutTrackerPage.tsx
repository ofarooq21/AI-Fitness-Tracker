import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface WorkoutEntry {
  id: string;
  name: string;
  date: string;
  duration: number;
  intensity: 'Low' | 'Medium' | 'High';
  completed: boolean;
  focus: 'Strength' | 'Cardio' | 'Mobility';
  notes?: string;
}

type GoalType = 'WorkoutsPerWeek' | 'MinutesPerWeek';

type GoalStatus = 'Active' | 'Completed';

interface Goal {
  id: string;
  title: string;
  type: GoalType;
  targetValue: number;
  status: GoalStatus;
  startDate: string;
  endDate?: string;
  notes?: string;
}

interface WorkoutTrackerPageProps {
  onBack: () => void;
}

interface WeeklySummary {
  completedThisWeek: number;
  totalMinutes: number;
  currentStreak: number;
}

const INITIAL_WORKOUTS: WorkoutEntry[] = [
  {
    id: '1',
    name: 'Full Body Circuit',
    date: new Date().toISOString(),
    duration: 45,
    intensity: 'High',
    completed: true,
    focus: 'Strength',
    notes: '3 rounds, kept rest under 60 seconds.',
  },
  {
    id: '2',
    name: 'Tempo Run',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    duration: 35,
    intensity: 'Medium',
    completed: true,
    focus: 'Cardio',
    notes: 'Maintained 6:00 pace for 20 minutes.',
  },
  {
    id: '3',
    name: 'Mobility Flow',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 25,
    intensity: 'Low',
    completed: false,
    focus: 'Mobility',
    notes: 'Focus on hips and thoracic spine.',
  },
];

const INTENSITY_ORDER: Record<WorkoutEntry['intensity'], number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const intensityColors: Record<WorkoutEntry['intensity'], string> = {
  High: '#FF8552',
  Medium: '#F2C14E',
  Low: '#6DB784',
};

const focusIcons: Record<WorkoutEntry['focus'], string> = {
  Strength: '🏋️',
  Cardio: '🏃',
  Mobility: '🧘',
};

const GOAL_TYPE_CONFIG: Record<GoalType, { label: string; unit: string; description: string }> = {
  WorkoutsPerWeek: {
    label: 'Workouts / Week',
    unit: 'workouts',
    description: 'Keep your weekly training consistent.',
  },
  MinutesPerWeek: {
    label: 'Active Minutes / Week',
    unit: 'minutes',
    description: 'Hit a target amount of active training minutes.',
  },
};

const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: '3 training days this week',
    type: 'WorkoutsPerWeek',
    targetValue: 3,
    status: 'Active',
    startDate: new Date().toISOString(),
    notes: 'Keep sessions full-body focused.',
  },
  {
    id: 'goal-2',
    title: '150 active minutes',
    type: 'MinutesPerWeek',
    targetValue: 150,
    status: 'Active',
    startDate: new Date().toISOString(),
    notes: 'Mix tempo runs with mobility drills.',
  },
];

const GOAL_STATUS_COLORS: Record<'Achieved' | 'On Track' | 'Needs Focus' | 'Completed', string> = {
  Completed: '#2D6A4F',
  Achieved: '#2D6A4F',
  'On Track': '#228B22',
  'Needs Focus': '#B97A1D',
};

function calculateGoalProgress(goal: Goal, summary: WeeklySummary) {
  let currentValue = 0;
  if (goal.type === 'WorkoutsPerWeek') {
    currentValue = summary.completedThisWeek;
  } else if (goal.type === 'MinutesPerWeek') {
    currentValue = summary.totalMinutes;
  }

  const targetValue = goal.targetValue;
  const ratio = targetValue > 0 ? currentValue / targetValue : 0;

  if (goal.status === 'Completed') {
    return {
      currentValue,
      targetValue,
      ratio: Math.max(ratio, 1),
      label: 'Completed' as const,
      color: GOAL_STATUS_COLORS.Completed,
    };
  }

  let label: 'Achieved' | 'On Track' | 'Needs Focus';
  if (ratio >= 1) {
    label = 'Achieved';
  } else if (ratio >= 0.6) {
    label = 'On Track';
  } else {
    label = 'Needs Focus';
  }

  return {
    currentValue,
    targetValue,
    ratio,
    label,
    color: GOAL_STATUS_COLORS[label],
  };
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function WorkoutTrackerPage({ onBack }: WorkoutTrackerPageProps) {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>(INITIAL_WORKOUTS);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedIntensity, setSelectedIntensity] = useState<WorkoutEntry['intensity']>('Medium');
  const [selectedFocus, setSelectedFocus] = useState<WorkoutEntry['focus']>('Strength');

  const weeklySummary = useMemo<WeeklySummary>(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayIndex = now.getDay();
    // Align week to Monday
    const diffToMonday = dayIndex === 0 ? 6 : dayIndex - 1;
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - diffToMonday);

    const workoutsThisWeek = workouts.filter((workout) => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= startOfWeek && workoutDate <= now;
    });

    const completedCount = workoutsThisWeek.filter((workout) => workout.completed).length;
    const minutes = workoutsThisWeek.reduce((sum, workout) => sum + workout.duration, 0);

    const completedDates = new Set(
      workouts
        .filter((workout) => workout.completed)
        .map((workout) => new Date(workout.date).toDateString()),
    );

    let streak = 0;
    const checkDate = new Date(now);
    checkDate.setHours(0, 0, 0, 0);

    while (completedDates.has(checkDate.toDateString())) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
      completedThisWeek: completedCount,
      totalMinutes: minutes,
      currentStreak: streak,
    };
  }, [workouts]);

  const { completedThisWeek, totalMinutes, currentStreak } = weeklySummary;
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetValue, setGoalTargetValue] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('WorkoutsPerWeek');
  const [goalNotes, setGoalNotes] = useState('');

  const resetGoalForm = () => {
    setGoalTitle('');
    setGoalTargetValue('');
    setGoalType('WorkoutsPerWeek');
    setGoalNotes('');
  };

  const handleToggleGoalStatus = (goalId: string) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              status: goal.status === 'Completed' ? 'Active' : 'Completed',
            }
          : goal,
      ),
    );
  };

  const handleCancelGoal = () => {
    resetGoalForm();
    setIsAddingGoal(false);
  };

  const handleSaveGoal = () => {
    if (!goalTitle.trim()) {
      Alert.alert('Missing title', 'Add a short name so you remember what you are chasing.');
      return;
    }

    if (!goalTargetValue.trim()) {
      Alert.alert('Missing target', 'Specify the target value to measure progress against.');
      return;
    }

    const parsedTarget = Number.parseInt(goalTargetValue, 10);

    if (Number.isNaN(parsedTarget) || parsedTarget <= 0) {
      Alert.alert('Invalid target', 'Target should be a positive number.');
      return;
    }

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title: goalTitle.trim(),
      type: goalType,
      targetValue: parsedTarget,
      status: 'Active',
      startDate: new Date().toISOString(),
      notes: goalNotes.trim() || undefined,
    };

    setGoals((prev) => [newGoal, ...prev]);
    resetGoalForm();
    setIsAddingGoal(false);
  };

  const renderGoalCard = (goal: Goal) => {
    const progress = calculateGoalProgress(goal, weeklySummary);
    const goalConfig = GOAL_TYPE_CONFIG[goal.type];

    return (
      <View key={goal.id} style={styles.goalCard}>
        <View style={styles.goalCardHeader}>
          <View>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalMeta}>
              {goalConfig.label} • Target {goal.targetValue} {goalConfig.unit}
            </Text>
          </View>
          <View style={[styles.goalStatusPill, { backgroundColor: progress.color }]}>
            <Text style={styles.goalStatusText}>{progress.label}</Text>
          </View>
        </View>
        {goal.notes ? <Text style={styles.goalNotes}>{goal.notes}</Text> : null}
        <View style={styles.goalProgressBarBackground}>
          <View
            style={[
              styles.goalProgressBarFill,
              {
                width: `${Math.min(progress.ratio, 1) * 100}%`,
                backgroundColor: progress.color,
              },
            ]}
          />
        </View>
        <View style={styles.goalProgressRow}>
          <Text style={styles.goalProgressText}>
            {Math.min(progress.currentValue, goal.targetValue)} / {goal.targetValue} {goalConfig.unit}
          </Text>
          <TouchableOpacity style={styles.goalActionButton} onPress={() => handleToggleGoalStatus(goal.id)}>
            <Text style={styles.goalActionButtonText}>
              {goal.status === 'Completed' ? 'Mark Active' : 'Mark Completed'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.goalDate}>Started {formatDate(goal.startDate)}</Text>
      </View>
    );
  };

  const sortedWorkouts = useMemo(
    () =>
      [...workouts].sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) {
          return dateDiff;
        }
        return INTENSITY_ORDER[b.intensity] - INTENSITY_ORDER[a.intensity];
      }),
    [workouts],
  );

  const resetForm = () => {
    setName('');
    setDuration('');
    setNotes('');
    setSelectedIntensity('Medium');
    setSelectedFocus('Strength');
  };

  const handleAddWorkout = () => {
    if (!name.trim() || !duration.trim()) {
      Alert.alert('Missing info', 'Please add a workout name and duration.');
      return;
    }

    const minutes = Number.parseInt(duration, 10);

    if (Number.isNaN(minutes) || minutes <= 0) {
      Alert.alert('Invalid duration', 'Duration should be a positive number of minutes.');
      return;
    }

    const newWorkout: WorkoutEntry = {
      id: String(Date.now()),
      name: name.trim(),
      date: new Date().toISOString(),
      duration: minutes,
      intensity: selectedIntensity,
      completed: false,
      focus: selectedFocus,
      notes: notes.trim() || undefined,
    };

    setWorkouts((prev) => [newWorkout, ...prev]);
    resetForm();
  };

  const toggleCompletion = (id: string) => {
    setWorkouts((prev) =>
      prev.map((workout) =>
        workout.id === id ? { ...workout, completed: !workout.completed } : workout,
      ),
    );
  };

  const renderWorkoutCard = ({ item }: { item: WorkoutEntry }) => (
    <View style={styles.workoutCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.workoutTitle}>{item.name}</Text>
          <Text style={styles.workoutMeta}>
            {formatDate(item.date)} • {item.duration} min • {item.intensity} • {focusIcons[item.focus]} {item.focus}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.statusPill, item.completed ? styles.statusPillCompleted : styles.statusPillPlanned]}
          onPress={() => toggleCompletion(item.id)}
        >
          <Text style={item.completed ? styles.statusTextCompleted : styles.statusTextPlanned}>
            {item.completed ? 'Completed' : 'Mark Complete'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: intensityColors[item.intensity],
              width: `${Math.min(100, Math.max(30, (item.duration / 60) * 100))}%`,
            },
          ]}
        />
      </View>
      {item.notes ? <Text style={styles.workoutNotes}>{item.notes}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Workout Tracker</Text>
        </View>

        <View style={styles.goalsSection}>
          <View style={styles.goalsHeader}>
            <View>
              <Text style={styles.sectionTitle}>Goal Management</Text>
              <Text style={styles.goalsSubtitle}>Stay consistent by tracking your weekly targets.</Text>
            </View>
            <TouchableOpacity
              style={styles.newGoalButton}
              onPress={() => setIsAddingGoal((prev) => !prev)}
            >
              <Text style={styles.newGoalButtonText}>{isAddingGoal ? 'Close' : 'New Goal'}</Text>
            </TouchableOpacity>
          </View>

          {isAddingGoal ? (
            <View style={styles.goalForm}>
              <Text style={styles.inputLabel}>Goal title</Text>
              <TextInput
                value={goalTitle}
                onChangeText={setGoalTitle}
                placeholder="e.g. 4 workouts this week"
                placeholderTextColor="#A0A0A0"
                style={styles.textInput}
              />

              <Text style={[styles.inputLabel, styles.goalFormLabel]}>Goal type</Text>
              <View style={styles.pillRow}>
                {(Object.keys(GOAL_TYPE_CONFIG) as GoalType[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.pill,
                      goalType === option ? styles.pillActive : null,
                    ]}
                    onPress={() => setGoalType(option)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        goalType === option ? styles.pillTextActive : null,
                      ]}
                    >
                      {GOAL_TYPE_CONFIG[option].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, styles.goalFormLabel]}>Target value</Text>
              <TextInput
                value={goalTargetValue}
                onChangeText={setGoalTargetValue}
                placeholder={GOAL_TYPE_CONFIG[goalType].unit === 'workouts' ? '3' : '150'}
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                style={styles.textInput}
              />

              <Text style={[styles.inputLabel, styles.goalFormLabel]}>Notes (optional)</Text>
              <TextInput
                value={goalNotes}
                onChangeText={setGoalNotes}
                placeholder="Add any context, focus, or milestones"
                placeholderTextColor="#A0A0A0"
                style={[styles.textInput, styles.multilineInput]}
                multiline
                numberOfLines={3}
              />

              <View style={styles.goalFormActions}>
                <TouchableOpacity style={[styles.goalFormButton, styles.goalFormCancel]} onPress={handleCancelGoal}>
                  <Text style={styles.goalFormCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.goalFormButton, styles.goalFormSubmit]} onPress={handleSaveGoal}>
                  <Text style={styles.goalFormSubmitText}>Save Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.goalList}>
            {goals.length ? (
              goals.map(renderGoalCard)
            ) : (
              <View style={styles.goalEmptyState}>
                <Text style={styles.goalEmptyTitle}>No goals yet</Text>
                <Text style={styles.goalEmptySubtitle}>
                  Create your first goal to stay accountable to your training targets.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Workouts This Week</Text>
            <Text style={styles.summaryValue}>{completedThisWeek}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Active Minutes</Text>
            <Text style={styles.summaryValue}>{totalMinutes}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Current Streak</Text>
            <Text style={styles.summaryValue}>{currentStreak}🔥</Text>
          </View>
        </View>

        <View style={styles.planSection}>
          <Text style={styles.sectionTitle}>Log a Workout</Text>
          <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Workout name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Upper body push"
                placeholderTextColor="#A0A0A0"
                style={styles.textInput}
              />
            </View>
            <View style={[styles.inputGroup, styles.durationInput]}>
              <Text style={styles.inputLabel}>Duration (min)</Text>
              <TextInput
                value={duration}
                onChangeText={setDuration}
                placeholder="45"
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>
          </View>

          <View style={styles.selectorRow}>
            <View style={styles.selectorGroup}>
              <Text style={styles.inputLabel}>Intensity</Text>
              <View style={styles.pillRow}>
                {(['Low', 'Medium', 'High'] as WorkoutEntry['intensity'][]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setSelectedIntensity(option)}
                    style={[
                      styles.pill,
                      selectedIntensity === option && [styles.pillActive, { borderColor: intensityColors[option] }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        selectedIntensity === option ? styles.pillTextActive : null,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.selectorGroup}>
              <Text style={styles.inputLabel}>Focus</Text>
              <View style={styles.pillRow}>
                {(['Strength', 'Cardio', 'Mobility'] as WorkoutEntry['focus'][]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setSelectedFocus(option)}
                    style={[
                      styles.pill,
                      selectedFocus === option ? styles.pillActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        selectedFocus === option ? styles.pillTextActive : null,
                      ]}
                    >
                      {focusIcons[option]} {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional highlights, focus points, or PBs"
              placeholderTextColor="#A0A0A0"
              style={[styles.textInput, styles.multilineInput]}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddWorkout}>
            <Text style={styles.addButtonText}>Save Workout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>This Week's Log</Text>
          <FlatList
            data={sortedWorkouts}
            keyExtractor={(item) => item.id}
            renderItem={renderWorkoutCard}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No workouts yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add your first session to start tracking your weekly progress.
                </Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: '#F0FFF0',
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: '#228B22',
    fontWeight: '500',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#228B22',
  },
  goalsSection: {
    marginTop: 24,
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalsSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#5F875F',
  },
  newGoalButton: {
    backgroundColor: '#228B22',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  newGoalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  goalForm: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8FFF8',
    borderWidth: 1,
    borderColor: '#D6E8D6',
    gap: 12,
  },
  goalFormLabel: {
    marginTop: 4,
  },
  goalFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  goalFormButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  goalFormCancel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6E8D6',
  },
  goalFormSubmit: {
    backgroundColor: '#228B22',
  },
  goalFormCancelText: {
    color: '#4A774A',
    fontWeight: '600',
  },
  goalFormSubmitText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  goalList: {
    gap: 16,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2F0E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 3,
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F4F2F',
  },
  goalMeta: {
    marginTop: 6,
    fontSize: 14,
    color: '#708070',
  },
  goalStatusPill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  goalStatusText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  goalNotes: {
    fontSize: 14,
    color: '#4F5C4F',
    lineHeight: 20,
    marginBottom: 12,
  },
  goalProgressBarBackground: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E6F0E6',
    overflow: 'hidden',
    marginBottom: 12,
  },
  goalProgressBarFill: {
    height: '100%',
  },
  goalProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalProgressText: {
    fontSize: 14,
    color: '#4F5C4F',
    fontWeight: '600',
  },
  goalActionButton: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D6E8D6',
    backgroundColor: '#FFFFFF',
  },
  goalActionButtonText: {
    color: '#228B22',
    fontWeight: '600',
    fontSize: 13,
  },
  goalDate: {
    marginTop: 12,
    fontSize: 12,
    color: '#708070',
  },
  goalEmptyState: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#F8FFF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D6E8D6',
  },
  goalEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F4F2F',
  },
  goalEmptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#708070',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7A9E7A',
    marginBottom: 8,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#228B22',
  },
  planSection: {
    marginTop: 32,
    marginHorizontal: 24,
    backgroundColor: '#F8FFF8',
    borderRadius: 20,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#228B22',
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#228B22',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2F2F2F',
    borderWidth: 1,
    borderColor: '#D6E8D6',
  },
  durationInput: {
    maxWidth: 140,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  selectorGroup: {
    flex: 1,
    minWidth: 160,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D6E8D6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  pillActive: {
    backgroundColor: '#E6F6E6',
  },
  pillText: {
    fontSize: 14,
    color: '#4A774A',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#228B22',
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  addButton: {
    marginTop: 8,
    backgroundColor: '#228B22',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  workoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F4F2F',
  },
  workoutMeta: {
    marginTop: 4,
    fontSize: 14,
    color: '#708070',
  },
  statusPill: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  statusPillCompleted: {
    backgroundColor: '#D8F3DC',
  },
  statusPillPlanned: {
    backgroundColor: '#FFF4D6',
  },
  statusTextCompleted: {
    color: '#2D6A4F',
    fontWeight: '700',
  },
  statusTextPlanned: {
    color: '#B97A1D',
    fontWeight: '700',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E6F0E6',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  workoutNotes: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#4F5C4F',
  },
  separator: {
    height: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F5C4F',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    color: '#718271',
  },
});
