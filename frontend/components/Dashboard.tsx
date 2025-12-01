import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Alert, Animated } from 'react-native';
import { AuthService, User } from '../services/authService';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DashboardProps {
  onLogout: () => void;
  onShowMacroTracker: () => void;
  onShowWorkoutTracker: () => void;
  onShowGoals: () => void;
  onShowAIInsights: () => void;
  onShowSettings: () => void;
}

export default function Dashboard({ onLogout, onShowMacroTracker, onShowWorkoutTracker, onShowGoals, onShowAIInsights, onShowSettings }: DashboardProps) {
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
      const userId = currentUser?.id || 'guest';
      const mealsJson = await AsyncStorage.getItem(`macro_meals_${userId}_${today}`);
      const mealsArr = mealsJson ? JSON.parse(mealsJson) : [];
      setTodayMeals(Array.isArray(mealsArr) ? mealsArr.length : 0);
      const workoutsJson = await AsyncStorage.getItem(`workout_history_${userId}`);
      const workouts = workoutsJson ? JSON.parse(workoutsJson) : [];
      if (Array.isArray(workouts) && workouts.length > 0) {
        setLastWorkout({ name: workouts[0].name, date: workouts[0].date });
      } else {
        setLastWorkout(null);
      }
    } catch (error) {
      // Silent error handling for user data loading
    }
  };

  const handleLogout = async () => {
    // Use window.confirm for web, Alert for native
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        await AuthService.logout();
        onLogout();
      }
    } else {
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
    }
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <View style={styles.brandWrap}>
              <Text style={styles.brandEmoji}>🍽️</Text>
              <Text style={styles.brandText}>NutrifyAI</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={onShowSettings} style={styles.iconButton}>
                <Text style={styles.iconButtonText}>⚙️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>🔥 0-day streak</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics */}
        <View style={styles.metricsRow}>
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.metricCard}
          >
            <Text style={styles.metricIcon}>📅</Text>
            <Text style={styles.metricLabel}>Member Since</Text>
            <Text style={styles.metricValue}>{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#fa709a', '#fee140']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.metricCard}
          >
            <Text style={styles.metricIcon}>🍽️</Text>
            <Text style={styles.metricLabel}>Meals Today</Text>
            <Text style={styles.metricValue}>{todayMeals}</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#a8edea', '#fed6e3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.metricCard}
          >
            <Text style={styles.metricIcon}>💪</Text>
            <Text style={styles.metricLabel}>Workouts</Text>
            <Text style={styles.metricValue}>{lastWorkout ? '1' : '0'}</Text>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.tile} 
            onPress={onShowMacroTracker}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tileGradient}
            >
              <Text style={styles.tileIcon}>📊</Text>
              <Text style={styles.tileTitle}>Macro Tracker</Text>
              <Text style={styles.tileSub}>Track nutrition</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tile} 
            onPress={onShowWorkoutTracker}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tileGradient}
            >
              <Text style={styles.tileIcon}>🏋️</Text>
              <Text style={styles.tileTitle}>Workouts</Text>
              <Text style={styles.tileSub}>Log exercises</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tile} 
            onPress={onShowGoals}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tileGradient}
            >
              <Text style={styles.tileIcon}>🎯</Text>
              <Text style={styles.tileTitle}>Daily Goals</Text>
              <Text style={styles.tileSub}>Track tasks</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={onShowAIInsights}
            activeOpacity={0.8}
            testID="ai-insights-button"
          >
            <LinearGradient
              colors={['#43e97b', '#38f9d7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tileGradient}
            >
              <Text style={styles.tileIcon}>🤖</Text>
              <Text style={styles.tileTitle}>AI Insights</Text>
              <Text style={styles.tileSub}>Get insights</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          <View style={styles.activityIconWrap}>
            <Text style={styles.activityIcon}>{lastWorkout ? '💪' : '📊'}</Text>
          </View>
          {lastWorkout ? (
            <View style={styles.activityTextWrap}>
              <Text style={styles.activityText}>Last Workout: {lastWorkout.name}</Text>
              <Text style={styles.activitySubtext}>{new Date(lastWorkout.date).toLocaleDateString()}</Text>
            </View>
          ) : (
            <View style={styles.activityTextWrap}>
              <Text style={styles.activityText}>No recent activity</Text>
              <Text style={styles.activitySubtext}>Start tracking to see your progress</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: '600',
  },
  gradientHeader: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    backdropFilter: 'blur(10px)',
  },
  iconButtonText: {
    fontSize: 20,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backdropFilter: 'blur(10px)',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  streakPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    backdropFilter: 'blur(10px)',
  },
  streakText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '600',
    opacity: 0.9,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  tileGradient: {
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  tileIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  tileTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tileSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activityIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityIcon: {
    fontSize: 28,
  },
  activityTextWrap: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '700',
    marginBottom: 4,
  },
  activitySubtext: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
