// Lightweight test for validation logic without a test runner.
// Run with: node frontend/components/__tests__/goalValidation.test.js

function validateGoalForm(values) {
  const errors = [];
  if (!values.goal_type) errors.push({ field: 'goal_type' });
  if (values.target_value === undefined || values.target_value === null || isNaN(values.target_value)) {
    errors.push({ field: 'target_value' });
  } else if (values.target_value <= 0 || values.target_value > 1000) {
    errors.push({ field: 'target_value_range' });
  }
  if (!values.start_date) errors.push({ field: 'start_date' });
  if (!values.end_date) errors.push({ field: 'end_date' });
  if (values.start_date && values.end_date) {
    const s = new Date(values.start_date).getTime();
    const e = new Date(values.end_date).getTime();
    if (!(isFinite(s) && isFinite(e)) || s > e) errors.push({ field: 'date' });
  }
  return errors;
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const valid = {
    goal_type: 'weight_loss',
    target_value: 75,
    start_date: '2025-01-01',
    end_date: '2025-06-01',
  };
  expect(validateGoalForm(valid).length === 0, 'Valid form should have no errors');

  const missing = { ...valid, goal_type: '', target_value: null };
  expect(validateGoalForm(missing).length >= 2, 'Missing required fields should error');

  const badRange = { ...valid, target_value: -5 };
  expect(validateGoalForm(badRange).some(e => e.field.includes('target_value')), 'Target value range check');

  const badDate = { ...valid, start_date: '2025-07-01' };
  expect(validateGoalForm(badDate).some(e => e.field === 'date'), 'Date consistency check');

  console.log('goalValidation tests passed');
}

try {
  run();
} catch (e) {
  console.error('goalValidation tests FAILED');
  console.error(e && e.message ? e.message : e);
  process.exit(1);
}



