"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/hooks/use-permissions'
import { Loader2 } from 'lucide-react'

interface RouteProtectionProps {
  children: React.ReactNode
  requiredPermission?: 'view' | 'manage'
  resource: 'dashboard' | 'inventory' | 'sales' | 'invoices' | 'customers' | 'team' | 'branding' | 'profile'
  redirectTo?: string
}

export function RouteProtection({
  children,
  requiredPermission = 'view',
  resource,
  redirectTo = '/app/dashboard',
}: RouteProtectionProps) {
  const { isLoading, isAuthenticated } = useAuth()
  const { canView, canManage } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const hasAccess = requiredPermission === 'view' 
        ? canView(resource)
        : canManage(resource as 'inventory' | 'sales' | 'customers' | 'team' | 'branding')

      if (!hasAccess) {
        router.replace(redirectTo)
      }
    }
  }, [isLoading, isAuthenticated, requiredPermission, resource, redirectTo, canView, canManage, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd] mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, auth context will redirect
  if (!isAuthenticated) {
    return null
  }

  // Check permission
  const hasAccess = requiredPermission === 'view'
    ? canView(resource)
    : canManage(resource as 'inventory' | 'sales' | 'customers' | 'team' | 'branding')

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Access Denied</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

