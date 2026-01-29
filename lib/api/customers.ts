/**
 * Customers API Client
 */

import apiClient from './client';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerStats } from './types';

export const customersApi = {
  /**
   * Get all customers
   */
  async getCustomers(limit: number = 100, offset: number = 0): Promise<Customer[]> {
    return apiClient.get<Customer[]>(`/customers?limit=${limit}&offset=${offset}`);
  },

  /**
   * Get a single customer by ID
   */
  async getCustomer(id: string): Promise<Customer> {
    return apiClient.get<Customer>(`/customers/${id}`);
  },

  /**
   * Get customer statistics
   */
  async getCustomerStats(id: string): Promise<CustomerStats> {
    return apiClient.get<CustomerStats>(`/customers/${id}/stats`);
  },

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    return apiClient.post<Customer>('/customers', data);
  },

  /**
   * Update a customer
   */
  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    return apiClient.put<Customer>(`/customers/${id}`, data);
  },

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<void> {
    return apiClient.delete(`/customers/${id}`);
  },
};


