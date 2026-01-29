/**
 * Role-based permissions utility
 * 
 * Based on PRD:
 * - TENANT_OWNER: Full access within tenant, manage branding and staff
 * - TENANT_ADMIN: Manage inventory, customers, sales
 * - STAFF: Perform operational actions
 * - VIEWER: Read-only access
 */

import type { UserRole } from '@/lib/api/types';

export type Permission = 
  | 'view_dashboard'
  | 'view_inventory'
  | 'manage_inventory'
  | 'view_sales'
  | 'manage_sales'
  | 'view_invoices'
  | 'manage_invoices'
  | 'view_customers'
  | 'manage_customers'
  | 'view_team'
  | 'manage_team'
  | 'view_branding'
  | 'manage_branding'
  | 'view_profile'
  | 'manage_profile';

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;

  // TENANT_OWNER: Full access
  if (role === 'TENANT_OWNER') {
    return true;
  }

  // TENANT_ADMIN: Manage inventory, customers, sales (but not team/branding)
  if (role === 'TENANT_ADMIN') {
    return [
      'view_dashboard',
      'view_inventory',
      'manage_inventory',
      'view_sales',
      'manage_sales',
      'view_invoices',
      'manage_invoices',
      'view_customers',
      'manage_customers',
      'view_profile',
      'manage_profile',
    ].includes(permission);
  }

  // STAFF: Operational actions (can create sales, view data, but limited management)
  if (role === 'STAFF') {
    return [
      'view_dashboard',
      'view_inventory',
      'view_sales',
      'manage_sales', // Can create sales
      'view_invoices',
      'manage_invoices', // Can generate invoices
      'view_customers',
      'manage_customers', // Can create/edit customers
      'view_profile',
      'manage_profile',
    ].includes(permission);
  }

  // VIEWER: Read-only access
  if (role === 'VIEWER') {
    return [
      'view_dashboard',
      'view_inventory',
      'view_sales',
      'view_invoices',
      'view_customers',
      'view_profile',
    ].includes(permission);
  }

  // PLATFORM_ADMIN: No tenant-level permissions (redirects to admin panel)
  return false;
}

/**
 * Check if user can manage (create/edit/delete) a resource
 */
export function canManage(role: UserRole | undefined | null, resource: 'inventory' | 'sales' | 'customers' | 'team' | 'branding'): boolean {
  if (!role) return false;

  switch (resource) {
    case 'inventory':
      return hasPermission(role, 'manage_inventory');
    case 'sales':
      return hasPermission(role, 'manage_sales');
    case 'customers':
      return hasPermission(role, 'manage_customers');
    case 'team':
      return hasPermission(role, 'manage_team');
    case 'branding':
      return hasPermission(role, 'manage_branding');
    default:
      return false;
  }
}

/**
 * Check if user can view a resource
 */
export function canView(role: UserRole | undefined | null, resource: 'dashboard' | 'inventory' | 'sales' | 'invoices' | 'customers' | 'team' | 'branding' | 'profile'): boolean {
  if (!role) return false;

  switch (resource) {
    case 'dashboard':
      return hasPermission(role, 'view_dashboard');
    case 'inventory':
      return hasPermission(role, 'view_inventory');
    case 'sales':
      return hasPermission(role, 'view_sales');
    case 'invoices':
      return hasPermission(role, 'view_invoices');
    case 'customers':
      return hasPermission(role, 'view_customers');
    case 'team':
      return hasPermission(role, 'view_team');
    case 'branding':
      return hasPermission(role, 'view_branding');
    case 'profile':
      return hasPermission(role, 'view_profile');
    default:
      return false;
  }
}

