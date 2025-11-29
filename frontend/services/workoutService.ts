import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8000';
const TOKEN_KEY = 'auth_token';

export interface WorkoutSet {
    reps: number;
    weight_kg: number;
    rpe?: number;
}

export interface Exercise {
    name: string;
    sets: WorkoutSet[];
    notes?: string;
}

export interface WorkoutCreate {
    user_id: string;
    name: string;
    date: string;
    exercises: Exercise[];
    duration_minutes?: number;
    notes?: string;
}

export interface Workout {
    id: string;
    user_id: string;
    name: string;
    date: string;
    exercises: Exercise[];
    duration_minutes?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface WorkoutSummary {
    id: string;
    name: string;
    date: string;
    exercise_count: number;
    total_sets: number;
    duration_minutes?: number;
}

export class WorkoutService {
    static async getAuthHeaders() {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    static async createWorkout(workoutData: WorkoutCreate): Promise<Workout> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/workouts`, {
                method: 'POST',
                headers,
                body: JSON.stringify(workoutData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to create workout');
            }

            return await response.json();
        } catch (error) {
            console.error('Create workout error:', error);
            throw error;
        }
    }

    static async getWorkouts(userId: string, limit: number = 50): Promise<WorkoutSummary[]> {
        try {
            const headers = await this.getAuthHeaders();
            const params = new URLSearchParams({
                user_id: userId,
                limit: limit.toString()
            });

            const response = await fetch(`${API_BASE_URL}/workouts?${params.toString()}`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to fetch workouts');
            }

            return await response.json();
        } catch (error) {
            console.error('Get workouts error:', error);
            throw error;
        }
    }

    static async getWorkout(workoutId: string): Promise<Workout> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/workouts/${workoutId}`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to fetch workout');
            }

            return await response.json();
        } catch (error) {
            console.error('Get workout error:', error);
            throw error;
        }
    }

    static async updateWorkout(workoutId: string, workoutData: Partial<WorkoutCreate>): Promise<Workout> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/workouts/${workoutId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(workoutData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to update workout');
            }

            return await response.json();
        } catch (error) {
            console.error('Update workout error:', error);
            throw error;
        }
    }

    static async deleteWorkout(workoutId: string): Promise<void> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/workouts/${workoutId}`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to delete workout');
            }
        } catch (error) {
            console.error('Delete workout error:', error);
            throw error;
        }
    }
}
