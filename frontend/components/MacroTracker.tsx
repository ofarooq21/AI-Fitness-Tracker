import React, { useState } from 'react';
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

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  time: string;
}

interface MacroTrackerProps {
  onBackToHome: () => void;
}

export default function MacroTracker({ onBackToHome }: MacroTrackerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState({
    name: '',
    calories: '',
    protein: ''
  });

  const addMeal = () => {
    if (!newMeal.name || !newMeal.calories || !newMeal.protein) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const meal: Meal = {
      id: Date.now().toString(),
      name: newMeal.name,
      calories: parseInt(newMeal.calories),
      protein: parseInt(newMeal.protein),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMeals([...meals, meal]);
    setNewMeal({ name: '', calories: '', protein: '' });
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToHome} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>🥬 Macro Tracker</Text>
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

        {/* Daily Totals */}
        <View style={styles.totalsSection}>
          <Text style={styles.sectionTitle}>Daily Totals</Text>
          <View style={styles.totalsContainer}>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{getTotalCalories()}</Text>
              <Text style={styles.totalLabel}>Calories</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{getTotalProtein()}g</Text>
              <Text style={styles.totalLabel}>Protein</Text>
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
                </View>
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
            <Text style={styles.modalTitle}>Add New Meal</Text>
            
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

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddMeal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={addMeal}
              >
                <Text style={styles.saveButtonText}>Add Meal</Text>
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
  dateSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#228B22',
    marginBottom: 12,
  },
  dateInput: {
    backgroundColor: '#F8FFF8',
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
    backgroundColor: '#F8FFF8',
    borderRadius: 12,
    padding: 20,
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#228B22',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  addMealButton: {
    backgroundColor: '#228B22',
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
    backgroundColor: '#F8FFF8',
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
    color: '#228B22',
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
    color: '#228B22',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#228B22',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FFF8',
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
    backgroundColor: '#228B22',
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
});
