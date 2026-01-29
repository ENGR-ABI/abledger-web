/**
 * Contact API Client
 */

import apiClient from './client';

export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

export const contactApi = {
  /**
   * Submit contact form
   */
  async submitContact(data: ContactFormData): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/tenants/contact', data);
  },
};

