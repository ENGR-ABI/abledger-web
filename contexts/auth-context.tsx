"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import apiClient from '@/lib/api/client';
import type { User, LoginRequest, RegisterRequest } from '@/lib/api/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = user !== null;

  /**
   * Fetch current user info
   * Note: Since /auth/me may not be implemented yet, we decode JWT token as fallback
   */
  const refreshUser = useCallback(async () => {
    if (!apiClient.isAuthenticated()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Try to get user from /auth/me endpoint
      const response = await authApi.me();
      setUser(response.user);
    } catch (error: any) {
      console.error('[AuthContext] Failed to fetch user from /auth/me:', error);
      // Fallback: Decode JWT token to get user info
      // This fallback is used if /auth/me fails but token is still valid
      try {
        const token = apiClient.getToken();
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('[AuthContext] Using JWT fallback, decoded payload:', payload);
          setUser({
            id: payload.userId,
            email: payload.email || 'user@example.com', // Email may not be in token
            fullName: null,
            phoneNumber: null,
            avatarUrl: null,
            tenantId: payload.tenantId || null,
            role: payload.role,
          });
          console.log('[AuthContext] User set from JWT fallback');
        } else {
          console.warn('[AuthContext] No token found, user is not authenticated');
          // No token, user is not authenticated
          setUser(null);
        }
      } catch (decodeError) {
        console.error('[AuthContext] Failed to decode JWT token:', decodeError);
        // Token invalid or expired
        apiClient.clearToken();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login
   */
  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authApi.login(credentials);
      setUser(response.user);

      // Redirect based on role
      if (response.user.role === 'PLATFORM_ADMIN') {
        router.replace('/admin/tenants');
      } else {
        router.replace('/app/dashboard');
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Register (legacy - kept for backward compatibility)
   * Note: New registration flow is handled directly in get-started page
   */
  const register = async (data: RegisterRequest) => {
    try {
      // This will throw an error directing to use new flow
      const response = await authApi.register(data);
      setUser(response.user);
      router.push('/app/dashboard');
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.replace('/login');
    }
  };

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /**
   * Protect routes based on authentication
   */
  useEffect(() => {


    if (isLoading) {
      console.log('[AuthContext] Still loading, skipping route protection');
      return;
    }

    const isPublicRoute = pathname === '/' ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/get-started') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/terms') ||
      pathname.startsWith('/privacy') ||
      pathname.startsWith('/contact') ||
      pathname.startsWith('/payment/callback');

    const isAdminRoute = pathname.startsWith('/admin');
    const isAppRoute = pathname.startsWith('/app');


    // Redirect unauthenticated users from protected routes
    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    // Redirect authenticated users from login/register/password reset pages to dashboard
    if (isAuthenticated && (
      pathname === '/login' ||
      pathname === '/get-started' ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password')
    )) {
      if (user?.role === 'PLATFORM_ADMIN') {
        router.replace('/admin/tenants');
      } else {
        router.replace('/app/dashboard');
      }
      return;
    }

    // Protect admin routes
    if (isAdminRoute && isAuthenticated && user?.role !== 'PLATFORM_ADMIN') {
      router.replace('/app/dashboard');
      return;
    }

    // Protect app routes (ensure user has tenant context)
    if (isAppRoute && isAuthenticated && user?.role === 'PLATFORM_ADMIN') {
      router.replace('/admin/tenants');
      return;
    }

  }, [isLoading, isAuthenticated, pathname, router, user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

