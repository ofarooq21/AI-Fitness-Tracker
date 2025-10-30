import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Alert,
  Modal
} from 'react-native';

interface Exercise {
  id: string;
  name: string;
  category: string;
}

interface Set {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  sets: Set[];
  notes?: string;
}

interface WorkoutSession {
  id: string;
  name: string;
  date: string;
  duration: number; // in minutes
  exercises: WorkoutExercise[];
  totalSets: number;
  totalVolume: number; // total weight lifted
}

interface WorkoutTrackerProps {
  onBackToHome: () => void;
  userId?: string;
}

const EXERCISE_CATEGORIES = [
  { name: 'Chest', exercises: ['Bench Press', 'Incline Press', 'Push-ups', 'Chest Fly'] },
  { name: 'Back', exercises: ['Deadlift', 'Pull-ups', 'Rows', 'Lat Pulldown'] },
  { name: 'Shoulders', exercises: ['Overhead Press', 'Lateral Raises', 'Rear Delt Fly'] },
  { name: 'Arms', exercises: ['Bicep Curls', 'Tricep Dips', 'Hammer Curls'] },
  { name: 'Legs', exercises: ['Squats', 'Lunges', 'Leg Press', 'Calf Raises'] },
  { name: 'Core', exercises: ['Planks', 'Crunches', 'Russian Twists'] },
  { name: 'Cardio', exercises: ['Running', 'Cycling', 'Rowing', 'Swimming'] }
];

export default function WorkoutTracker({ onBackToHome, userId }: WorkoutTrackerProps) {
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSession | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [workoutName, setWorkoutName] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [statsTab, setStatsTab] = useState<'local' | 'forecast'>('local');
  const [forecastUserId, setForecastUserId] = useState(userId || 'demo');
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<Array<{
    exercise_name: string;
    current_1rm_kg: number;
    target_1rm_kg: number;
    estimated_completion_date?: string | null;
    confidence_score?: number | null;
  }>>([]);

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  // Keep forecast user id in sync with prop changes
  useEffect(() => {
    if (userId && userId !== forecastUserId) {
      setForecastUserId(userId);
    }
  }, [userId]);

  const loadWorkoutHistory = () => {
    // In a real app, this would load from backend
    // For now, we'll use some sample data
    const sampleWorkouts: WorkoutSession[] = [
      {
        id: '1',
        name: 'Upper Body Strength',
        date: new Date().toISOString().split('T')[0],
        duration: 45,
        totalSets: 12,
        totalVolume: 2500,
        exercises: [
          {
            id: '1',
            exercise: { id: '1', name: 'Bench Press', category: 'Chest' },
            sets: [
              { id: '1', reps: 10, weight: 135, completed: true },
              { id: '2', reps: 8, weight: 155, completed: true },
              { id: '3', reps: 6, weight: 175, completed: true }
            ]
          }
        ]
      }
    ];
    setWorkoutHistory(sampleWorkouts);
  };

  const startNewWorkout = () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    const newWorkout: WorkoutSession = {
      id: Date.now().toString(),
      name: workoutName,
      date: new Date().toISOString().split('T')[0],
      duration: 0,
      exercises: [],
      totalSets: 0,
      totalVolume: 0
    };

    setCurrentWorkout(newWorkout);
    setStartTime(new Date());
    setWorkoutName('');
  };

  const finishWorkout = () => {
    if (!currentWorkout) return;

    const endTime = new Date();
    const duration = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) : 0;

    const updatedWorkout = {
      ...currentWorkout,
      duration,
      totalSets: currentWorkout.exercises.reduce((total, ex) => total + ex.sets.length, 0),
      totalVolume: currentWorkout.exercises.reduce((total, ex) => 
        total + ex.sets.reduce((setTotal, set) => setTotal + (set.reps * set.weight), 0), 0
      )
    };

    setWorkoutHistory([updatedWorkout, ...workoutHistory]);
    setCurrentWorkout(null);
    setStartTime(null);
    Alert.alert('Success', `Workout completed! Duration: ${duration} minutes`);
  };

  // Weekly summary derived from workoutHistory
  const weeklySummary = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    // Align to Monday
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

    const completedDates = new Set(
      workoutHistory.map((w) => new Date(w.date).toDateString()),
    );
    let currentStreak = 0;
    const checkDate = new Date(now);
    checkDate.setHours(0, 0, 0, 0);
    while (completedDates.has(checkDate.toDateString())) {
      currentStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return { completedThisWeek, totalMinutes, currentStreak };
  }, [workoutHistory]);

  // Local trends (simple) – total volume by date
  const localTrends = useMemo(() => {
    const map: Record<string, { volume: number; sets: number }> = {};
    for (const w of workoutHistory) {
      const key = new Date(w.date).toISOString().split('T')[0];
      map[key] = map[key] || { volume: 0, sets: 0 };
      map[key].volume += w.totalVolume || 0;
      map[key].sets += w.totalSets || 0;
    }
    const entries = Object.entries(map)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-10); // last 10 days
    const maxVolume = entries.reduce((m, [, v]) => Math.max(m, v.volume), 0) || 1;
    return { entries, maxVolume };
  }, [workoutHistory]);

  const fetchForecast = async () => {
    try {
      setForecastLoading(true);
      setForecastError(null);
      setForecastData([]);
      const resp = await fetch(`http://localhost:8000/workouts/users/${encodeURIComponent(forecastUserId)}/workouts/forecast`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = await resp.json();
      setForecastData(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setForecastError(e?.message || 'Failed to load forecast');
    } finally {
      setForecastLoading(false);
    }
  };

  const addExercise = () => {
    if (!selectedExercise || !currentWorkout) return;

    const exercise: Exercise = {
      id: Date.now().toString(),
      name: selectedExercise,
      category: selectedCategory
    };

    const workoutExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exercise,
      sets: [{
        id: Date.now().toString(),
        reps: 0,
        weight: 0,
        completed: false
      }]
    };

    setCurrentWorkout({
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, workoutExercise]
    });

    setSelectedExercise('');
    setSelectedCategory('');
    setShowAddExercise(false);
  };

  const addSet = (exerciseId: string) => {
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newSet: Set = {
          id: Date.now().toString(),
          reps: 0,
          weight: 0,
          completed: false
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    });

    setCurrentWorkout({ ...currentWorkout, exercises: updatedExercises });
  };

  const updateSet = (exerciseId: string, setId: string, field: 'reps' | 'weight', value: number) => {
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map(ex => {
      if (ex.id === exerciseId) {
        const updatedSets = ex.sets.map(set => 
          set.id === setId ? { ...set, [field]: value } : set
        );
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    setCurrentWorkout({ ...currentWorkout, exercises: updatedExercises });
  };

  const toggleSetComplete = (exerciseId: string, setId: string) => {
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map(ex => {
      if (ex.id === exerciseId) {
        const updatedSets = ex.sets.map(set => 
          set.id === setId ? { ...set, completed: !set.completed } : set
        );
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    setCurrentWorkout({ ...currentWorkout, exercises: updatedExercises });
  };

  const removeExercise = (exerciseId: string) => {
    if (!currentWorkout) return;

    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedExercises = currentWorkout.exercises.filter(ex => ex.id !== exerciseId);
            setCurrentWorkout({ ...currentWorkout, exercises: updatedExercises });
          }
        }
      ]
    );
  };

  const getWorkoutDuration = () => {
    if (!startTime) return 0;
    const now = new Date();
    return Math.round((now.getTime() - startTime.getTime()) / 60000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToHome} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>🏋️ Workout Tracker</Text>
      </View>

      <ScrollView style={styles.content}>
        {!currentWorkout ? (
          // Workout Selection/History View
          <View>
            {/* Start New Workout */}
            <View style={styles.startWorkoutSection}>
              <Text style={styles.sectionTitle}>Start New Workout</Text>
              <TextInput
                style={styles.workoutNameInput}
                placeholder="Enter workout name (e.g., Upper Body Strength)"
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.startButton} onPress={startNewWorkout}>
                <Text style={styles.startButtonText}>Start Workout</Text>
              </TouchableOpacity>
            </View>

            {/* Workout History */}
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Recent Workouts</Text>
              {workoutHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No workouts yet</Text>
                  <Text style={styles.emptyStateSubtext}>Start your first workout above</Text>
                </View>
              ) : (
                workoutHistory.map((workout) => (
                  <View key={workout.id} style={styles.workoutCard}>
                    <View style={styles.workoutHeader}>
                      <Text style={styles.workoutName}>{workout.name}</Text>
                      <Text style={styles.workoutDate}>{workout.date}</Text>
                    </View>
                    <View style={styles.workoutStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{workout.duration}m</Text>
                        <Text style={styles.statLabel}>Duration</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{workout.totalSets}</Text>
                        <Text style={styles.statLabel}>Sets</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{workout.totalVolume}lbs</Text>
                        <Text style={styles.statLabel}>Volume</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : (
          // Active Workout View
          <View>
            {/* Workout Header */}
            <View style={styles.activeWorkoutHeader}>
              <Text style={styles.workoutTitle}>{currentWorkout.name}</Text>
              <Text style={styles.workoutDuration}>Duration: {getWorkoutDuration()}m</Text>
            </View>

            {/* Exercises */}
            <View style={styles.exercisesSection}>
              <View style={styles.exercisesHeader}>
                <Text style={styles.sectionTitle}>Exercises ({currentWorkout.exercises.length})</Text>
                <TouchableOpacity 
                  style={styles.addExerciseButton}
                  onPress={() => setShowAddExercise(true)}
                >
                  <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
                </TouchableOpacity>
              </View>

              {currentWorkout.exercises.map((workoutExercise) => (
                <View key={workoutExercise.id} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{workoutExercise.exercise.name}</Text>
                    <TouchableOpacity 
                      style={styles.removeExerciseButton}
                      onPress={() => removeExercise(workoutExercise.id)}
                    >
                      <Text style={styles.removeExerciseButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.setsContainer}>
                    {workoutExercise.sets.map((set, index) => {
                      const isCardio = (workoutExercise.exercise.category || '').toLowerCase() === 'cardio';
                      return (
                        <View key={set.id} style={styles.setRow}>
                          <Text style={styles.setNumber}>Set {index + 1}</Text>
                          {isCardio ? (
                            <>
                              <TextInput
                                style={styles.setInput}
                                placeholder="Distance (km)"
                                value={(Number.isFinite(set.weight) ? set.weight : 0).toString()}
                                onChangeText={(text) => updateSet(workoutExercise.id, set.id, 'weight', parseFloat(text) || 0)}
                                keyboardType="numeric"
                              />
                              <TextInput
                                style={styles.setInput}
                                placeholder="Time (min)"
                                value={(Number.isFinite(set.reps) ? set.reps : 0).toString()}
                                onChangeText={(text) => updateSet(workoutExercise.id, set.id, 'reps', parseInt(text) || 0)}
                                keyboardType="numeric"
                              />
                            </>
                          ) : (
                            <>
                              <TextInput
                                style={styles.setInput}
                                placeholder="Reps"
                                value={set.reps.toString()}
                                onChangeText={(text) => updateSet(workoutExercise.id, set.id, 'reps', parseInt(text) || 0)}
                                keyboardType="numeric"
                              />
                              <TextInput
                                style={styles.setInput}
                                placeholder="Weight"
                                value={set.weight.toString()}
                                onChangeText={(text) => updateSet(workoutExercise.id, set.id, 'weight', parseInt(text) || 0)}
                                keyboardType="numeric"
                              />
                            </>
                          )}
                          <TouchableOpacity
                            style={[styles.completeButton, set.completed && styles.completeButtonActive]}
                            onPress={() => toggleSetComplete(workoutExercise.id, set.id)}
                          >
                            <Text style={styles.completeButtonText}>✓</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                    <TouchableOpacity 
                      style={styles.addSetButton}
                      onPress={() => addSet(workoutExercise.id)}
                    >
                      <Text style={styles.addSetButtonText}>+ Add Set</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {currentWorkout.exercises.length === 0 && (
                <View style={styles.emptyExercises}>
                  <Text style={styles.emptyExercisesText}>No exercises added yet</Text>
                  <Text style={styles.emptyExercisesSubtext}>Tap "Add Exercise" to get started</Text>
                </View>
              )}
            </View>

            {/* Finish Workout */}
            <TouchableOpacity style={styles.finishButton} onPress={finishWorkout}>
              <Text style={styles.finishButtonText}>Finish Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Summary Section */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>This Week's Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Sessions</Text>
            <Text style={styles.summaryValue}>{weeklySummary.completedThisWeek}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Minutes</Text>
            <Text style={styles.summaryValue}>{weeklySummary.totalMinutes}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Streak</Text>
            <Text style={styles.summaryValue}>{weeklySummary.currentStreak}🔥</Text>
          </View>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>This Week's Log</Text>
          {workoutHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No workouts yet</Text>
              <Text style={styles.emptyStateSubtext}>Add a workout to begin your streak.</Text>
            </View>
          ) : (
            workoutHistory
              .filter((w) => {
                const now = new Date();
                const startOfWeek = new Date(now);
                const dayIndex = now.getDay();
                const diffToMonday = dayIndex === 0 ? 6 : dayIndex - 1;
                startOfWeek.setHours(0, 0, 0, 0);
                startOfWeek.setDate(now.getDate() - diffToMonday);
                const d = new Date(w.date);
                return d >= startOfWeek && d <= now;
              })
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((w) => (
                <View key={w.id} style={styles.weekItem}>
                  <View style={styles.weekItemHeader}>
                    <Text style={styles.weekItemTitle}>{w.name}</Text>
                    <Text style={styles.weekItemMeta}>{w.date} • {w.duration}m • {w.totalSets} sets</Text>
                  </View>
                  {w.exercises[0]?.notes ? (
                    <Text style={styles.weekItemNotes}>{w.exercises[0].notes}</Text>
                  ) : null}
                </View>
              ))
          )}
        </View>

        {/* View Progress at Bottom */}
        <TouchableOpacity style={[styles.statsButton, { marginTop: 12 }]} onPress={() => setShowStats(true)}>
          <Text style={styles.statsButtonText}>View Progress</Text>
        </TouchableOpacity>
      </View>

      {/* Stats & Graphs Modal */}
      <Modal
        visible={showStats}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStats(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 520 }]}>
            <Text style={styles.modalTitle}>Training Progress</Text>

            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabButton, statsTab === 'local' && styles.tabButtonActive]}
                onPress={() => setStatsTab('local')}
              >
                <Text style={[styles.tabText, statsTab === 'local' && styles.tabTextActive]}>Local Trends</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, statsTab === 'forecast' && styles.tabButtonActive]}
                onPress={() => setStatsTab('forecast')}
              >
                <Text style={[styles.tabText, statsTab === 'forecast' && styles.tabTextActive]}>Forecast</Text>
              </TouchableOpacity>
            </View>

            {statsTab === 'local' ? (
              <View>
                <Text style={styles.inputLabel}>Volume (last 10 days)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={styles.chartRow}>
                    {localTrends.entries.map(([day, v], idx) => {
                      const h = Math.max(4, Math.round((v.volume / localTrends.maxVolume) * 120));
                      return (
                        <View key={day + idx} style={styles.barItem}>
                          <View style={[styles.bar, { height: h }]} />
                          <Text style={styles.barLabel}>{day.slice(5)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Sessions</Text>
                    <Text style={styles.summaryValue}>{weeklySummary.completedThisWeek}</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Minutes</Text>
                    <Text style={styles.summaryValue}>{weeklySummary.totalMinutes}</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Streak</Text>
                    <Text style={styles.summaryValue}>{weeklySummary.currentStreak}🔥</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>User ID</Text>
                <TextInput
                  style={styles.workoutNameInput}
                  value={forecastUserId}
                  onChangeText={setForecastUserId}
                  placeholder="Enter user id"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.startButton} onPress={fetchForecast} disabled={forecastLoading}>
                  <Text style={styles.startButtonText}>{forecastLoading ? 'Loading…' : 'Load Forecast'}</Text>
                </TouchableOpacity>

                {forecastError ? <Text style={{ color: '#B00020', marginTop: 8 }}>{forecastError}</Text> : null}

                <ScrollView style={{ maxHeight: 260, marginTop: 12 }}>
                  {forecastData.length === 0 && !forecastLoading ? (
                    <Text style={{ color: '#666666' }}>No forecast yet. Create workouts and try again.</Text>
                  ) : (
                    forecastData.map((f) => (
                      <View key={f.exercise_name} style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                          <Text style={styles.exerciseName}>{f.exercise_name}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={styles.statLabel}>Current 1RM: <Text style={styles.statValue}>{f.current_1rm_kg?.toFixed?.(1) ?? '-'} kg</Text></Text>
                          <Text style={styles.statLabel}>Target 1RM: <Text style={styles.statValue}>{f.target_1rm_kg?.toFixed?.(1) ?? '-'} kg</Text></Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                          <Text style={styles.statLabel}>ETA: <Text style={styles.statValue}>{f.estimated_completion_date ? new Date(f.estimated_completion_date).toDateString() : '—'}</Text></Text>
                          <Text style={styles.statLabel}>Confidence: <Text style={styles.statValue}>{f.confidence_score != null ? Math.round((f.confidence_score || 0) * 100) + '%' : '—'}</Text></Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowStats(false)}>
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddExercise}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddExercise(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            
            <View style={styles.categoryContainer}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {EXERCISE_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.name}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.name && styles.categoryButtonActive
                    ]}
                    onPress={() => setSelectedCategory(category.name)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      selectedCategory === category.name && styles.categoryButtonTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {selectedCategory && (
              <View style={styles.exerciseContainer}>
                <Text style={styles.inputLabel}>Exercise</Text>
                <ScrollView style={styles.exerciseList}>
                  {EXERCISE_CATEGORIES
                    .find(cat => cat.name === selectedCategory)
                    ?.exercises.map((exercise) => (
                      <TouchableOpacity
                        key={exercise}
                        style={[
                          styles.exerciseButton,
                          selectedExercise === exercise && styles.exerciseButtonActive
                        ]}
                        onPress={() => setSelectedExercise(exercise)}
                      >
                        <Text style={[
                          styles.exerciseButtonText,
                          selectedExercise === exercise && styles.exerciseButtonTextActive
                        ]}>
                          {exercise}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddExercise(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.addButton, (!selectedExercise) && styles.addButtonDisabled]}
                onPress={addExercise}
                disabled={!selectedExercise}
              >
                <Text style={styles.addButtonText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#F0FFF0',
  },
  backButton: {
    marginRight: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#228B22',
    fontWeight: '500',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#228B22',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  startWorkoutSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#228B22',
    marginBottom: 12,
  },
  workoutNameInput: {
    backgroundColor: '#F8FFF8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#228B22',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  historySection: {
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
  },
  workoutCard: {
    backgroundColor: '#F8FFF8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  workoutDate: {
    fontSize: 14,
    color: '#666666',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#228B22',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  activeWorkoutHeader: {
    backgroundColor: '#F8FFF8',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#228B22',
    marginBottom: 4,
  },
  workoutDuration: {
    fontSize: 16,
    color: '#666666',
  },
  exercisesSection: {
    marginBottom: 20,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addExerciseButton: {
    backgroundColor: '#228B22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addExerciseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseCard: {
    backgroundColor: '#F8FFF8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  removeExerciseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeExerciseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setsContainer: {
    marginTop: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  setNumber: {
    fontSize: 14,
    color: '#666666',
    width: 60,
  },
  setInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    fontSize: 14,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  completeButtonActive: {
    backgroundColor: '#228B22',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addSetButton: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addSetButtonText: {
    color: '#228B22',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyExercisesText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  emptyExercisesSubtext: {
    fontSize: 14,
    color: '#999999',
  },
  finishButton: {
    backgroundColor: '#228B22',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7A9E7A',
    marginBottom: 6,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#228B22',
  },
  listSection: {
    marginTop: 20,
  },
  weekItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  weekItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  weekItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4F2F',
  },
  weekItemMeta: {
    fontSize: 12,
    color: '#708070',
  },
  weekItemNotes: {
    marginTop: 6,
    fontSize: 13,
    color: '#4F5C4F',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#F0FFF0',
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#4A774A',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#228B22',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 12,
  },
  barItem: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  bar: {
    width: 20,
    backgroundColor: '#228B22',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barLabel: {
    marginTop: 6,
    fontSize: 10,
    color: '#708070',
  },
  statsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 2,
    borderColor: '#228B22',
  },
  statsButtonText: {
    color: '#228B22',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#228B22',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#228B22',
    marginBottom: 8,
  },
  categoryButton: {
    backgroundColor: '#F8FFF8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryButtonActive: {
    backgroundColor: '#228B22',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  exerciseContainer: {
    marginBottom: 20,
  },
  exerciseList: {
    maxHeight: 200,
  },
  exerciseButton: {
    backgroundColor: '#F8FFF8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  exerciseButtonActive: {
    backgroundColor: '#228B22',
  },
  exerciseButtonText: {
    fontSize: 14,
    color: '#333333',
  },
  exerciseButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#228B22',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
