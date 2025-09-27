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

const USERS_KEY = 'celery_users';
const CURRENT_USER_KEY = 'celery_current_user';

export class AuthService {
  // Get all stored users
  static async getUsers(): Promise<UserAccount[]> {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Save users to storage
  static async saveUsers(users: UserAccount[]): Promise<void> {
    try {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  // Register a new user
  static async register(email: string, password: string, name: string): Promise<User> {
    const users = await this.getUsers();
    
    // Check if user already exists
    const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const newUser: UserAccount = {
      email: email.toLowerCase(),
      password, // In a real app, this would be hashed
      name,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await this.saveUsers(users);

    // Return user without password
    return {
      id: newUser.email, // Using email as ID for simplicity
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.createdAt
    };
  }

  // Login user
  static async login(email: string, password: string): Promise<User> {
    const users = await this.getUsers();
    
    const user = users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.password === password
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Return user without password
    return {
      id: user.email,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };
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

  // Logout user
  static async logout(): Promise<void> {
    await this.setCurrentUser(null);
  }

  // Check if user is logged in
  static async isLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // Get user count (for demo purposes)
  static async getUserCount(): Promise<number> {
    const users = await this.getUsers();
    return users.length;
  }
}
