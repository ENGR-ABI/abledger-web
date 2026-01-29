import { apiClient } from './client';

export interface InitializePaymentRequest {
  tenantId: string;
  customerEmail: string;
  customerName?: string;
  plan: 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency?: string;
  callbackUrl?: string;
  currentPlan?: string;
  subscriptionEndsAt?: string;
}

export interface InitializePaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  paymentId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  status: string;
  payment: {
    id: string;
    reference: string;
    amount: number;
    currency: string;
    paidAt: string | null;
  };
  auth?: {
    accessToken: string;
    refreshToken: string;
    user: any;
  };
}

export interface PaymentHistoryItem {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  billingCycle: string;
  customerEmail: string;
  paidAt: string | null;
  createdAt: string;
}

export const paymentApi = {
  /**
   * Initialize a payment transaction
   */
  async initializePayment(data: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    return apiClient.post<InitializePaymentResponse>('/payments/initialize', data);
  },

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    return apiClient.get<VerifyPaymentResponse>(`/payments/verify/${reference}`);
  },

  /**
   * Get payment history for a tenant
   */
  async getPaymentHistory(tenantId: string, limit?: number, offset?: number): Promise<PaymentHistoryItem[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    return apiClient.get<PaymentHistoryItem[]>(`/payments/history/${tenantId}?${params.toString()}`);
  },
};

