/**
 * Role capabilities and information
 */

export interface RoleCapabilities {
  name: string;
  description: string;
  capabilities: string[];
}

export const ROLE_CAPABILITIES: Record<string, RoleCapabilities> = {
  TENANT_OWNER: {
    name: 'Owner',
    description: 'Full ownership with all privileges',
    capabilities: [
      'All admin capabilities',
      'Manage tenant configuration',
      'Delete users (except other owners)',
      'Transfer ownership',
      'Manage branding and settings',
    ],
  },
  TENANT_ADMIN: {
    name: 'Admin',
    description: 'Full administrative access with management capabilities',
    capabilities: [
      'Manage team members (invite, edit, activate/deactivate)',
      'Access all features (inventory, customers, sales, reports)',
      'Manage tenant settings and branding',
      'View and export all data',
    ],
  },
  STAFF: {
    name: 'Staff',
    description: 'Operational access for daily tasks',
    capabilities: [
      'Create and manage inventory items',
      'Create and manage customer records',
      'Process sales transactions and invoices',
      'View reports and analytics',
    ],
  },
  VIEWER: {
    name: 'Viewer',
    description: 'Read-only access for viewing data',
    capabilities: [
      'View inventory, customers, and sales data',
      'View reports and analytics',
      'Export data (read-only)',
    ],
  },
};

export const ROLE_OPTIONS = [
  { value: 'TENANT_ADMIN', label: 'Admin', ...ROLE_CAPABILITIES.TENANT_ADMIN },
  { value: 'STAFF', label: 'Staff', ...ROLE_CAPABILITIES.STAFF },
  { value: 'VIEWER', label: 'Viewer', ...ROLE_CAPABILITIES.VIEWER },
];

// TENANT_OWNER is not in the list as it cannot be assigned
export function getRoleCapabilities(role: string): RoleCapabilities {
  return ROLE_CAPABILITIES[role] || {
    name: role,
    description: 'User access',
    capabilities: ['Basic access to the platform'],
  };
}

