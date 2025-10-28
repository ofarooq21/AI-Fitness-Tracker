import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';

import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import MacroTracker from './components/MacroTracker';
import WorkoutTrackerPage from './components/WorkoutTrackerPage';
import { AuthService, User } from './services/authService';

export default function App() {
  type Page = 'home' | 'login' | 'register' | 'dashboard' | 'macro' | 'workout';

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setCurrentPage('dashboard');
      }
    } catch (e) {
      console.error('Error checking auth status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation helpers
  const showLoginPage = () => setCurrentPage('login');
  const showRegisterPage = () => setCurrentPage('register');
  const showHomePage = () => setCurrentPage('home');
  const showDashboard = () => setCurrentPage('dashboard');
  const showMacroTracker = () => setCurrentPage('macro');
  const showWorkoutPage = () => setCurrentPage('workout');

  // Auth handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleRegisterSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('home');
  };

  // Loading gate
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Celery...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Route rendering
  if (currentPage === 'login') {
    return (
      <LoginPage
        onBackToHome={showHomePage}
        onLoginSuccess={handleLoginSuccess}
        onShowRegister={showRegisterPage}
      />
    );
  }

  if (currentPage === 'register') {
    return (
      <RegisterPage
        onBackToLogin={showLoginPage}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <Dashboard
        onLogout={handleLogout}
        onShowMacroTracker={showMacroTracker}
      />
    );
  }

  if (currentPage === 'macro') {
    const goBackTo = currentUser ? showDashboard : showHomePage;
    return <MacroTracker onBackToHome={goBackTo} />;
  }

  if (currentPage === 'workout') {
    return <WorkoutTrackerPage onBack={showHomePage} />;
  }

  // Home / Landing
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.logo}>🥬 Celery</Text>
          <Text style={styles.tagline}>Your AI-Powered Fitness Companion</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Track. Analyze. Achieve.</Text>
          <Text style={styles.heroSubtitle}>
            Transform your fitness journey with intelligent meal tracking,
            workout analysis, and personalized goal setting powered by AI.
          </Text>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About Celery</Text>
          <View style={styles.aboutContent}>
            <Text style={styles.aboutText}>
              Celery is a comprehensive fitness and nutrition tracking application
              that combines AI with intuitive design to help you achieve your goals.
            </Text>

            <View style={styles.featuresList}>
              <TouchableOpacity style={styles.featureItem} onPress={showMacroTracker}>
                <Text style={styles.featureIcon}>📱</Text>
                <Text style={styles.featureText}>Macro Tracker</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureItem} onPress={showWorkoutPage}>
                <Text style={styles.featureIcon}>🏋️</Text>
                <Text style={styles.featureText}>Workout Analysis</Text>
              </TouchableOpacity>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🎯</Text>
                <Text style={styles.featureText}>Goal Management</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🤖</Text>
                <Text style={styles.featureText}>AI Insights</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Start Your Journey?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands already transforming their fitness with Celery.
          </Text>
          <View style={styles.ctaButtonRow}>
            <TouchableOpacity style={[styles.ctaButton, styles.primaryButton]} onPress={showLoginPage}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ctaButton, styles.secondaryButton]} onPress={showWorkoutPage}>
              <Text style={styles.secondaryButtonText}>Open Workout Tracker</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#F0FFF0',
  },
  loadingText: {
    fontSize: 18,
    color: '#228B22',
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#F0FFF0',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#228B22',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#32CD32',
    fontWeight: '500',
  },
  hero: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#228B22',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  aboutSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#F8FFF8',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#228B22',
    textAlign: 'center',
    marginBottom: 24,
  },
  aboutContent: {
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 320,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20, // If RN version is old, replace with margins on children
  },
  featureItem: {
    alignItems: 'center',
    width: 140,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#228B22',
    textAlign: 'center',
  },
  ctaSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#228B22',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 24,
  },
  ctaButtonRow: {
    flexDirection: 'column',
    gap: 12, // If RN version is old, replace with marginTop on buttons
    width: '100%',
  },
  ctaButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#228B22',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#228B22',
  },
  secondaryButtonText: {
    color: '#228B22',
    fontSize: 16,
    fontWeight: '600',
  },
});