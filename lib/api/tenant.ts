/**
 * Tenant API methods
 */

import apiClient from './client';
import type { CreateTenantRequest, CreateTenantResponse } from './types';

export const tenantApi = {
  /**
   * Create new tenant (with owner user)
   * If verificationToken is provided, it will be sent in Authorization header
   */
  async createTenant(data: CreateTenantRequest & { verificationToken?: string }): Promise<CreateTenantResponse> {
    const headers: Record<string, string> = {};
    
    // If verification token provided, use it instead of regular auth token
    if (data.verificationToken) {
      headers['Authorization'] = `Bearer ${data.verificationToken}`;
    }
    
    return apiClient.post<CreateTenantResponse>('/tenants', data, { headers });
  },

  /**
   * Get tenant details
   */
  async getTenant(id: string): Promise<any> {
    return apiClient.get(`/tenants/${id}`);
  },

  /**
   * Send welcome email for a tenant
   */
  async sendWelcomeEmail(tenantId: string): Promise<void> {
    return apiClient.post(`/tenants/${tenantId}/send-welcome-email`, {});
  },
};

