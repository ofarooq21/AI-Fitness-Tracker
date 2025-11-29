import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  RefreshControl
} from 'react-native';

const API_BASE_URL = 'http://localhost:8000';

interface AIInsightsProps {
  onBack: () => void;
}

interface AIInsight {
  summary: string;
  nutrition_tip: string;
  workout_tip: string;
  overall_score: number;
}

interface InsightsData {
  insights: AIInsight;
  data_summary: {
    days_analyzed: number;
    meals: {
      total: number;
      avg_daily: number;
      avg_daily_calories: number;
      avg_daily_protein_g: number;
    };
    workouts: {
      total: number;
      avg_per_week: number;
      avg_duration_minutes: number;
    };
    goals: {
      active_count: number;
    };
  };
}

export default function AIInsights({ onBack }: AIInsightsProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token and user info
      let token: string | null = null;
      let user: any = null;
      try {
        const { AuthService } = await import('../services/authService');
        token = await AuthService.getAuthToken();
        user = await AuthService.getCurrentUser();
        console.log('Auth status - Token:', token ? 'YES' : 'NO', 'User:', user);
      } catch (e) {
        console.log('Auth error:', e);
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Sending request WITH auth token');
      } else {
        console.log('Sending request WITHOUT auth token (will use demo data)');
      }
      
      console.log('Fetching insights from:', `${API_BASE_URL}/insights/ai`);
      
      const response = await fetch(`${API_BASE_URL}/insights/ai`, {
        method: 'GET',
        headers,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setInsights(data);
    } catch (error: any) {
      console.error('Error loading insights:', error);
      let errorMessage = 'Failed to load AI insights.';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Cannot connect to server. Make sure the backend is running on http://localhost:8000';
      } else {
        errorMessage = error.message || 'Failed to load AI insights. Please try again.';
      }
      
      setError(errorMessage);
      // Don't show alert, just set error state so user can see it and retry
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // yellow/amber
    if (score >= 40) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return '#DBFCD4'; // light green
    if (score >= 60) return '#FEF3C7'; // light yellow
    if (score >= 40) return '#FFEDD5'; // light orange
    return '#FEE2E2'; // light red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading && !insights) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Insights</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Generating your personalized insights...</Text>
          <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !insights) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Insights</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          {error?.includes('Cannot connect to server') && (
            <View style={styles.helpContainer}>
              <Text style={styles.helpTitle}>To fix this:</Text>
              <Text style={styles.helpText}>1. Make sure the backend server is running</Text>
              <Text style={styles.helpText}>2. Run: cd server && uvicorn app.main:app --reload</Text>
              <Text style={styles.helpText}>3. The server should be on http://localhost:8000</Text>
            </View>
          )}
          <TouchableOpacity style={styles.retryButton} onPress={loadInsights}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Insights</Text>
        <TouchableOpacity 
          onPress={handleRefresh} 
          style={styles.refreshButton} 
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Text style={styles.refreshButtonText}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {insights && (
          <>
            {/* Overall Score Card - Hero Section */}
            <View style={[styles.scoreCard, { backgroundColor: getScoreGradient(insights.insights.overall_score) }]}>
              <Text style={styles.scoreLabel}>Your Overall Score</Text>
              <View style={styles.scoreCircleContainer}>
                <View style={[styles.scoreCircle, { borderColor: getScoreColor(insights.insights.overall_score) }]}>
                  <Text style={[styles.scoreValue, { color: getScoreColor(insights.insights.overall_score) }]}>
                    {insights.insights.overall_score}
                  </Text>
                </View>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={[styles.scoreStatus, { color: getScoreColor(insights.insights.overall_score) }]}>
                  {getScoreLabel(insights.insights.overall_score)}
                </Text>
              </View>
              <Text style={styles.scoreSubtext}>
                Based on your activity over the last {insights.data_summary.days_analyzed} days
              </Text>
            </View>

            {/* Quick Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>🍽️</Text>
                <Text style={styles.statValue}>
                  {Math.round(insights.data_summary.meals.avg_daily)} / 3
                </Text>
                <Text style={styles.statLabel}>Meals Logged</Text>
                <Text style={styles.statSubtext}>
                  {insights.data_summary.meals.avg_daily.toFixed(1)} per day
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>🏋️</Text>
                <Text style={styles.statValue}>{insights.data_summary.workouts.total}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
                <Text style={styles.statSubtext}>
                  {insights.data_summary.workouts.avg_duration_minutes > 0 
                    ? `${insights.data_summary.workouts.avg_duration_minutes} min avg`
                    : 'No workouts yet'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>🎯</Text>
                <Text style={styles.statValue}>{insights.data_summary.goals.active_count}</Text>
                <Text style={styles.statLabel}>Active Goals</Text>
                <Text style={styles.statSubtext}>
                  {insights.data_summary.goals.active_count === 0 ? 'Set a goal to start' : 'In progress'}
                </Text>
              </View>
            </View>

            {/* AI Summary Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                  <Text style={styles.cardIcon}>🤖</Text>
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>AI Summary</Text>
                  <Text style={styles.cardSubtitle}>Personalized analysis of your progress</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardText}>{insights.insights.summary}</Text>
              </View>
            </View>

            {/* Nutrition Tip Card */}
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <View style={[styles.tipIconContainer, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={styles.tipIcon}>🥗</Text>
                </View>
                <Text style={styles.tipTitle}>Nutrition Tip</Text>
              </View>
              <Text style={styles.tipText}>{insights.insights.nutrition_tip}</Text>
            </View>

            {/* Workout Tip Card */}
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <View style={[styles.tipIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.tipIcon}>💪</Text>
                </View>
                <Text style={styles.tipTitle}>Workout Tip</Text>
              </View>
              <Text style={styles.tipText}>{insights.insights.workout_tip}</Text>
            </View>

            {/* Detailed Stats Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                  <Text style={styles.cardIcon}>📊</Text>
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Your Stats</Text>
                  <Text style={styles.cardSubtitle}>Last {insights.data_summary.days_analyzed} days breakdown</Text>
                </View>
              </View>
              <View style={styles.statsDetail}>
                <View style={styles.statRow}>
                  <View style={styles.statRowLeft}>
                    <Text style={styles.statRowIcon}>🔥</Text>
                    <Text style={styles.statRowLabel}>Avg Daily Calories</Text>
                  </View>
                  <Text style={styles.statRowValue}>
                    {Math.round(insights.data_summary.meals.avg_daily_calories)} kcal
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statRow}>
                  <View style={styles.statRowLeft}>
                    <Text style={styles.statRowIcon}>🥩</Text>
                    <Text style={styles.statRowLabel}>Avg Daily Protein</Text>
                  </View>
                  <Text style={styles.statRowValue}>
                    {insights.data_summary.meals.avg_daily_protein_g.toFixed(1)}g
                  </Text>
                </View>
                {insights.data_summary.workouts.avg_duration_minutes > 0 && (
                  <>
                    <View style={styles.statDivider} />
                    <View style={styles.statRow}>
                      <View style={styles.statRowLeft}>
                        <Text style={styles.statRowIcon}>⏱️</Text>
                        <Text style={styles.statRowLabel}>Avg Workout Duration</Text>
                      </View>
                      <Text style={styles.statRowValue}>
                        {insights.data_summary.workouts.avg_duration_minutes} min
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Footer Note */}
            <View style={styles.footerNote}>
              <Text style={styles.footerText}>
                💡 Insights are generated using AI based on your logged data. 
                Keep tracking to get more accurate recommendations!
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    minWidth: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  refreshButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 24,
    color: '#2563EB',
  },
  placeholder: {
    width: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#1E3A8A',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#78350F',
    marginBottom: 4,
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  scoreCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreCircleContainer: {
    marginBottom: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreStatus: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreSubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5EAF5',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5EAF5',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardBody: {
    marginTop: 4,
  },
  cardText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5EAF5',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  tipText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  statsDetail: {
    marginTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statRowIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  statRowLabel: {
    fontSize: 15,
    color: '#64748B',
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  statDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  footerNote: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'center',
  },
});
