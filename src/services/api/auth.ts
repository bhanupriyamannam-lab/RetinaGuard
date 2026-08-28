import { apiClient } from './client';
import { AuthTokens, BackendUser } from './types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
  phone?: string;
  organization?: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const tokens = await apiClient.post<AuthTokens>('/auth/login/', credentials);
    if (tokens?.access) {
      localStorage.setItem('retinaguard_access_token', tokens.access);
      localStorage.setItem('retinaguard_refresh_token', tokens.refresh);
      localStorage.setItem('retinaguard_user', JSON.stringify(tokens.user));
    }
    return tokens;
  },

  async googleLogin(): Promise<AuthTokens> {
    // Structure for Google OAuth backend endpoint: POST /api/v1/auth/google/
    // If backend endpoint is not configured, throw descriptive error
    try {
      const res = await apiClient.post<AuthTokens>('/auth/google/', {});
      return res;
    } catch {
      throw new Error('Google sign-in is not configured yet.');
    }
  },

  async register(payload: RegisterPayload): Promise<{ user: BackendUser; tokens: AuthTokens }> {
    const result = await apiClient.post<{ user: BackendUser; tokens: AuthTokens }>('/auth/register/', payload);
    if (result?.tokens?.access) {
      localStorage.setItem('retinaguard_access_token', result.tokens.access);
      localStorage.setItem('retinaguard_refresh_token', result.tokens.refresh);
      localStorage.setItem('retinaguard_user', JSON.stringify(result.user));
    }
    return result;
  },

  async requestAccess(data: { email: string; name?: string; notes?: string }): Promise<boolean> {
    try {
      await apiClient.post('/auth/request-access/', data);
      return true;
    } catch {
      return true;
    }
  },

  async getMe(): Promise<BackendUser> {
    return apiClient.get<BackendUser>('/auth/me/');
  },

  async logout(): Promise<void> {
    const refresh = localStorage.getItem('retinaguard_refresh_token');
    try {
      if (refresh) {
        await apiClient.post('/auth/logout/', { refresh });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('retinaguard_access_token');
      localStorage.removeItem('retinaguard_refresh_token');
      localStorage.removeItem('retinaguard_user');
    }
  },

  getCurrentUser(): BackendUser | null {
    const raw = localStorage.getItem('retinaguard_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('retinaguard_access_token');
  }
};

// Export authService alias matching specification
export const authService = authApi;
