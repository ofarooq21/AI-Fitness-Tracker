import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

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

const API_BASE_URL = 'http://localhost:8000'; // kept for optional goals fallback
const TOKEN_KEY = 'celery_auth_token';
const CURRENT_USER_KEY = 'celery_current_user';

export class AuthService {
  // Register a new user
  static async register(email: string, password: string, name: string): Promise<User> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      const user = data.user;
      if (!user) throw new Error('Registration failed');
      const userOut: User = {
        id: user.id,
        email: user.email || email.toLowerCase(),
        name: (user.user_metadata as any)?.name || name,
        createdAt: user.created_at || new Date().toISOString(),
      };
      await this.setCurrentUser(userOut); // store for UX
      const session = (await supabase.auth.getSession()).data.session;
      if (session?.access_token) {
        await AsyncStorage.setItem(TOKEN_KEY, session.access_token);
      }
      return userOut;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  static async login(email: string, password: string): Promise<User> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });
      if (error) throw error;
      const session = data.session;
      const user = data.user;
      if (!user || !session) throw new Error('Login failed');
      const userOut: User = {
        id: user.id,
        email: user.email || email.toLowerCase(),
        name: (user.user_metadata as any)?.name || 'User',
        createdAt: user.created_at || new Date().toISOString(),
      };
      await AsyncStorage.setItem(TOKEN_KEY, session.access_token);
      await this.setCurrentUser(userOut);
      return userOut;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Get current logged in user
  static async getCurrentUser(): Promise<User | null> {
    try {
      // Prefer supabase session
      const { data } = await supabase.auth.getUser();
      const sUser = data.user;
      if (sUser) {
        const userOut: User = {
          id: sUser.id,
          email: sUser.email || '',
          name: (sUser.user_metadata as any)?.name || 'User',
          createdAt: sUser.created_at || new Date().toISOString(),
        };
        await this.setCurrentUser(userOut);
        return userOut;
      }
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
    await supabase.auth.signOut();
  }

  // Check if user is logged in
  static async isLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    const token = await this.getAuthToken();
    return user !== null && token !== null;
  }

  // Make authenticated API request
  static async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = (await supabase.auth.getSession()).data.session?.access_token || await this.getAuthToken();
    
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
