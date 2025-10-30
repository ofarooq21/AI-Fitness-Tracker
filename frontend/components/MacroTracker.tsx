import React, { useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/authService';
import { 
  getTotalCalories as utilsTotalCalories,
  getTotalProtein as utilsTotalProtein,
  getTotalFat as utilsTotalFat,
  getTotalCarbs as utilsTotalCarbs,
  getGoalProgress as utilsGoalProgress,
  getDaysRemaining as utilsDaysRemaining,
  validateMealDraft,
  formatDisplayDate,
} from '../utils/macroUtils';

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  time: string;
}

interface MacroGoal {
  id: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  startDate: string;
  endDate: string;
  duration: number; // in days
}

interface MacroTrackerProps {
  onBackToHome: () => void;
}

export default function MacroTracker({ onBackToHome }: MacroTrackerProps) {
  const [userId, setUserId] = useState<string>('guest');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  useEffect(() => {
    AuthService.getCurrentUser().then(u => setUserId(u?.id || 'guest')).catch(() => setUserId('guest'));
  }, []);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<MacroGoal | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [newMeal, setNewMeal] = useState({
    name: '',
    calories: '',
    protein: '',
    fat: '',
    carbs: ''
  });
  const [newGoal, setNewGoal] = useState({
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    duration: '30' // default 30 days
  });

  const addMeal = () => {
    const errors = validateMealDraft(newMeal as any);
    if (errors.length) {
      Alert.alert('Error', errors[0]);
      return;
    }

    const meal: Meal = {
      id: Date.now().toString(),
      name: newMeal.name,
      calories: parseInt(newMeal.calories),
      protein: parseInt(newMeal.protein),
      fat: parseInt(newMeal.fat),
      carbs: parseInt(newMeal.carbs),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMeals([...meals, meal]);
    setNewMeal({ name: '', calories: '', protein: '', fat: '', carbs: '' });
    setShowAddMeal(false);
  };

  // Persistence per selected date
  const STORAGE_MEALS_KEY = (date: string) => `macro_meals_${userId}_${date}`;
  const STORAGE_GOAL_KEY = (date: string) => `macro_goal_${userId}_${date}`;

  useEffect(() => {
    const load = async () => {
      try {
        const [mealsJson, goalJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_MEALS_KEY(selectedDate)),
          AsyncStorage.getItem(STORAGE_GOAL_KEY(selectedDate)),
        ]);
        setMeals(mealsJson ? JSON.parse(mealsJson) : []);
        setCurrentGoal(goalJson ? JSON.parse(goalJson) : null);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, [selectedDate]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_MEALS_KEY(selectedDate), JSON.stringify(meals)).catch(() => {});
  }, [meals, selectedDate]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_GOAL_KEY(selectedDate), JSON.stringify(currentGoal)).catch(() => {});
  }, [currentGoal, selectedDate]);

  const startEditMeal = (id: string) => {
    const m = meals.find(x => x.id === id);
    if (!m) return;
    setEditingMealId(id);
    setNewMeal({
      name: m.name,
      calories: String(m.calories),
      protein: String(m.protein),
      fat: String(m.fat),
      carbs: String(m.carbs),
    });
    setShowAddMeal(true);
  };

  const saveEditMeal = () => {
    const errors = validateMealDraft(newMeal as any);
    if (errors.length) {
      Alert.alert('Error', errors[0]);
      return;
    }
    if (!editingMealId) return;
    const updated = meals.map(m => m.id === editingMealId ? {
      ...m,
      name: newMeal.name,
      calories: parseInt(newMeal.calories),
      protein: parseInt(newMeal.protein),
      fat: parseInt(newMeal.fat),
      carbs: parseInt(newMeal.carbs),
    } : m);
    setMeals(updated);
    setEditingMealId(null);
    setNewMeal({ name: '', calories: '', protein: '', fat: '', carbs: '' });
    setShowAddMeal(false);
  };

  const deleteMeal = (id: string) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setMeals(meals.filter(meal => meal.id !== id))
        }
      ]
    );
  };

  const getTotalCalories = () => {
    return meals.reduce((total, meal) => total + meal.calories, 0);
  };

  const getTotalProtein = () => {
    return meals.reduce((total, meal) => total + meal.protein, 0);
  };

  const getTotalFat = () => {
    return meals.reduce((total, meal) => total + meal.fat, 0);
  };

  const getTotalCarbs = () => {
    return meals.reduce((total, meal) => total + meal.carbs, 0);
  };

  const addGoal = () => {
    if (!newGoal.calories || !newGoal.protein || !newGoal.fat || !newGoal.carbs || !newGoal.duration) {
      Alert.alert('Error', 'Please fill in all goal fields');
      return;
    }

    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(newGoal.duration));
    const endDateString = endDate.toISOString().split('T')[0];

    const goal: MacroGoal = {
      id: Date.now().toString(),
      calories: parseInt(newGoal.calories),
      protein: parseInt(newGoal.protein),
      fat: parseInt(newGoal.fat),
      carbs: parseInt(newGoal.carbs),
      startDate,
      endDate: endDateString,
      duration: parseInt(newGoal.duration)
    };

    setCurrentGoal(goal);
    setNewGoal({ calories: '', protein: '', fat: '', carbs: '', duration: '30' });
    setShowGoalModal(false);
    Alert.alert('Success', 'Goal set successfully!');
  };

  const clearGoal = () => {
    Alert.alert(
      'Clear Goal',
      'Are you sure you want to clear your current goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setCurrentGoal(null);
            Alert.alert('Goal Cleared', 'Your goal has been cleared.');
          }
        }
      ]
    );
  };

  const getGoalProgress = (current: number, target: number) => utilsGoalProgress(current, target);
  const getDaysRemaining = () => utilsDaysRemaining(currentGoal as any);

  const formatDate = (dateString: string) => formatDisplayDate(dateString);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToHome} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>🥗 Macro Tracker</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Date Selection */}
        <View style={styles.dateSection}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TextInput
            style={styles.dateInput}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="YYYY-MM-DD"
          />
          <Text style={styles.dateDisplay}>{formatDate(selectedDate)}</Text>
        </View>

        {/* Goal Section */}
        <View style={styles.goalSection}>
          <View style={styles.goalHeader}>
            <Text style={styles.sectionTitle}>Macro Goals</Text>
            <View style={styles.goalButtons}>
              <TouchableOpacity 
                style={styles.goalButton}
                onPress={() => setShowGoalModal(true)}
              >
                <Text style={styles.goalButtonText}>🎯 Set Goal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.clearDayButton}
                onPress={() => {
                  Alert.alert('Clear Day', 'Remove all meals for this day?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: () => setMeals([]) },
                  ]);
                }}
              >
                <Text style={styles.clearDayButtonText}>Clear Day</Text>
              </TouchableOpacity>
              {currentGoal && (
                <TouchableOpacity 
                  style={styles.clearGoalButton}
                  onPress={clearGoal}
                >
                  <Text style={styles.clearGoalButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {currentGoal ? (
            <View style={styles.goalInfo}>
              <Text style={styles.goalDuration}>
                {getDaysRemaining()} days remaining
              </Text>
              <Text style={styles.goalEndDate}>
                Ends: {formatDate(currentGoal.endDate)}
              </Text>
            </View>
          ) : (
            <Text style={styles.noGoalText}>No goal set. Tap "Set Goal" to create one!</Text>
          )}
        </View>

        {/* Daily Totals */}
        <View style={styles.totalsSection}>
          <Text style={styles.sectionTitle}>Daily Totals</Text>
          <View style={styles.totalsContainer}>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{getTotalCalories()}</Text>
              <Text style={styles.totalLabel}>Calories</Text>
              {currentGoal && (
                <>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getGoalProgress(utilsTotalCalories(meals), currentGoal.calories)}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {getGoalProgress(utilsTotalCalories(meals), currentGoal.calories).toFixed(0)}% of {currentGoal.calories}
                  </Text>
                </>
              )}
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{utilsTotalProtein(meals)}g</Text>
              <Text style={styles.totalLabel}>Protein</Text>
              {currentGoal && (
                <>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getGoalProgress(utilsTotalProtein(meals), currentGoal.protein)}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {getGoalProgress(utilsTotalProtein(meals), currentGoal.protein).toFixed(0)}% of {currentGoal.protein}g
                  </Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.totalsContainer}>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{utilsTotalFat(meals)}g</Text>
              <Text style={styles.totalLabel}>Fat</Text>
              {currentGoal && (
                <>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getGoalProgress(utilsTotalFat(meals), currentGoal.fat)}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {getGoalProgress(utilsTotalFat(meals), currentGoal.fat).toFixed(0)}% of {currentGoal.fat}g
                  </Text>
                </>
              )}
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{utilsTotalCarbs(meals)}g</Text>
              <Text style={styles.totalLabel}>Carbs</Text>
              {currentGoal && (
                <>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getGoalProgress(utilsTotalCarbs(meals), currentGoal.carbs)}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {getGoalProgress(utilsTotalCarbs(meals), currentGoal.carbs).toFixed(0)}% of {currentGoal.carbs}g
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Add Meal Button */}
        <TouchableOpacity 
          style={styles.addMealButton} 
          onPress={() => setShowAddMeal(true)}
        >
          <Text style={styles.addMealButtonText}>+ Add Meal</Text>
        </TouchableOpacity>

        {/* Meals List */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>Meals ({meals.length})</Text>
          {meals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No meals logged yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap "Add Meal" to get started</Text>
            </View>
          ) : (
            meals.map((meal) => (
              <View key={meal.id} style={styles.mealItem}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
                <View style={styles.mealMacros}>
                  <Text style={styles.macroText}>{meal.calories} cal</Text>
                  <Text style={styles.macroText}>{meal.protein}g protein</Text>
                  <Text style={styles.macroText}>{meal.fat}g fat</Text>
                  <Text style={styles.macroText}>{meal.carbs}g carbs</Text>
                </View>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => startEditMeal(meal.id)}
                >
                  <Text style={styles.editButtonText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteMeal(meal.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMeal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMeal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingMealId ? 'Edit Meal' : 'Add New Meal'}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Meal Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Grilled Chicken Breast"
                value={newMeal.name}
                onChangeText={(text) => setNewMeal({...newMeal, name: text})}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Calories</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 250"
                value={newMeal.calories}
                onChangeText={(text) => setNewMeal({...newMeal, calories: text})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Protein (grams)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 30"
                value={newMeal.protein}
                onChangeText={(text) => setNewMeal({...newMeal, protein: text})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Fat (grams)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 15"
                value={newMeal.fat}
                onChangeText={(text) => setNewMeal({...newMeal, fat: text})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Carbs (grams)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 45"
                value={newMeal.carbs}
                onChangeText={(text) => setNewMeal({...newMeal, carbs: text})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddMeal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={editingMealId ? saveEditMeal : addMeal}
              >
                <Text style={styles.saveButtonText}>{editingMealId ? 'Save Changes' : 'Add Meal'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal Setting Modal */}
      <Modal
        visible={showGoalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Macro Goals</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Daily Calories</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2000"
                value={newGoal.calories}
                onChangeText={(text) => setNewGoal({...newGoal, calories: text})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Daily Protein (grams)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 150"
                value={newGoal.protein}
                onChangeText={(text) => setNewGoal({...newGoal, protein: text})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Daily Fat (grams)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 65"
                value={newGoal.fat}
                onChangeText={(text) => setNewGoal({...newGoal, fat: text})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Daily Carbs (grams)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 250"
                value={newGoal.carbs}
                onChangeText={(text) => setNewGoal({...newGoal, carbs: text})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Goal Duration (days)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 30"
                value={newGoal.duration}
                onChangeText={(text) => setNewGoal({...newGoal, duration: text})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={addGoal}
              >
                <Text style={styles.saveButtonText}>Set Goal</Text>
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
    backgroundColor: '#F2F6FF',
  },
  backButton: {
    marginRight: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '500',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  dateInput: {
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  dateDisplay: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
  },
  totalsSection: {
    marginBottom: 20,
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  addMealButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  addMealButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mealsSection: {
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
  mealItem: {
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
    color: '#666666',
  },
  mealMacros: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  macroText: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '500',
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  editButtonText: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  saveButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Goal-related styles
  goalSection: {
    marginBottom: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  goalButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  goalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  clearDayButton: {
    backgroundColor: '#EAF2FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  clearDayButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  clearGoalButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearGoalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  goalInfo: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  goalDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  goalEndDate: {
    fontSize: 14,
    color: '#666666',
  },
  noGoalText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    textAlign: 'center',
  },
});
