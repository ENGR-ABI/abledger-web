/**
 * Inventory API Client
 */

import apiClient from './client';
import type { Product, CreateProductRequest, UpdateProductRequest, UpdateStockRequest, StockMovement } from './types';

export const inventoryApi = {
  /**
   * Get all products
   */
  async getProducts(limit: number = 100, offset: number = 0): Promise<Product[]> {
    return apiClient.get<Product[]>(`/inventory/products?limit=${limit}&offset=${offset}`);
  },

  /**
   * Get a single product by ID
   */
  async getProduct(id: string): Promise<Product> {
    return apiClient.get<Product>(`/inventory/products/${id}`);
  },

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    // Map frontend field names to backend DTO
    const payload = {
      name: data.name,
      sku: data.sku,
      category: data.category,
      price: data.price,
      stockQuantity: data.stockQuantity,
      lowStockThreshold: data.lowStockThreshold,
    };
    return apiClient.post<Product>('/inventory/products', payload);
  },

  /**
   * Update a product
   */
  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    // Map frontend field names to backend DTO
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.sku !== undefined) payload.sku = data.sku;
    if (data.category !== undefined) payload.category = data.category;
    if (data.price !== undefined) payload.price = data.price;
    if (data.stockQuantity !== undefined) payload.stockQuantity = data.stockQuantity;
    if (data.lowStockThreshold !== undefined) payload.lowStockThreshold = data.lowStockThreshold;

    return apiClient.put<Product>(`/inventory/products/${id}`, payload);
  },

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<void> {
    return apiClient.delete(`/inventory/products/${id}`);
  },

  /**
   * Update stock quantity
   */
  async updateStock(id: string, data: UpdateStockRequest): Promise<Product> {
    return apiClient.patch<Product>(`/inventory/products/${id}/stock`, data);
  },

  /**
   * Get stock movements for a product
   */
  async getStockMovements(productId: string, limit: number = 50): Promise<StockMovement[]> {
    return apiClient.get<StockMovement[]>(`/inventory/products/${productId}/stock-movements?limit=${limit}`);
  },

  /**
   * Get low stock alerts
   */
  async getLowStockProducts(): Promise<Product[]> {
    // This would need to be implemented in the backend, or we filter client-side
    const products = await this.getProducts(1000, 0);
    return products.filter(
      (p) => p.low_stock_threshold && p.stock_quantity <= p.low_stock_threshold
    );
  },
};


