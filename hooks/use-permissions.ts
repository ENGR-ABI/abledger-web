/**
 * Hook for role-based permissions
 */

import { useAuth } from '@/contexts/auth-context';
import { hasPermission, canManage, canView, type Permission } from '@/lib/utils/permissions';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  return {
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    canManage: (resource: 'inventory' | 'sales' | 'customers' | 'team' | 'branding') => 
      canManage(role, resource),
    canView: (resource: 'dashboard' | 'inventory' | 'sales' | 'invoices' | 'customers' | 'team' | 'branding' | 'profile') => 
      canView(role, resource),
    role,
    isOwner: role === 'TENANT_OWNER',
    isAdmin: role === 'TENANT_ADMIN',
    isStaff: role === 'STAFF',
    isViewer: role === 'VIEWER',
  };
}

