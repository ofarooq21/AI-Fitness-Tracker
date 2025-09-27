import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import LoginPage from './components/LoginPage';
import WorkoutTrackerPage from './components/WorkoutTrackerPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'login' | 'workout'>('home');

  const showLoginPage = () => setCurrentPage('login');
  const showHomePage = () => setCurrentPage('home');
  const showWorkoutPage = () => setCurrentPage('workout');

  if (currentPage === 'login') {
    return <LoginPage onBackToHome={showHomePage} />;
  }

  if (currentPage === 'workout') {
    return <WorkoutTrackerPage onBack={showHomePage} />;
  }

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
              that combines the power of artificial intelligence with intuitive design 
              to help you achieve your health goals.
            </Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📱</Text>
                <Text style={styles.featureText}>Smart Meal Tracking</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🏋️</Text>
                <Text style={styles.featureText}>Workout Analysis</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🎯</Text>
                <Text style={styles.featureText}>Goal Management</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🤖</Text>
                <Text style={styles.featureText}>AI-Powered Insights</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Start Your Journey?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of users who are already transforming their fitness with Celery.
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
    gap: 20,
  },
  featureItem: {
    alignItems: 'center',
    width: 140,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    gap: 12,
    width: '100%',
  },
  ctaButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
