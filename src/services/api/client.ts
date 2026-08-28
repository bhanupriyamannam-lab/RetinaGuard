
       import { ApiResponse } from './types';

export class ApiError extends Error {
  public status: number;
  public errors?: Record<string, string[] | string>;
  public isNetworkError: boolean;

  constructor(
    message: string,
    status: number = 500,
    errors?: Record<string, string[] | string>,
    isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.isNetworkError = isNetworkError;
  }
}

// Helper to format any nested error object/array into readable string
function formatErrorMessage(errObj: any): string {
  if (!errObj) return '';
  if (typeof errObj === 'string') return errObj;
  if (Array.isArray(errObj)) return errObj.map(formatErrorMessage).join(', ');
  if (typeof errObj === 'object') {
    return Object.entries(errObj)
      .filter(([k, v]) => k !== 'success' && k !== 'data' && v !== null && v !== undefined)
      .map(([field, err]) => {
        if (typeof err === 'object') {
          return `${field}: ${formatErrorMessage(err)}`;
        }
        return `${field}: ${err}`;
      })
      .join(' | ');
  }
  return String(errObj);
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('retinaguard_access_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (
        response.status === 401 &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/refresh')
      ) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          return this.request<T>(endpoint, options);
        }
      }

      let payload: any = null;
      const text = await response.text();
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = { message: text };
        }
      }

      // Check HTTP error or { success: false } payload
      if (!response.ok || (payload && typeof payload === 'object' && payload.success === false)) {
        let errorMessage = '';

        if (payload?.errors) {
          errorMessage = formatErrorMessage(payload.errors);
        } else if (payload?.message) {
          errorMessage = payload.message;
        } else if (payload?.detail) {
          errorMessage = payload.detail;
        } else if (payload && typeof payload === 'object') {
          errorMessage = formatErrorMessage(payload);
        }

        errorMessage = errorMessage || `HTTP ${response.status}: Request failed`;
        throw new ApiError(errorMessage, response.status, payload?.errors || payload);
      }

      if (payload && typeof payload === 'object' && 'success' in payload) {
        const apiResp = payload as ApiResponse<T>;
        return apiResp.data !== undefined ? apiResp.data : (payload as T);
      }

      return payload as T;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(
        'Unable to connect to RetinaGuard API backend. Ensure the Django server is running at ' +
          this.baseUrl,
        0,
        undefined,
        true
      );
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('retinaguard_refresh_token');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!res.ok) {
        localStorage.removeItem('retinaguard_access_token');
        localStorage.removeItem('retinaguard_refresh_token');
        return false;
      }

      const data = await res.json();
      const newAccess = data?.data?.access || data?.access;
      if (newAccess) {
        localStorage.setItem('retinaguard_access_token', newAccess);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const queryString = query.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  public post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  public put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  public patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  public upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
}

export const apiClient = new ApiClient();