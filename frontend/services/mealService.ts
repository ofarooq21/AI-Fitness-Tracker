import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8000';
const TOKEN_KEY = 'auth_token';

export interface Macros {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
}

export interface MealCreate {
    user_id: string;
    label: string;
    portion_estimate_grams: number;
    macros: Macros;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    notes?: string;
    task_id?: string;
}

export interface Meal {
    id: string;
    user_id: string;
    label: string;
    portion_estimate_grams: number;
    macros: Macros;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface DailyNutrition {
    date: string;
    total_macros: Macros;
    meals: Meal[];
}

export class MealService {
    static async getAuthHeaders() {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    static async createMeal(mealData: MealCreate): Promise<Meal> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/meals`, {
                method: 'POST',
                headers,
                body: JSON.stringify(mealData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to create meal');
            }

            return await response.json();
        } catch (error) {
            console.error('Create meal error:', error);
            throw error;
        }
    }

    static async getMeals(userId: string, dateFrom?: string, dateTo?: string): Promise<Meal[]> {
        try {
            const headers = await this.getAuthHeaders();
            const params = new URLSearchParams({ user_id: userId });
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);

            const response = await fetch(`${API_BASE_URL}/meals?${params.toString()}`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to fetch meals');
            }

            return await response.json();
        } catch (error) {
            console.error('Get meals error:', error);
            throw error;
        }
    }

    static async updateMeal(mealId: string, mealData: Partial<MealCreate>): Promise<Meal> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(mealData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to update meal');
            }

            return await response.json();
        } catch (error) {
            console.error('Update meal error:', error);
            throw error;
        }
    }

    static async deleteMeal(mealId: string): Promise<void> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to delete meal');
            }
        } catch (error) {
            console.error('Delete meal error:', error);
            throw error;
        }
    }

    static async getDailyNutrition(userId: string, date: string): Promise<DailyNutrition> {
        try {
            const headers = await this.getAuthHeaders();
            const params = new URLSearchParams({ user_id: userId });

            const response = await fetch(`${API_BASE_URL}/meals/daily/${date}?${params.toString()}`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to fetch daily nutrition');
            }

            return await response.json();
        } catch (error) {
            console.error('Get daily nutrition error:', error);
            throw error;
        }
    }
}
