import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface UserAccount {
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

const API_BASE_URL = 'http://localhost:8000';
const TOKEN_KEY = 'celery_auth_token';
const CURRENT_USER_KEY = 'celery_current_user';

// Helper to turn FastAPI-style error responses into readable messages
function extractErrorMessage(errorData: any, fallback: string): string {
  const detail = (errorData && (errorData.detail ?? errorData.message)) ?? null;

  // If backend sent a simple string
  if (typeof detail === 'string') {
    return detail;
  }

  // If backend sent a list of validation errors: [{ msg, loc, type, ...}, ...]
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') return item;
        if (item.msg) return item.msg;
        if (item.detail) return item.detail;
        return null;
      })
      .filter(Boolean);

    if (parts.length > 0) {
      return parts.join('\n');
    }
  }

  // Fallback to JSON if detail is an object
  if (detail && typeof detail === 'object') {
    try {
      return JSON.stringify(detail);
    } catch {
      // ignore
    }
  }

  return fallback;
}

export class AuthService {
  // Register a new user
  static async register(email: string, password: string, name: string): Promise<User> {
    try {
      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          first_name: firstName,
          last_name: lastName,
          // Don't send optional profile fields - let backend use defaults
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = extractErrorMessage(errorData, 'Registration failed');
        throw new Error(message);
      }

      const userData = await response.json();

      // Map backend user to frontend user interface
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: `${userData.first_name} ${userData.last_name}`,
        createdAt: userData.created_at
      };

      // Automatically login after registration
      return await this.login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  static async login(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = extractErrorMessage(errorData, 'Login failed');
        throw new Error(message);
      }

      const loginData = await response.json();
      await AsyncStorage.setItem(TOKEN_KEY, loginData.access_token);

      const backendUser = loginData.user;
      const user: User = {
        id: backendUser.id,
        email: backendUser.email,
        name: `${backendUser.first_name} ${backendUser.last_name}`,
        createdAt: backendUser.created_at
      };

      await this.setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Get current logged in user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Set current logged in user
  static async setCurrentUser(user: User | null): Promise<void> {
    try {
      if (user) {
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (error) {
      console.error('Error setting current user:', error);
      throw error;
    }
  }

  // Get auth token
  static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await this.setCurrentUser(null);
  }

  // Check if user is logged in
  static async isLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    const token = await this.getAuthToken();
    return user !== null && token !== null;
  }

  // Make authenticated API request
  static async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAuthToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, logout user
      await this.logout();
      throw new Error('Session expired. Please login again.');
    }

    return response;
  }
}
