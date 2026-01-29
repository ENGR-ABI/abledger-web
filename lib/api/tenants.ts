/**
 * Tenants/Settings API Client
 */

import apiClient from './client';

export interface PlanLimits {
  maxStaffUsers: number | null;
  maxLocations: number | null;
  currentStaffCount: number;
}

export interface TenantSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  name?: string;
  slug?: string;
  status?: string;
  subscriptionStatus?: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  subscriptionPlan?: string;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  subscriptionStartedAt?: string | null;
  subscriptionEndsAt?: string | null;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  planLimits?: PlanLimits;
}

export interface UpdateTenantSettingsRequest {
  // Note: name is intentionally excluded - it cannot be changed for security and configuration reasons
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
}

export const tenantsApi = {
  /**
   * Get tenant settings
   */
  async getTenantSettings(tenantId: string): Promise<TenantSettings> {
    return apiClient.get<TenantSettings>(`/tenants/${tenantId}/settings`);
  },

  /**
   * Update tenant settings
   */
  async updateTenantSettings(
    tenantId: string,
    data: UpdateTenantSettingsRequest
  ): Promise<TenantSettings> {
    return apiClient.put<TenantSettings>(`/tenants/${tenantId}/settings`, data);
  },

  /**
   * Upload logo file
   */
  async uploadLogo(tenantId: string, file: File): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    // Axios will automatically set Content-Type to multipart/form-data with boundary
    // when it detects FormData, so we don't set it explicitly
    return apiClient.post<{ url: string; filename: string; size: number }>(
      `/tenants/${tenantId}/upload-logo`,
      formData
    );
  },
};

