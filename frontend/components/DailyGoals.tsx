import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/authService';
import { getTotalCalories, getTotalProtein, getTotalFat, getTotalCarbs } from '../utils/macroUtils';
import Svg, { Circle } from 'react-native-svg';

interface DailyGoalsProps {
  onBack: () => void;
}

type GoalKey = 'calories' | 'protein' | 'fat' | 'carbs';

export default function DailyGoals({ onBack }: DailyGoalsProps) {
  const [userId, setUserId] = useState<string>('guest');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [goals, setGoals] = useState<{ calories: string; protein: string; fat: string; carbs: string }>({
    calories: '', protein: '', fat: '', carbs: ''
  });
  const [meals, setMeals] = useState<any[]>([]);

  useEffect(() => {
    AuthService.getCurrentUser().then(u => setUserId(u?.id || 'guest')).catch(() => setUserId('guest'));
  }, []);

  const STORAGE_GOALS_KEY = (date: string) => `daily_goals_${userId}_${date}`;
  const STORAGE_MEALS_KEY = (date: string) => `macro_meals_${userId}_${date}`;

  useEffect(() => {
    const load = async () => {
      try {
        const [g, m] = await Promise.all([
          AsyncStorage.getItem(STORAGE_GOALS_KEY(selectedDate)),
          AsyncStorage.getItem(STORAGE_MEALS_KEY(selectedDate)),
        ]);
        if (g) setGoals(JSON.parse(g));
        setMeals(m ? JSON.parse(m) : []);
      } catch {}
    };
    load();
  }, [userId, selectedDate]);

  const totals = useMemo(() => ({
    calories: getTotalCalories(meals),
    protein: getTotalProtein(meals),
    fat: getTotalFat(meals),
    carbs: getTotalCarbs(meals),
  }), [meals]);

  const numericGoals = {
    calories: parseInt(goals.calories) || 0,
    protein: parseInt(goals.protein) || 0,
    fat: parseInt(goals.fat) || 0,
    carbs: parseInt(goals.carbs) || 0,
  };

  const progress = (key: GoalKey) => {
    const target = numericGoals[key];
    const value = totals[key];
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((value / target) * 100));
  };

  const saveGoals = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_GOALS_KEY(selectedDate), JSON.stringify(goals));
      Alert.alert('Saved', 'Your daily goals were saved.');
    } catch {
      Alert.alert('Error', 'Failed to save goals');
    }
  };

  const CircleProgress = ({ pct, color }: { pct: number; color: string }) => {
    const size = 120; const stroke = 12; const radius = (size - stroke) / 2; const cx = size / 2; const cy = size / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    return (
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={radius} stroke="#E5EAF5" strokeWidth={stroke} fill="none" />
        <Circle cx={cx} cy={cy} r={radius} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={`${circumference}`} strokeDashoffset={offset} strokeLinecap="round" />
        <Text style={[styles.centerLabel, { top: cy - 12 }]}>{pct}%</Text>
      </Svg>
    );
  };

  const GoalCard = ({ title, keyName, color }: { title: string; keyName: GoalKey; color: string }) => (
    <View style={styles.goalCard}>
      <View style={{ alignItems: 'center' }}>
        <CircleProgress pct={progress(keyName)} color={color} />
      </View>
      <Text style={styles.goalTitle}>{title}</Text>
      <Text style={styles.goalSubtitle}>{totals[keyName]} / {numericGoals[keyName]} {keyName === 'calories' ? 'cal' : 'g'}</Text>
      <Text style={styles.inputLabel}>Target</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={goals[keyName]}
        onChangeText={(t) => setGoals({ ...goals, [keyName]: t })}
        placeholder={keyName === 'calories' ? '2000' : '150'}
        placeholderTextColor="#999"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Daily Goals</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <GoalCard title="Calories" keyName="calories" color="#2563EB" />
          <GoalCard title="Protein" keyName="protein" color="#10B981" />
        </View>
        <View style={styles.row}>
          <GoalCard title="Fat" keyName="fat" color="#F59E0B" />
          <GoalCard title="Carbs" keyName="carbs" color="#EF4444" />
        </View>

        <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={selectedDate} onChangeText={setSelectedDate} />

        <TouchableOpacity style={styles.saveButton} onPress={saveGoals}>
          <Text style={styles.saveButtonText}>Save Goals</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#F2F6FF'
  },
  backButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD' },
  backButtonText: { color: '#1E3A8A', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#1E3A8A' },
  content: { padding: 16 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  goalCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  goalTitle: { marginTop: 8, fontSize: 16, fontWeight: '700', color: '#0F172A' },
  goalSubtitle: { color: '#64748B', marginBottom: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#1E3A8A', marginTop: 8, marginBottom: 6 },
  input: { backgroundColor: '#F8FAFF', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 10 },
  centerLabel: { position: 'absolute', width: '100%', textAlign: 'center', color: '#0F172A', fontWeight: '700' },
  saveButton: { marginTop: 12, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700' },
});


