/**
 * Admin API Client for Platform Administration
 */

import apiClient from './client';
import type { Tenant, PlatformMetrics } from './types';

export interface TenantListResponse {
  tenants: Tenant[];
  total: number;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerName?: string;
}

export interface UpdateTenantRequest {
  name?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  subscriptionPlan?: string;
  subscriptionStatus?: string;
}

export interface ExtendSubscriptionRequest {
  days: number;
}

export interface UpgradePlanRequest {
  plan: string;
}

export interface SendMessageRequest {
  title: string;
  message: string;
  type?: string;
  emailType?: string;
}

export interface PlatformAdmin {
  id: string;
  email: string;
  fullName?: string;
  isActive: boolean;
  emailVerified: boolean;
  avatarUrl?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  userType?: 'platform_admin' | 'tenant_user';
  role?: string;
  tenantId?: string;
  tenantName?: string;
  tenantSlug?: string;
  tenantStatus?: string;
  tenantAssociationActive?: boolean;
}

export interface PlatformAdminListResponse {
  users: PlatformAdmin[];
  total: number;
}

export interface CreatePlatformAdminRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface UpdatePlatformAdminRequest {
  fullName?: string;
  isActive?: boolean;
}

export const adminApi = {
  /**
   * Get all tenants (platform admin only)
   */
  async getTenants(limit: number = 50, offset: number = 0, search?: string, status?: string): Promise<TenantListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return apiClient.get<TenantListResponse>(`/admin/tenants?${params.toString()}`);
  },

  /**
   * Get a single tenant by ID
   */
  async getTenant(id: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/admin/tenants/${id}`);
  },

  /**
   * Create a new tenant (platform admin only)
   */
  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    return apiClient.post<Tenant>('/admin/tenants', data);
  },

  /**
   * Update a tenant
   */
  async updateTenant(id: string, data: UpdateTenantRequest): Promise<Tenant> {
    return apiClient.put<Tenant>(`/admin/tenants/${id}`, data);
  },

  /**
   * Suspend a tenant
   */
  async suspendTenant(id: string): Promise<Tenant> {
    return apiClient.patch<Tenant>(`/admin/tenants/${id}/suspend`);
  },

  /**
   * Activate a tenant
   */
  async activateTenant(id: string): Promise<Tenant> {
    return apiClient.patch<Tenant>(`/admin/tenants/${id}/activate`);
  },

  /**
   * Get platform metrics
   */
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    return apiClient.get<PlatformMetrics>('/admin/metrics');
  },

  /**
   * Extend subscription period
   */
  async extendSubscription(id: string, data: ExtendSubscriptionRequest): Promise<Tenant> {
    return apiClient.patch<Tenant>(`/admin/tenants/${id}/extend-subscription`, data);
  },

  /**
   * Upgrade subscription plan
   */
  async upgradePlan(id: string, data: UpgradePlanRequest): Promise<Tenant> {
    return apiClient.patch<Tenant>(`/admin/tenants/${id}/upgrade-plan`, data);
  },

  /**
   * Send message to tenant
   */
  async sendMessage(id: string, data: SendMessageRequest): Promise<any> {
    return apiClient.post(`/admin/tenants/${id}/send-message`, data);
  },

  /**
   * Get all users (platform admins and tenant users)
   */
  async getPlatformAdmins(
    limit: number = 50,
    offset: number = 0,
    userType?: 'all' | 'platform_admin' | 'tenant_user',
    tenantId?: string,
    role?: string,
  ): Promise<PlatformAdminListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (userType) params.append('userType', userType);
    if (tenantId) params.append('tenantId', tenantId);
    if (role) params.append('role', role);
    return apiClient.get<PlatformAdminListResponse>(`/admin/users?${params.toString()}`);
  },

  /**
   * Get a single user by ID (any user - platform admin or tenant user)
   */
  async getPlatformAdmin(id: string): Promise<PlatformAdmin> {
    return apiClient.get<PlatformAdmin>(`/admin/users/${id}`);
  },

  /**
   * Get a single user by ID (alias for getPlatformAdmin)
   */
  async getUser(id: string): Promise<PlatformAdmin> {
    return this.getPlatformAdmin(id);
  },

  /**
   * Create a new platform admin user
   */
  async createPlatformAdmin(data: CreatePlatformAdminRequest): Promise<PlatformAdmin> {
    return apiClient.post<PlatformAdmin>('/admin/users', data);
  },

  /**
   * Update a platform admin user
   */
  async updatePlatformAdmin(id: string, data: UpdatePlatformAdminRequest): Promise<PlatformAdmin> {
    return apiClient.put<PlatformAdmin>(`/admin/users/${id}`, data);
  },

  /**
   * Remove platform admin access from a user
   */
  async removePlatformAdmin(id: string): Promise<void> {
    return apiClient.delete(`/admin/users/${id}`);
  },
};

