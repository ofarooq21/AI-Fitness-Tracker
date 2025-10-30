import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { GoalsService, GoalOut } from '../services/goalsService';

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

  useEffect(() => {
    loadGoals();
  }, []);

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

      {successMessage ? (
        <TouchableOpacity style={styles.successBanner} onPress={clearMessage}>
          <Text style={styles.successText}>{successMessage}</Text>
        </TouchableOpacity>
      ) : null}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
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
    backgroundColor: '#F0FFF0',
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
    color: '#228B22',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#228B22',
  },
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#228B22',
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successBanner: {
    margin: 12,
    backgroundColor: '#E6F4EA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#B7E1C1',
  },
  successText: {
    color: '#137333',
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
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FFF8',
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
    color: '#228B22',
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



