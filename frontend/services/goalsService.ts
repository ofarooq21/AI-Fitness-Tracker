import { AuthService, User } from './authService';

export type GoalType =
  | 'weight_loss'
  | 'weight_gain'
  | 'maintenance'
  | 'strength'
  | 'endurance'
  | 'flexibility';

export interface CreateGoalForm {
  goal_type: GoalType;
  target_value: number; // mapped to target_weight_kg for MVP
  start_date: string; // ISO date (client-only)
  end_date: string; // ISO date -> mapped to target_date
  notes?: string;
}

export interface GoalOut {
  id: string;
  user_id: string;
  goal_type: GoalType;
  title: string;
  description?: string;
  target_weight_kg?: number;
  target_date?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
  progress_percentage?: number;
}

const API_BASE_URL = 'http://localhost:8000';

export class GoalsService {
  static async createGoal(payload: CreateGoalForm): Promise<GoalOut> {
    const currentUser: User | null = await AuthService.getCurrentUser();
    const userId = currentUser?.id ?? 'demo';

    // Map app form model to backend GoalCreate schema
    const requestBody = {
      user_id: userId,
      goal_type: payload.goal_type,
      title: `${payload.goal_type} - target ${payload.target_value}`,
      description: payload.notes ?? undefined,
      target_weight_kg: payload.target_value,
      target_date: payload.end_date,
      is_primary: false,
    };

    // Prefer authenticated request if token exists; fall back to public
    try {
      const response = await AuthService.makeAuthenticatedRequest('/goals', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create goal');
      }
      return await response.json();
    } catch (authErr) {
      // Fallback (demo mode / no token)
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create goal');
      }
      return await response.json();
    }
  }

  static async listGoals(): Promise<GoalOut[]> {
    // Try with auth, fall back to demo
    try {
      const response = await AuthService.makeAuthenticatedRequest('/goals', {
        method: 'GET',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to load goals');
      }
      return await response.json();
    } catch (authErr) {
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to load goals');
      }
      return await response.json();
    }
  }
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateGoalForm(values: CreateGoalForm): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!values.goal_type) {
    errors.push({ field: 'goal_type', message: 'Goal type is required' });
  }

  if (values.target_value === undefined || values.target_value === null || isNaN(values.target_value)) {
    errors.push({ field: 'target_value', message: 'Target value is required' });
  } else if (values.target_value <= 0 || values.target_value > 1000) {
    errors.push({ field: 'target_value', message: 'Target value must be between 0 and 1000' });
  }

  if (!values.start_date) {
    errors.push({ field: 'start_date', message: 'Start date is required' });
  }

  if (!values.end_date) {
    errors.push({ field: 'end_date', message: 'End date is required' });
  }

  if (values.start_date && values.end_date) {
    const start = new Date(values.start_date).getTime();
    const end = new Date(values.end_date).getTime();
    if (!isFinite(start) || !isFinite(end)) {
      errors.push({ field: 'date', message: 'Invalid date format' });
    } else if (start > end) {
      errors.push({ field: 'date', message: 'Start date must be before or equal to end date' });
    }
  }

  return errors;
}



