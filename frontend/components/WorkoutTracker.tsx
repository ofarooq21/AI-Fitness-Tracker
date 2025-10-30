import React, { useState, useEffect } from 'react';
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

export default function WorkoutTracker({ onBackToHome }: WorkoutTrackerProps) {
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSession | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [workoutName, setWorkoutName] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

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
                    {workoutExercise.sets.map((set, index) => (
                      <View key={set.id} style={styles.setRow}>
                        <Text style={styles.setNumber}>Set {index + 1}</Text>
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
                        <TouchableOpacity
                          style={[styles.completeButton, set.completed && styles.completeButtonActive]}
                          onPress={() => toggleSetComplete(workoutExercise.id, set.id)}
                        >
                          <Text style={styles.completeButtonText}>✓</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
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

            {/* Finish Workout Button */}
            <TouchableOpacity style={styles.finishButton} onPress={finishWorkout}>
              <Text style={styles.finishButtonText}>Finish Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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
