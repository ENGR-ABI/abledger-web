/**
 * Sales API Client
 */

import apiClient from './client';
import type { Sale, CreateSaleRequest, UpdateSaleRequest, Invoice } from './types';

export const salesApi = {
  /**
   * Get all sales
   */
  async getSales(limit: number = 100, offset: number = 0, status?: string): Promise<Sale[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (status) params.append('status', status);

    return apiClient.get<Sale[]>(`/sales?${params.toString()}`);
  },

  /**
   * Get a single sale by ID
   */
  async getSale(id: string): Promise<Sale> {
    return apiClient.get<Sale>(`/sales/${id}`);
  },

  /**
   * Create a new sale
   */
  async createSale(data: CreateSaleRequest): Promise<Sale> {
    return apiClient.post<Sale>('/sales', data);
  },

  /**
   * Update a sale
   */
  async updateSale(id: string, data: UpdateSaleRequest): Promise<Sale> {
    return apiClient.put<Sale>(`/sales/${id}`, data);
  },

  /**
   * Generate an invoice for a sale
   */
  async generateInvoice(saleId: string): Promise<Invoice> {
    return apiClient.post<Invoice>(`/sales/${saleId}/invoice`, {});
  },

  /**
   * Get invoices for a sale
   */
  async getSaleInvoices(saleId: string): Promise<Invoice[]> {
    return apiClient.get<Invoice[]>(`/sales/${saleId}/invoices`);
  },

  /**
   * Get all invoices with search and filters
   */
  async getInvoices(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ invoices: Invoice[]; total: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    return apiClient.get<{ invoices: Invoice[]; total: number; limit: number; offset: number }>(
      `/invoices?${queryParams.toString()}`
    );
  },

  /**
   * Get a single invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    return apiClient.get<Invoice>(`/invoices/${invoiceId}`);
  },

  /**
   * Email an invoice (PDF only)
   * Note: Increased timeout to 60 seconds for large PDF attachments (~6MB)
   */
  async emailInvoice(
    invoiceId: string,
    pdfBase64?: string,
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `/invoices/${invoiceId}/email`,
      { pdfBase64 },
      { timeout: 60000 } // 60 seconds for large PDF attachments
    );
  },

  /**
   * Share an invoice (generate shareable link)
   */
  async shareInvoice(invoiceId: string): Promise<{ shareUrl: string }> {
    return apiClient.post<{ shareUrl: string }>(`/invoices/${invoiceId}/share`, {});
  },
};


