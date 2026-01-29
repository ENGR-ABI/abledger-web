import { apiClient } from './client';

export interface PlanFeature {
  id: string;
  featureText: string;
  displayOrder: number;
}

export interface PricingPlan {
  id: string;
  planCode: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: string;
  isTrial: boolean;
  isPopular: boolean;
  isActive?: boolean;
  displayOrder: number;
  maxStaffUsers?: number;
  maxLocations?: number;
  trialDays?: number;
  features: PlanFeature[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePricingPlanDto {
  planCode: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billingCycle?: string;
  isTrial?: boolean;
  isPopular?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  maxStaffUsers?: number;
  maxLocations?: number;
  trialDays?: number;
  features?: Array<{ featureText: string; displayOrder?: number }>;
}

export type UpdatePricingPlanDto = Partial<CreatePricingPlanDto>;

class PricingApi {
  /**
   * Get all active pricing plans (for public/landing page)
   */
  async getActivePlans(): Promise<PricingPlan[]> {
    // apiClient.get() already extracts response.data.data || response.data
    return await apiClient.get<PricingPlan[]>('/pricing/plans');
  }

  /**
   * Get all pricing plans (for admin)
   */
  async getAllPlans(): Promise<PricingPlan[]> {
    // apiClient.get() already extracts response.data.data || response.data
    return await apiClient.get<PricingPlan[]>('/pricing/admin/plans');
  }

  /**
   * Get a single pricing plan by ID
   */
  async getPlanById(id: string): Promise<PricingPlan> {
    // apiClient.get() already extracts response.data.data || response.data
    return await apiClient.get<PricingPlan>(`/pricing/admin/plans/${id}`);
  }

  /**
   * Create a new pricing plan
   */
  async createPlan(dto: CreatePricingPlanDto): Promise<PricingPlan> {
    // apiClient.post() already extracts response.data.data || response.data
    return await apiClient.post<PricingPlan>('/pricing/admin/plans', dto);
  }

  /**
   * Update a pricing plan
   */
  async updatePlan(id: string, dto: UpdatePricingPlanDto): Promise<PricingPlan> {
    // apiClient.put() already extracts response.data.data || response.data
    return await apiClient.put<PricingPlan>(`/pricing/admin/plans/${id}`, dto);
  }

  /**
   * Delete a pricing plan
   */
  async deletePlan(id: string): Promise<void> {
    await apiClient.delete(`/pricing/admin/plans/${id}`);
  }
}

export const pricingApi = new PricingApi();

