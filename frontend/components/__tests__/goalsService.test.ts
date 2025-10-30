import { validateGoalForm, CreateGoalForm } from '../../services/goalsService';

describe('validateGoalForm', () => {
  const base: CreateGoalForm = {
    goal_type: 'weight_loss',
    target_value: 75,
    start_date: '2025-01-01',
    end_date: '2025-06-01',
    notes: 'test',
  };

  it('passes with valid values', () => {
    const errors = validateGoalForm(base);
    expect(errors).toHaveLength(0);
  });

  it('requires goal_type', () => {
    const { goal_type, ...rest } = base as any;
    const errors = validateGoalForm({ ...rest, goal_type: undefined as any });
    expect(errors.some(e => e.field === 'goal_type')).toBe(true);
  });

  it('requires positive target_value within bounds', () => {
    expect(validateGoalForm({ ...base, target_value: 0 }).some(e => e.field === 'target_value')).toBe(true);
    expect(validateGoalForm({ ...base, target_value: -5 }).some(e => e.field === 'target_value')).toBe(true);
    expect(validateGoalForm({ ...base, target_value: 2001 }).some(e => e.field === 'target_value')).toBe(true);
  });

  it('requires start and end dates', () => {
    expect(validateGoalForm({ ...base, start_date: '' }).some(e => e.field === 'start_date')).toBe(true);
    expect(validateGoalForm({ ...base, end_date: '' }).some(e => e.field === 'end_date')).toBe(true);
  });

  it('validates date order and format', () => {
    expect(validateGoalForm({ ...base, start_date: 'invalid' }).some(e => e.field === 'date')).toBe(true);
    expect(validateGoalForm({ ...base, end_date: 'invalid' }).some(e => e.field === 'date')).toBe(true);
    expect(validateGoalForm({ ...base, start_date: '2025-06-02', end_date: '2025-06-01' }).some(e => e.field === 'date')).toBe(true);
  });
});


