import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { GoalsService, GoalType, validateGoalForm } from '../services/goalsService';

interface GoalFormProps {
  onBack: () => void;
  onCreated: (message?: string) => void;
}

export default function GoalForm({ onBack, onCreated }: GoalFormProps) {
  const [goalType, setGoalType] = useState<GoalType>('weight_loss');
  const [targetValue, setTargetValue] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const payload = {
      goal_type: goalType,
      target_value: Number(targetValue),
      start_date: startDate,
      end_date: endDate,
      notes: notes ? notes : undefined,
    };

    const errors = validateGoalForm(payload);
    if (errors.length > 0) {
      setError(errors[0].message);
      return;
    }

    try {
      setSubmitting(true);
      await GoalsService.createGoal(payload);
      onCreated('Goal created successfully');
    } catch (e: any) {
      setError(e?.message || 'Failed to create goal');
      Alert.alert('Error', e?.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Goal</Text>
        <View style={{ width: 64 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Goal Type</Text>
        <View style={styles.segment}>
          {(['weight_loss', 'weight_gain', 'maintenance'] as GoalType[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setGoalType(t)}
              style={[styles.segmentItem, goalType === t && styles.segmentItemActive]}
            >
              <Text style={[styles.segmentText, goalType === t && styles.segmentTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Target Value</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 75"
          keyboardType="numeric"
          value={targetValue}
          onChangeText={setTargetValue}
        />

        <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2025-01-01"
          value={startDate}
          onChangeText={setStartDate}
          autoCapitalize="none"
        />

        <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2025-06-01"
          value={endDate}
          onChangeText={setEndDate}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Add any notes..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitDisabled]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Goal'}</Text>
        </TouchableOpacity>
      </View>
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
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    color: '#333333',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFF',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EEE',
    borderRadius: 8,
    marginRight: 8,
  },
  segmentItemActive: {
    backgroundColor: '#2563EB',
  },
  segmentText: {
    color: '#333',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFF',
  },
  errorText: {
    color: '#B00020',
    marginTop: 12,
    fontSize: 13,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});



