import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';

import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import MacroTracker from './components/MacroTracker';
import WorkoutTracker from './components/WorkoutTracker';
import GoalForm from './components/GoalForm';
import GoalsList from './components/GoalsList';
import { AuthService, User } from './services/authService';

export default function App() {
  type Page = 'home' | 'login' | 'register' | 'dashboard' | 'macro' | 'workout' | 'goalsForm' | 'goalsList';

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [goalsSuccessMessage, setGoalsSuccessMessage] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);
  const [loginPrefillEmail, setLoginPrefillEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    checkAuthStatus();
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
  const showGoalsForm = () => navigate('goalsForm');
  const showGoalsList = () => navigate('goalsList');

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
      case 'goalsForm': return '#/goals/new';
      case 'goalsList': return '#/goals';
    }
  }

  function hashToPage(hash: string): Page | null {
    if (!hash) return 'home';
    if (hash.startsWith('#/login')) return 'login';
    if (hash.startsWith('#/register')) return 'register';
    if (hash.startsWith('#/dashboard')) return 'dashboard';
    if (hash.startsWith('#/macro')) return 'macro';
    if (hash.startsWith('#/workout')) return 'workout';
    if (hash.startsWith('#/goals/new')) return 'goalsForm';
    if (hash.startsWith('#/goals')) return 'goalsList';
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


  if (currentPage === 'goalsForm') {
    const goBackTo = currentUser ? showDashboard : showHomePage;
    return (
      <GoalForm
        onBack={goBackTo}
        onCreated={(msg?: string) => {
          setGoalsSuccessMessage(msg || null);
          showGoalsList();
        }}
      />
    );
  }

  if (currentPage === 'goalsList') {
    const goBackTo = currentUser ? showDashboard : showHomePage;
    return (
      <GoalsList
        onBack={goBackTo}
        onCreateNew={showGoalsForm}
        successMessage={goalsSuccessMessage}
        clearMessage={() => setGoalsSuccessMessage(null)}
      />
    );
  }

  // Home / Landing
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.logo}>🍽️ NutrifyAI</Text>
          <Text style={styles.tagline}>Smart nutrition and fitness, powered by AI</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Eat smarter. Train better.</Text>
          <Text style={styles.heroSubtitle}>
            Transform your wellness with intelligent meal tracking, workout insights,
            and personalized goal setting powered by AI.
          </Text>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About NutrifyAI</Text>
          <View style={styles.aboutContent}>
            <Text style={styles.aboutText}>
              NutrifyAI is a comprehensive fitness and nutrition tracking application
              that combines AI with intuitive design to help you achieve your goals.
            </Text>

            <View style={styles.featuresList}>
              <TouchableOpacity style={styles.featureItem} onPress={showMacroTracker}>
                <Text style={styles.featureIcon}>📱</Text>
                <Text style={styles.featureText}>Macro Tracker</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureItem} onPress={showWorkoutPage}>
                <Text style={styles.featureIcon}>🏋️</Text>
                <Text style={styles.featureText}>Workout Tracker</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureItem} onPress={showGoalsList}>
                <Text style={styles.featureIcon}>🎯</Text>
                <Text style={styles.featureText}>Goal Management</Text>
              </TouchableOpacity>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🤖</Text>
                <Text style={styles.featureText}>AI Insights</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to optimize your nutrition?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands already transforming their health with NutrifyAI.
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
    backgroundColor: '#F2F6FF',
  },
  loadingText: {
    fontSize: 18,
    color: '#1E3A8A',
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#F2F6FF',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#3B82F6',
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
    color: '#1E3A8A',
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
    backgroundColor: '#F8FAFF',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
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
    borderWidth: 1,
    borderColor: '#E5EAF5',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  ctaSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
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
    backgroundColor: '#2563EB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
});