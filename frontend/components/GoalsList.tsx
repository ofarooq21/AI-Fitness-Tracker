import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { GoalsService, GoalOut } from '../services/goalsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyTask, computeDailyProgress, ensureDefaults, toggleCheckboxTask, updateCounterTask } from '../utils/dailyGoalsUtils';

interface GoalsListProps {
  onBack: () => void;
  onCreateNew: () => void;
  successMessage?: string | null;
  clearMessage?: () => void;
}

export default function GoalsList({ onBack, onCreateNew, successMessage, clearMessage }: GoalsListProps) {
  const [goals, setGoals] = useState<GoalOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'daily' | 'long'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTarget, setNewTaskTarget] = useState('');
  const [newTaskUnit, setNewTaskUnit] = useState('');

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    loadDailyTasks();
  }, [selectedDate]);

  const storageKey = (date: string) => `daily_goals_tasks_${date}`;

  const loadDailyTasks = async () => {
    try {
      const json = await AsyncStorage.getItem(storageKey(selectedDate));
      const arr: DailyTask[] | null = json ? JSON.parse(json) : null;
      setTasks(ensureDefaults(arr || undefined));
    } catch (e) {
      setTasks(ensureDefaults(undefined));
    }
  };

  const saveDailyTasks = async (next: DailyTask[]) => {
    setTasks(next);
    await AsyncStorage.setItem(storageKey(selectedDate), JSON.stringify(next));
  };

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await GoalsService.listGoals();
      setGoals(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const pct = useMemo(() => computeDailyProgress(tasks), [tasks]);

  const addCounterTask = () => {
    const name = newTaskName.trim();
    const target = parseInt(newTaskTarget) || 0;
    if (!name || target <= 0) return;
    const next: DailyTask[] = [...tasks, { id: `${Date.now()}`, name, type: 'counter', target, unit: newTaskUnit || undefined, value: 0 }];
    saveDailyTasks(next);
    setNewTaskName(''); setNewTaskTarget(''); setNewTaskUnit('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Goals</Text>
        <TouchableOpacity onPress={onCreateNew} style={styles.createButton}>
          <Text style={styles.createButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabItem, tab === 'daily' && styles.tabItemActive]} onPress={() => setTab('daily')}>
          <Text style={[styles.tabText, tab === 'daily' && styles.tabTextActive]}>Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, tab === 'long' && styles.tabItemActive]} onPress={() => setTab('long')}>
          <Text style={[styles.tabText, tab === 'long' && styles.tabTextActive]}>Long-term</Text>
        </TouchableOpacity>
      </View>

      {successMessage ? (
        <TouchableOpacity style={styles.successBanner} onPress={clearMessage}>
          <Text style={styles.successText}>{successMessage}</Text>
        </TouchableOpacity>
      ) : null}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {tab === 'daily' ? (
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
                    <TouchableOpacity style={styles.counterBtn} onPress={() => saveDailyTasks(updateCounterTask(tasks, t.id, -1))}><Text style={styles.counterBtnText}>-</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => saveDailyTasks(updateCounterTask(tasks, t.id, +1))}><Text style={styles.counterBtnText}>+</Text></TouchableOpacity>
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
      ) : (
        loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading goals...</Text>
          </View>
        ) : (
          <FlatList
            data={goals}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.goalItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalTitle}>{item.title}</Text>
                  <Text style={styles.goalSubtitle}>{item.goal_type} • {item.status}</Text>
                </View>
                <Text style={styles.goalArrow}>→</Text>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No goals yet</Text>
                <Text style={styles.emptySubtitle}>Create your first goal to get started</Text>
              </View>
            )}
            onRefresh={loadGoals}
            refreshing={loading}
          />
        )
      )}
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
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F2F6FF',
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
    backgroundColor: '#2563EB',
  },
  tabText: {
    color: '#1E3A8A',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  backButtonText: {
    color: '#1E3A8A',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
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
  counterRow: { flexDirection: 'row', gap: 8 },
  counterBtn: { backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  counterBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
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



