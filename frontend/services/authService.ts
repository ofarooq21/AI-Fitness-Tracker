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

export class AuthService {
  // Register a new user
  static async register(email: string, password: string, name: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Registration failed');
      }

      const userData = await response.json();
      await this.setCurrentUser(userData);

      // Try to obtain a token by logging in
      try {
        const loginResp = await fetch(`${API_BASE_URL}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase(), password }),
        });
        if (loginResp.ok) {
          const loginData = await loginResp.json();
          await AsyncStorage.setItem(TOKEN_KEY, loginData.access_token);
          await this.setCurrentUser(loginData.user);
          return loginData.user as User;
        }
      } catch (_) {}

      return userData as User;
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
        throw new Error(errorData.detail || 'Login failed');
      }

      const loginData = await response.json();
      await AsyncStorage.setItem(TOKEN_KEY, loginData.access_token);
      await this.setCurrentUser(loginData.user);
      return loginData.user as User;
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
