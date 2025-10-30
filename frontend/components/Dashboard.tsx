import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { AuthService, User } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DashboardProps {
  onLogout: () => void;
  onShowMacroTracker: () => void;
  onShowWorkoutTracker: () => void;
  onShowGoals: () => void;
}

export default function Dashboard({ onLogout, onShowMacroTracker, onShowWorkoutTracker, onShowGoals }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [todayMeals, setTodayMeals] = useState(0);
  const [lastWorkout, setLastWorkout] = useState<{ name: string; date: string } | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      // For now, we'll set a default user count since getUserCount doesn't exist
      setUserCount(1);
      const today = new Date().toISOString().split('T')[0];
      const mealsJson = await AsyncStorage.getItem(`macro_meals_${today}`);
      const mealsArr = mealsJson ? JSON.parse(mealsJson) : [];
      setTodayMeals(Array.isArray(mealsArr) ? mealsArr.length : 0);
      const workoutsJson = await AsyncStorage.getItem('workout_history');
      const workouts = workoutsJson ? JSON.parse(workoutsJson) : [];
      if (Array.isArray(workouts) && workouts.length > 0) {
        setLastWorkout({ name: workouts[0].name, date: workouts[0].date });
      } else {
        setLastWorkout(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            onLogout();
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <Text style={styles.brandEmoji}>🍽️</Text>
          <Text style={styles.brandText}>NutrifyAI</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Greeting */}
        <View style={styles.greetingCard}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <View style={styles.streakPill}>
            <Text style={styles.streakText}>🔥 0-day streak</Text>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.metricBlue]}>
            <Text style={styles.metricLabel}>Member Since</Text>
            <Text style={styles.metricValue}>{new Date(user.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.metricCard, styles.metricIndigo]}>
            <Text style={styles.metricLabel}>Total Users</Text>
            <Text style={styles.metricValue}>{userCount}</Text>
          </View>
          <View style={[styles.metricCard, styles.metricBlue]}>
            <Text style={styles.metricLabel}>Meals Today</Text>
            <Text style={styles.metricValue}>{todayMeals}</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.tile} onPress={onShowMacroTracker}>
            <Text style={styles.tileIcon}>📊</Text>
            <Text style={styles.tileTitle}>Macro Tracker</Text>
            <Text style={styles.tileSub}>Track your daily nutrition</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tile} onPress={onShowWorkoutTracker}>
            <Text style={styles.tileIcon}>🏋️</Text>
            <Text style={styles.tileTitle}>Workout Tracker</Text>
            <Text style={styles.tileSub}>Log your exercises</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tile} onPress={onShowGoals}>
            <Text style={styles.tileIcon}>🎯</Text>
            <Text style={styles.tileTitle}>Goals</Text>
            <Text style={styles.tileSub}>Set and track goals</Text>
          </TouchableOpacity>
        </View>

        {/* Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          {lastWorkout ? (
            <>
              <Text style={styles.activityText}>Last Workout</Text>
              <Text style={styles.activitySubtext}>{lastWorkout.name} • {new Date(lastWorkout.date).toLocaleDateString()}</Text>
            </>
          ) : (
            <>
              <Text style={styles.activityText}>No recent activity</Text>
              <Text style={styles.activitySubtext}>Start using NutrifyAI to see your activity here</Text>
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#F2F6FF',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginTop: 20,
    marginBottom: 12,
  },
  greetingCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streakText: {
    color: '#1E3A8A',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  metricBlue: { backgroundColor: '#DBEAFE' },
  metricIndigo: { backgroundColor: '#E0E7FF' },
  metricLabel: {
    color: '#1E3A8A',
    fontSize: 12,
    marginBottom: 6,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5EAF5',
    marginBottom: 12,
  },
  tileIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  tileSub: {
    fontSize: 12,
    color: '#64748B',
  },
  activityContainer: {
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  activityText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 8,
  },
  activitySubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
