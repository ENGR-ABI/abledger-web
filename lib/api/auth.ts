/**
 * Authentication API methods
 */

import apiClient from './client';
import { tenantApi } from './tenant';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  AuthMeResponse,
  SendVerificationCodeRequest,
  SendVerificationCodeResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from './types';

export const authApi = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Extract only fields that the backend expects (exclude rememberMe)
    const { rememberMe, ...backendCredentials } = credentials;

    const response = await apiClient.post<LoginResponse>('/auth/login', backendCredentials);

    // Store token
    if (response.accessToken) {
      apiClient.setToken(response.accessToken);

      // Handle rememberMe on client side (store in localStorage with expiration)
      if (rememberMe) {
        // Store a flag for "remember me" preference
        // Token expiration is handled by backend JWT expiry
        if (typeof window !== 'undefined') {
          localStorage.setItem('abledger_remember_me', 'true');
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('abledger_remember_me');
        }
      }
    }

    return response;
  },

  /**
   * Send email verification code
   */
  async sendVerificationCode(data: SendVerificationCodeRequest): Promise<SendVerificationCodeResponse> {
    return apiClient.post<SendVerificationCodeResponse>('/auth/send-verification', data);
  },

  /**
   * Verify email with code
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    return apiClient.post<VerifyEmailResponse>('/auth/verify-email', data);
  },

  /**
   * Complete registration after email verification
   * This creates a tenant and owner user, then logs in automatically
   */
  async completeRegistration(data: RegisterRequest & { verificationToken: string }): Promise<RegisterResponse> {
    // Generate slug from company name with proper validation
    let slug = data.slug || data.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure slug meets validation requirements:
    // - MinLength: 2
    // - MaxLength: 100
    // - Pattern: /^[a-z0-9-]+$/

    // If slug is empty or too short, use a fallback
    if (!slug || slug.length < 2) {
      // Generate from email or use a timestamp-based fallback
      const emailPrefix = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
      slug = emailPrefix.length >= 2 ? emailPrefix : `tenant-${Date.now().toString().slice(-8)}`;
    }

    // Ensure slug doesn't exceed max length (100)
    if (slug.length > 100) {
      slug = slug.substring(0, 100).replace(/-+$/, ''); // Remove trailing hyphens
    }

    // Final validation: ensure it matches the pattern
    if (!/^[a-z0-9-]+$/.test(slug)) {
      // Fallback to timestamp-based slug if pattern doesn't match
      slug = `tenant-${Date.now().toString().slice(-8)}`;
    }

    // Step 1: Create tenant (which also creates owner user) with verification token
    const tenant = await tenantApi.createTenant({
      name: data.companyName,
      slug,
      ownerEmail: data.email,
      ownerPassword: data.password,
      verificationToken: data.verificationToken,
    });

    // Step 2: Login with the credentials to get token
    const loginResponse = await this.login({
      email: data.email,
      password: data.password,
    });

    return {
      ...loginResponse,
      tenantId: tenant.id,
    };
  },

  /**
   * Register new tenant/user (legacy - kept for backward compatibility)
   * @deprecated Use sendVerificationCode -> verifyEmail -> completeRegistration flow instead
   */
  async register(_data: RegisterRequest): Promise<RegisterResponse> {
    // For now, redirect to new flow
    throw new Error('Please use the new registration flow with email verification');
  },

  /**
   * Get current user info
   * Note: This endpoint may not exist yet - will need to be implemented in backend
   */
  async me(): Promise<AuthMeResponse> {
    try {
      return apiClient.get<AuthMeResponse>('/auth/me');
    } catch (error: any) {
      // If /auth/me doesn't exist, extract user from token (temporary)
      // In production, backend should provide this endpoint
      console.warn('/auth/me endpoint not available, using token fallback');
      throw error;
    }
  },

  /**
   * Logout (revoke refresh token and clear tokens)
   */
  async logout(): Promise<void> {
    const refreshToken = apiClient.getRefreshToken();

    // Revoke refresh token on server
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Failed to revoke refresh token:', error);
        // Continue with client-side logout even if server call fails
      }
    }

    // Clear tokens
    apiClient.clearToken();
    // Redirect handled by component/router
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  },

  /**
   * Update user profile
   */
  async updateProfile(data: { fullName?: string; phoneNumber?: string; avatarUrl?: string }): Promise<any> {
    return apiClient.put('/auth/profile', data);
  },

  /**
   * Upload profile avatar
   */
  async uploadAvatar(file: File): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);

    // Don't set Content-Type header - let axios set it automatically with boundary for FormData
    return apiClient.post('/auth/upload-avatar', formData);
  },

  /**
   * Change user password
   */
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return apiClient.put('/auth/change-password', data);
  },

  /**
   * Request password reset code
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password using verification code
   */
  async resetPassword(data: { email: string; code: string; newPassword: string }): Promise<{ message: string }> {
    return apiClient.post('/auth/reset-password', data);
  },

  /**
   * Initiate login - verify credentials and send OTP
   */
  async initiateLogin(credentials: LoginRequest): Promise<{ message: string }> {
    const { rememberMe: _, ...backendCredentials } = credentials;
    return apiClient.post<{ message: string }>('/auth/login', backendCredentials);
  },

  /**
   * Verify login OTP and complete login
   */
  async verifyLoginOtp(data: { email: string; code: string; rememberMe?: boolean }): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/verify-login-otp', {
      email: data.email,
      code: data.code,
      rememberMe: data.rememberMe || false,
    });

    // Store tokens
    if (response.accessToken) {
      apiClient.setToken(response.accessToken);
    }

    if (response.refreshToken) {
      apiClient.setRefreshToken(response.refreshToken);
    }

    return response;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/refresh-token', { refreshToken });
  },
};

