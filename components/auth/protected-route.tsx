"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'PLATFORM_ADMIN' | 'TENANT_USER'; // Platform admin or any tenant user
  allowedRoles?: string[]; // Specific roles allowed
}

export function ProtectedRoute({ 
  children, 
  requireRole,
  allowedRoles 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    
    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Don't check roles if user is not loaded yet
    if (!user) return;

    // Check role requirements
    if (requireRole === 'PLATFORM_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
      router.replace('/app/dashboard');
      return;
    }

    // TENANT_USER means any tenant role (TENANT_OWNER, TENANT_ADMIN, TENANT_USER, etc.)
    // Simply check that user is NOT a PLATFORM_ADMIN
    if (requireRole === 'TENANT_USER') {
      if (user.role === 'PLATFORM_ADMIN') {
        router.replace('/admin/tenants');
        return;
      }
      // All other roles (including all TENANT_* roles) are allowed
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace('/app/dashboard');
      return;
    }

  }, [isLoading, isAuthenticated, user, requireRole, allowedRoles, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a2fd] mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show nothing (redirecting)
  if (!isAuthenticated) {
    return null;
  }

  // If user is not loaded yet, show loading (don't redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a2fd] mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Role check failed - show nothing (redirecting)
  if (requireRole === 'PLATFORM_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
    return null;
  }

  // TENANT_USER means any tenant role - just block PLATFORM_ADMIN
  if (requireRole === 'TENANT_USER') {
    if (user.role === 'PLATFORM_ADMIN') {
      return null;
    }
    // All other roles are allowed (including all TENANT_* roles and any other roles)
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

