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

interface WorkoutTrackerPageProps {
  onBack: () => void;
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
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedIntensity, setSelectedIntensity] = useState<WorkoutEntry['intensity']>('Medium');
  const [selectedFocus, setSelectedFocus] = useState<WorkoutEntry['focus']>('Strength');

  const { completedThisWeek, totalMinutes, currentStreak } = useMemo(() => {
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
