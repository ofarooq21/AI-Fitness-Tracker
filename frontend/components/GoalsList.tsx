import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GoalsService, GoalOut } from '../services/goalsService';
import { AuthService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyTask, computeDailyProgress, ensureDefaults, toggleCheckboxTask, updateCounterTask } from '../utils/dailyGoalsUtils';
import { showConfirm } from '../utils/webAlert';

const API_BASE_URL = 'http://localhost:8000';

interface GoalsListProps {
  onBack: () => void;
}

export default function GoalsList({ onBack }: GoalsListProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTarget, setNewTaskTarget] = useState('');
  const [newTaskUnit, setNewTaskUnit] = useState('');
  const [userId, setUserId] = useState<string>('guest');

  useEffect(() => {
    AuthService.getCurrentUser().then(u => setUserId(u?.id || 'guest')).catch(() => setUserId('guest'));
  }, []);

  useEffect(() => {
    loadDailyTasks();
  }, [selectedDate, userId]);

  const storageKey = (date: string) => `daily_goals_tasks_${date}`;

  const loadDailyTasks = async () => {
    try {
      // Try to load from backend first if authenticated
      if (userId && userId !== 'guest') {
        try {
          const token = await AuthService.getAuthToken();
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(`${API_BASE_URL}/daily-goals?date=${selectedDate}`, {
            method: 'GET',
            headers,
          });

          if (response.ok) {
            const backendTasks = await response.json();
            
            // Convert backend format to frontend format
            const convertedTasks: DailyTask[] = backendTasks.map((bt: any) => ({
              id: bt.task_id,
              name: bt.label,
              type: bt.type,
              target: bt.target,
              unit: bt.unit,
              value: bt.current,
              done: bt.done,
              isCustom: bt.is_custom,
              backendId: bt.id // Store backend ID for updates/deletes
            }));

            const defaultIds = ['water', 'steps', 'protein', 'workout'];
            const markedTasks = convertedTasks.map(t => ({
              ...t,
              isCustom: t.isCustom !== undefined ? t.isCustom : !defaultIds.includes(t.id)
            }));

            const tasksWithDefaults = ensureDefaults(markedTasks.length > 0 ? markedTasks : undefined);
            setTasks(tasksWithDefaults);
            
            // Also save to local storage as cache
            await AsyncStorage.setItem(storageKey(selectedDate), JSON.stringify(tasksWithDefaults));
            return;
          }
        } catch (error) {
          // Fall back to local storage if backend fails
        }
      }

      // Fallback: Load from local storage
      const json = await AsyncStorage.getItem(storageKey(selectedDate));
      const arr: DailyTask[] | null = json ? JSON.parse(json) : null;
      
      const defaultIds = ['water', 'steps', 'protein', 'workout'];
      const markedTasks = arr?.map(t => ({
        ...t,
        isCustom: t.isCustom !== undefined ? t.isCustom : !defaultIds.includes(t.id)
      })) || undefined;
      
      setTasks(ensureDefaults(markedTasks));
      
      if (markedTasks && markedTasks.length > 0) {
        await AsyncStorage.setItem(storageKey(selectedDate), JSON.stringify(markedTasks));
      }
    } catch (e) {
      setTasks(ensureDefaults(undefined));
    }
  };

  const saveDailyTasks = async (next: DailyTask[]) => {
    setTasks(next);
    
    // Save to local storage immediately
    await AsyncStorage.setItem(storageKey(selectedDate), JSON.stringify(next));

    // Sync to backend if authenticated
    if (userId && userId !== 'guest') {
      try {
        const token = await AuthService.getAuthToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Convert tasks to backend format
        const backendTasks = next.map(task => ({
          user_id: userId,
          date: selectedDate,
          task_id: task.id,
          label: task.name,
          type: task.type,
          target: task.target || null,
          unit: task.unit || null,
          current: task.type === 'counter' ? (task.value || 0) : 0,
          done: task.type === 'checkbox' ? (task.done || false) : false,
          is_custom: task.isCustom || false
        }));

        // Bulk create/update (pass date as query parameter)
        const response = await fetch(`${API_BASE_URL}/daily-goals/bulk?date=${selectedDate}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(backendTasks)
        });

        if (!response.ok) {
          console.error('Failed to sync daily tasks to backend:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error syncing daily tasks to backend:', error);
        // Silent fail - local storage already updated
      }
    }
  };

  const pct = useMemo(() => computeDailyProgress(tasks), [tasks]);

  const addCounterTask = () => {
    const name = newTaskName.trim();
    const target = parseInt(newTaskTarget) || 0;
    if (!name || target <= 0) return;
    const next: DailyTask[] = [...tasks, { id: `${Date.now()}`, name, type: 'counter', target, unit: newTaskUnit || undefined, value: 0, isCustom: true }];
    saveDailyTasks(next);
    setNewTaskName(''); setNewTaskTarget(''); setNewTaskUnit('');
  };

  const deleteTask = (taskId: string, taskName: string) => {
    showConfirm(
      'Delete Task',
      `Are you sure you want to delete "${taskName}"?`,
      async () => {
        const updated = tasks.filter(t => t.id !== taskId);
        await saveDailyTasks(updated);
      }
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>🎯 Daily Goals</Text>
            <View style={{ width: 64 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.dailyWrap}>
        <View style={styles.dateRow}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput style={styles.dateInput} value={selectedDate} onChangeText={setSelectedDate} />
          </View>

          {/* Progress */}
          <View style={styles.progressBarOuter}>
            <View style={[styles.progressBarInner, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressText}>{pct}% complete</Text>

          {/* Tasks */}
          <View style={styles.tasksList}>
            {tasks.map(t => (
              <View key={t.id} style={styles.taskItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{t.name}</Text>
                  {t.type === 'counter' && (
                    <Text style={styles.taskSub}>{t.value || 0} / {t.target} {t.unit || ''}</Text>
                  )}
                </View>
                {t.type === 'checkbox' ? (
                  <TouchableOpacity
                    style={[styles.checkButton, t.completed ? styles.checkButtonOn : undefined]}
                    onPress={() => saveDailyTasks(toggleCheckboxTask(tasks, t.id))}
                  >
                    <Text style={[styles.checkText, t.completed ? styles.checkTextOn : undefined]}>{t.completed ? 'Done' : 'Mark'}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.counterRow}>
                    <TextInput
                      style={styles.counterInput}
                      value={String(t.value || 0)}
                      onChangeText={(text) => {
                        const newValue = parseInt(text) || 0;
                        const updated = tasks.map(task => task.id === t.id ? { ...task, value: newValue } : task);
                        saveDailyTasks(updated);
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                    <Text style={styles.counterTarget}>/ {t.target}</Text>
                    {t.isCustom && (
                      <TouchableOpacity 
                        style={styles.deleteTaskButton} 
                        onPress={() => deleteTask(t.id, t.name)}
                      >
                        <Text style={styles.deleteTaskButtonText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Add custom counter task */}
          <Text style={styles.inputLabel}>Add custom counter task</Text>
          <View style={styles.addRow}>
            <TextInput placeholder="Name" placeholderTextColor="#94A3B8" style={[styles.input, styles.addInput]} value={newTaskName} onChangeText={setNewTaskName} />
            <TextInput placeholder="Target" placeholderTextColor="#94A3B8" style={[styles.input, styles.addInput]} value={newTaskTarget} onChangeText={setNewTaskTarget} keyboardType="numeric" />
            <TextInput placeholder="Unit" placeholderTextColor="#94A3B8" style={[styles.input, styles.addInput]} value={newTaskUnit} onChangeText={setNewTaskUnit} />
          </View>
        <TouchableOpacity style={styles.addButton} onPress={addCounterTask}><Text style={styles.addButtonText}>Add Task</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  gradientHeader: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E5EAF5',
    borderRadius: 999,
  },
  tabItemActive: {
    backgroundColor: '#4facfe',
  },
  tabText: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successBanner: {
    margin: 12,
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  successText: {
    color: '#1E3A8A',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: '#B00020',
    marginHorizontal: 16,
    marginTop: 8,
  },
  loadingContainer: {
    padding: 24,
  },
  loadingText: {
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  dailyWrap: {
    padding: 16,
  },
  dateRow: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#F8FAFF',
  },
  progressBarOuter: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  progressText: {
    color: '#1E3A8A',
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 12,
  },
  tasksList: {
    gap: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5EAF5',
  },
  taskTitle: { fontWeight: '700', color: '#0F172A' },
  taskSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  checkButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#FFFFFF',
  },
  checkButtonOn: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkText: { color: '#1E3A8A', fontWeight: '700' },
  checkTextOn: { color: '#FFFFFF' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterInput: {
    backgroundColor: '#F8FAFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    minWidth: 60,
    textAlign: 'center',
  },
  counterTarget: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  deleteTaskButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  deleteTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 24,
  },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: { backgroundColor: '#F8FAFF', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 10 },
  addInput: { flex: 1 },
  addButton: { marginTop: 8, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontWeight: '700' },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  goalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  goalArrow: {
    fontSize: 18,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
});



