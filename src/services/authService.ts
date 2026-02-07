import { api } from './api';

export interface User {
  id: number;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  role?: string;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SignupData {
  email: string;
  password: string;
}

export interface SigninData {
  email: string;
  password: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  /**
   * Sign up a new user
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/signup', data);
    this.saveAuthData(response);
    return response;
  }

  /**
   * Sign in an existing user
   */
  async signin(data: SigninData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/signin', data);
    this.saveAuthData(response);
    return response;
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response;
  }

  /**
   * Verify if the current token is valid
   */
  async verifyToken(): Promise<{ valid: boolean; user: User }> {
    try {
      const response = await api.post<{ valid: boolean; user: User }>('/api/auth/verify-token', {});
      return response;
    } catch (error) {
      // If token is invalid, clear auth data
      this.clearAuthData();
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  signout(): void {
    this.clearAuthData();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Save authentication data to localStorage
   */
  private saveAuthData(authResponse: AuthResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, authResponse.access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));

    // Also store userName and userRole separately for Layout.tsx
    const userName = authResponse.user.email.split('@')[0];
    const userRole = authResponse.user.role || 'user';
    localStorage.setItem('userName', userName);
    localStorage.setItem('userRole', userRole);
  }

  /**
   * Clear authentication data from localStorage
   */
  private clearAuthData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
  }

  /**
   * Update stored user data
   */
  updateUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}

export const authService = new AuthService();
