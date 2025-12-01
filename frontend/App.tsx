import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import MacroTracker from './components/MacroTracker';
import WorkoutTracker from './components/WorkoutTracker';
import GoalsList from './components/GoalsList';
import AIInsights from './components/AIInsights';
import SettingsPage from './components/SettingsPage';
import { AuthService, User } from './services/authService';
import { NotificationService } from './services/notificationService';

export default function App() {
  type Page = 'home' | 'login' | 'register' | 'dashboard' | 'macro' | 'workout' | 'goalsList' | 'aiInsights' | 'settings';

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);
  const [loginPrefillEmail, setLoginPrefillEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    checkAuthStatus();
    // Initialize notifications
    NotificationService.loadSettings().then(settings => {
      NotificationService.scheduleNotifications(settings);
    });

    // Initialize route from URL (web)
    if (typeof window !== 'undefined') {
      const pageFromUrl = hashToPage(window.location.hash);
      if (pageFromUrl) setCurrentPage(pageFromUrl);
      const onPop = () => {
        const p = hashToPage(window.location.hash);
        if (p) setCurrentPage(p);
      };
      window.addEventListener('popstate', onPop);
      window.addEventListener('hashchange', onPop);
      return () => {
        window.removeEventListener('popstate', onPop);
        window.removeEventListener('hashchange', onPop);
      };
    }
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

  // Navigation helpers with URL sync (web)
  const navigate = (page: Page) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      const hash = pageToHash(page);
      if (hash !== window.location.hash) {
        window.history.pushState({}, '', hash);
      }
    }
  };

  const showLoginPage = () => navigate('login');
  const showRegisterPage = () => navigate('register');
  const showHomePage = () => navigate('home');
  const showDashboard = () => navigate('dashboard');
  const showMacroTracker = () => navigate('macro');
  const showWorkoutPage = () => navigate('workout');
  const showGoalsList = () => navigate('goalsList');
  const showAIInsights = () => {
    console.log('showAIInsights called, navigating to aiInsights');
    navigate('aiInsights');
  };
  const showSettings = () => navigate('settings');

  // Auth handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    navigate('dashboard');
  };

  const handleRegisterSuccess = (user: User) => {
    setCurrentUser(null);
    setLoginPrefillEmail(user.email);
    setLoginSuccessMessage('Account created! Please sign in to continue.');
    navigate('login');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('home');
  };

  function pageToHash(page: Page): string {
    switch (page) {
      case 'home': return '#/';
      case 'login': return '#/login';
      case 'register': return '#/register';
      case 'dashboard': return '#/dashboard';
      case 'macro': return '#/macro';
      case 'workout': return '#/workout';
      case 'goalsList': return '#/goals';
      case 'aiInsights': return '#/ai-insights';
      case 'settings': return '#/settings';
    }
  }

  function hashToPage(hash: string): Page | null {
    if (!hash) return 'home';
    if (hash.startsWith('#/login')) return 'login';
    if (hash.startsWith('#/register')) return 'register';
    if (hash.startsWith('#/dashboard')) return 'dashboard';
    if (hash.startsWith('#/macro')) return 'macro';
    if (hash.startsWith('#/workout')) return 'workout';
    if (hash.startsWith('#/goals')) return 'goalsList';
    if (hash.startsWith('#/ai-insights')) return 'aiInsights';
    if (hash.startsWith('#/settings')) return 'settings';
    if (hash === '#/' || hash === '#') return 'home';
    return 'home';
  }

  // Loading gate
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading NutrifyAI...</Text>
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
        successMessage={loginSuccessMessage || undefined}
        defaultEmail={loginPrefillEmail}
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
        onShowWorkoutTracker={showWorkoutPage}
        onShowGoals={showGoalsList}
        onShowAIInsights={showAIInsights}
        onShowSettings={showSettings}
      />
    );
  }

  if (currentPage === 'macro') {
    const goBackTo = currentUser ? showDashboard : showHomePage;
    return <MacroTracker onBackToHome={goBackTo} />;
  }

  if (currentPage === 'workout') {
    const goBackTo = currentUser ? showDashboard : showHomePage;
    return <WorkoutTracker onBackToHome={goBackTo} userId={currentUser?.id} />;
  }

  if (currentPage === 'goalsList') {
    const goBackTo = currentUser ? showDashboard : showHomePage;
    return (
      <GoalsList
        onBack={goBackTo}
      />
    );
  }

  if (currentPage === 'aiInsights') {
    const goBackTo = currentUser ? showDashboard : showHomePage;
    return <AIInsights onBack={goBackTo} />;
  }

  if (currentPage === 'settings') {
    const goBackTo = currentUser ? showDashboard : showHomePage;
    return <SettingsPage onBack={goBackTo} />;
  }

  // Home / Landing
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <SafeAreaView>
            <View style={styles.heroSection}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoIcon}>🍽️</Text>
                <Text style={styles.logoText}>NutrifyAI</Text>
              </View>
              
              <Text style={styles.heroTitle}>Transform Your Health Journey</Text>
              <Text style={styles.heroSubtitle}>
                AI-powered nutrition tracking, personalized workout insights, and smart goal management - all in one beautiful app
              </Text>

              <View style={styles.ctaButtons}>
                <TouchableOpacity 
                  style={styles.primaryCTA} 
                  onPress={showLoginPage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryCTAText}>Get Started Free</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.secondaryCTA} 
                  onPress={showRegisterPage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryCTAText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Everything You Need</Text>
            <Text style={styles.featuresSubtitle}>Powerful tools to reach your fitness goals</Text>

            <View style={styles.featuresGrid}>
              <TouchableOpacity 
                style={styles.featureCard} 
                onPress={showMacroTracker}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureGradient}
                >
                  <Text style={styles.featureCardIcon}>📊</Text>
                  <Text style={styles.featureCardTitle}>Macro Tracker</Text>
                  <Text style={styles.featureCardDesc}>Track calories, protein, carbs & fats with ease</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.featureCard} 
                onPress={showWorkoutPage}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureGradient}
                >
                  <Text style={styles.featureCardIcon}>🏋️</Text>
                  <Text style={styles.featureCardTitle}>Workout Tracker</Text>
                  <Text style={styles.featureCardDesc}>Log exercises, sets, reps & track progress</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.featureCard} 
                onPress={showGoalsList}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureGradient}
                >
                  <Text style={styles.featureCardIcon}>🎯</Text>
                  <Text style={styles.featureCardTitle}>Daily Goals</Text>
                  <Text style={styles.featureCardDesc}>Set & achieve your daily fitness targets</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.featureCard} 
                onPress={showAIInsights}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#a8edea', '#fed6e3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureGradient}
                >
                  <Text style={styles.featureCardIcon}>🤖</Text>
                  <Text style={styles.featureCardTitle}>AI Insights</Text>
                  <Text style={styles.featureCardDesc}>Get personalized recommendations</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1M+</Text>
              <Text style={styles.statLabel}>Meals Tracked</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500K+</Text>
              <Text style={styles.statLabel}>Workouts Logged</Text>
            </View>
          </View>

          {/* Final CTA */}
          <View style={styles.finalCTA}>
            <Text style={styles.finalCTATitle}>Ready to Start?</Text>
            <Text style={styles.finalCTASubtitle}>Join thousands achieving their fitness goals</Text>
            <TouchableOpacity 
              style={styles.finalCTAButton} 
              onPress={showRegisterPage}
              activeOpacity={0.8}
            >
              <Text style={styles.finalCTAButtonText}>Create Free Account</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBg: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  loadingText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    fontSize: 80,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 42,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryCTA: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryCTAText: {
    color: '#667eea',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryCTA: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  secondaryCTAText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  featuresSection: {
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  featuresTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  featuresSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  featureCard: {
    width: '47%',
    minWidth: 160,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  featureGradient: {
    padding: 24,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  featureCardIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  featureCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  featureCardDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  finalCTA: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
  },
  finalCTATitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  finalCTASubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  finalCTAButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  finalCTAButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '800',
  },
});