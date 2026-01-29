/**
 * API Client - Centralized HTTP client for all API requests
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, ApiResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private client: AxiosInstance;
  private tokenKey = 'abledger_auth_token';
  private refreshTokenKey = 'abledger_refresh_token';
  private refreshPromise: Promise<string> | null = null; // Prevent multiple concurrent refresh requests

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds (can be overridden per request)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors() {
    // Request interceptor - attach token and refresh if needed
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Skip token refresh for auth endpoints (login, refresh-token, etc.)
        const isAuthEndpoint = config.url?.includes('/auth/login') || 
                               config.url?.includes('/auth/refresh-token') ||
                               config.url?.includes('/auth/verify-login-otp') ||
                               config.url?.includes('/auth/send-verification') ||
                               config.url?.includes('/auth/verify-email');

        if (!isAuthEndpoint) {
          let token = this.getToken();
          
          // If token is expired or expiring soon, refresh it
          if (token && this.isTokenExpiringSoon(token)) {
            try {
              token = await this.refreshAccessToken();
            } catch (error) {
              // Refresh failed, will be handled by response interceptor
              console.warn('[API] Failed to refresh token:', error);
            }
          }

          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } else {
          // For auth endpoints, still attach token if available (for logout, etc.)
          const token = this.getToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Don't set Content-Type for FormData - let Axios handle it automatically
        if (config.data instanceof FormData && config.headers) {
          delete config.headers['Content-Type'];
        }

        // Log requests in development
        if (process.env.NODE_ENV === 'development') {
          const baseURL = config.baseURL || this.client.defaults.baseURL || '';
          const fullUrl = baseURL ? `${baseURL}${config.url}` : config.url;
          console.log(`[API] ${config.method?.toUpperCase()} ${fullUrl}`, {
            baseURL: baseURL,
            url: config.url,
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => {
        // Log responses in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] Response ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }

        return response;
      },
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - try to refresh token first
        // Exception: Don't auto-refresh for auth endpoints (login, register, etc.) - these are authentication attempts
        // Exception: Don't auto-refresh for /auth/me - let the auth context handle it
        // Exception: Don't refresh if this is already a refresh token request
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
                               originalRequest?.url?.includes('/auth/register') ||
                               originalRequest?.url?.includes('/auth/refresh-token') ||
                               originalRequest?.url?.includes('/auth/verify-login-otp') ||
                               originalRequest?.url?.includes('/auth/send-verification') ||
                               originalRequest?.url?.includes('/auth/verify-email') ||
                               originalRequest?.url?.includes('/auth/forgot-password') ||
                               originalRequest?.url?.includes('/auth/reset-password');
        const isAuthMeEndpoint = originalRequest?.url?.includes('/auth/me');
        
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !isAuthMeEndpoint) {
          originalRequest._retry = true;

          try {
            // Try to refresh the access token
            const newAccessToken = await this.refreshAccessToken();
            
            // Retry the original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearToken();
            if (typeof window !== 'undefined') {
              if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
              }
            }
            return Promise.reject(refreshError);
          }
        }

        // Handle 403 Forbidden - check if it's trial expiration
        if (error.response?.status === 403) {
          const errorData = error.response.data;
          
          // Check if this is a trial expiration error
          if (errorData?.code === 'TRIAL_EXPIRED') {
            // Show trial expiration toast with upgrade action
            // We use dynamic import to avoid SSR issues
            if (typeof window !== 'undefined') {
              import('sonner').then(({ toast }) => {
                toast.error(errorData.message || 'Your trial has ended. Please upgrade to continue.', {
                  action: {
                    label: 'Upgrade Now',
                    onClick: () => {
                      window.location.href = errorData.upgradeUrl || '/app/settings/billing';
                    },
                  },
                  duration: 10000, // Show for 10 seconds
                });
              }).catch(() => {
                // Fallback if toast fails
                console.error('[API] Trial expired:', errorData.message);
              });
            }
          } else {
            // Regular permission denied
            console.error('[API] Permission denied:', error.response.data);
          }
        }

        // Log errors in development
        if (process.env.NODE_ENV === 'development') {
          const errorData = error.response?.data;
          let errorMessage: string;
          
          if (Array.isArray(errorData?.message)) {
            errorMessage = errorData.message.join(', ');
          } else if (typeof errorData?.message === 'string') {
            errorMessage = errorData.message;
          } else {
            errorMessage = error.message || 'Unknown error';
          }

          console.error('[API] Error:', {
            status: error.response?.status,
            message: errorMessage,
            url: error.config?.url,
            data: errorData,
          });
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Format error response
   */
  private formatError(error: AxiosError<ApiError | any>): ApiError {
    if (error.response?.data) {
      const data = error.response.data;
      
      // Handle NestJS validation errors - message can be an array or object
      let message: string;
      if (Array.isArray(data.message)) {
        // Check if array contains detailed validation error objects
        if (data.message.length > 0 && typeof data.message[0] === 'object' && data.message[0].constraints) {
          // Handle class-validator detailed error format
          const errors: string[] = [];
          data.message.forEach((err: any) => {
            if (err.constraints) {
              errors.push(...Object.values(err.constraints).map(v => String(v)));
            } else if (err.message) {
              errors.push(err.message);
            }
          });
          message = errors.join(', ') || 'Validation failed';
        } else {
          // Array of string messages
          message = data.message.map((msg: any) => typeof msg === 'string' ? msg : String(msg)).join(', ');
        }
      } else if (typeof data.message === 'string') {
        message = data.message;
      } else {
        message = error.message || 'An error occurred';
      }

      return {
        message,
        statusCode: error.response.status,
        error: data.error || String(data.statusCode) || 'Bad Request',
        code: data.code,
        upgradeUrl: data.upgradeUrl,
        allowedOperations: data.allowedOperations,
      };
    }

    if (error.request) {
      return {
        message: 'Network error. Please check your connection.',
        statusCode: 0,
        error: 'NetworkError',
      };
    }

    return {
      message: error.message || 'An unexpected error occurred',
      statusCode: 0,
      error: 'UnknownError',
    };
  }

  /**
   * Token management
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.tokenKey, token);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.refreshTokenKey);
  }

  setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.refreshTokenKey, token);
  }

  clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Decode JWT token to get expiration time
   */
  private getTokenExpiration(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired or will expire soon (within 2 minutes)
   */
  private isTokenExpiringSoon(token: string | null): boolean {
    if (!token) return true;
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
    return expiration - now < twoMinutes;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = (async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        this.setToken(accessToken);
        return accessToken;
      } catch (error) {
        // Refresh failed, clear tokens and redirect to login
        this.clearToken();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Normalize URL to ensure it's relative and baseURL is used
   */
  private normalizeUrl(url: string): string {
    // If absolute URL is provided, strip the protocol/host to make it relative
    // This ensures baseURL is always used
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Extract path from absolute URL
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    }
    // Ensure relative URLs start with /
    return url.startsWith('/') ? url : `/${url}`;
  }

  /**
   * API Request methods
   * All URLs are relative and will be combined with baseURL
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const normalizedUrl = this.normalizeUrl(url);
    const response = await this.client.get<ApiResponse<T>>(normalizedUrl, config);
    return response.data.data || response.data as T;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const normalizedUrl = this.normalizeUrl(url);
    const response = await this.client.post<ApiResponse<T>>(normalizedUrl, data, config);
    return response.data.data || response.data as T;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const normalizedUrl = this.normalizeUrl(url);
    const response = await this.client.put<ApiResponse<T>>(normalizedUrl, data, config);
    return response.data.data || response.data as T;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const normalizedUrl = this.normalizeUrl(url);
    const response = await this.client.patch<ApiResponse<T>>(normalizedUrl, data, config);
    return response.data.data || response.data as T;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const normalizedUrl = this.normalizeUrl(url);
    const response = await this.client.delete<ApiResponse<T>>(normalizedUrl, config);
    return response.data.data || response.data as T;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export for use in other files
export default apiClient;

