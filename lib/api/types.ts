/**
 * API Response Types
 */

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  code?: string; // Error code (e.g., 'TRIAL_EXPIRED')
  upgradeUrl?: string; // URL to upgrade page for trial expiration errors
  allowedOperations?: string[]; // Allowed operations for trial read-only access
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Authentication Types
 */
export type UserRole = 'PLATFORM_ADMIN' | 'TENANT_OWNER' | 'TENANT_ADMIN' | 'STAFF' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  tenantId: string | null;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  // Generate slug from company name
  slug?: string;
}

export interface RegisterResponse {
  accessToken: string;
  user: User;
  tenantId: string;
}

export interface SendVerificationCodeRequest {
  email: string;
  fullName: string;
  companyName: string;
}

export interface SendVerificationCodeResponse {
  message: string;
  expiresIn?: number; // seconds
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  verified: boolean;
  token?: string; // Temporary token for completing registration
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
}

export interface CreateTenantResponse {
  id: string;
  name: string;
  slug: string;
}

export interface AuthMeResponse {
  user: User;
}

/**
 * Product Types
 */
export interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  price?: number;
  stock_quantity: number;
  low_stock_threshold?: number;
  barcode?: string;
  description?: string;
  cost_price?: number;
  selling_price?: number;
  unit?: string;
  supplier?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateProductRequest {
  name: string;
  sku?: string;
  category?: string;
  price?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
}

export interface UpdateProductRequest {
  name?: string;
  sku?: string;
  category?: string;
  price?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
}

export interface UpdateStockRequest {
  change: number;
  reason?: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  change: number;
  reason?: string;
  previous_quantity?: number;
  new_quantity?: number;
  created_at?: string;
}

/**
 * Customer Types
 */
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  tax_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export interface CustomerStats {
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
}

/**
 * Sale Types
**/
export interface SaleItem {
  id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Sale {
  id: string;
  customer_id: string;
  customer_name?: string;
  sale_number?: string;
  total: number;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  discount_amount?: number;
  discount_type?: string;
  payment_status?: string;
  payment_method?: string;
  paid_amount?: number;
  paid_at?: string;
  status?: string;
  notes?: string;
  created_at?: string;
  completed_at?: string;
  updated_at?: string;
  items?: SaleItem[];
}

export interface CreateSaleRequest {
  customerId: string;
  total?: number; // Optional, will be calculated from items, discount, and tax
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  notes?: string;
  discountAmount?: number;
  discountType?: 'percentage' | 'fixed';
  taxRate?: number;
  taxAmount?: number;
  paidAmount?: number; // Amount actually paid (for PARTIAL or PAID status)
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface UpdateSaleRequest {
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  notes?: string;
  total?: number;
  discountAmount?: number;
  discountType?: 'percentage' | 'fixed';
  taxRate?: number;
  taxAmount?: number;
  paidAmount?: number; // Amount actually paid (for PARTIAL or PAID status)
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

/**
 * Invoice Types
**/
export interface Invoice {
  id: string;
  saleId?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  invoiceNumber?: string;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  total: number;
  dueDate?: string;
  paymentStatus?: string;
  paidAmount?: number;
  paidAt?: string;
  issuedAt?: string;
  pdfUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  saleNumber?: string;
  saleStatus?: string;
}

/**
 * Notification Types
 */
export type NotificationType = 'low_stock' | 'payment_reminder' | 'system' | 'sale' | 'invoice';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  read_at?: string;
  action_url?: string;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

/**
 * Platform Admin Types
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  schema_name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'TRIAL';
  subscription_plan?: string;
  subscription_status?: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  trial_started_at?: string;
  trial_ends_at?: string;
  subscription_started_at?: string;
  subscription_ends_at?: string;
  created_at: string;
  updated_at?: string;
  owner_id?: string;
  owner_email?: string;
}

export interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  trialTenants: number;
  totalUsers: number;
  totalSales: number;
  totalRevenue: number;
  recentTenants: Tenant[];
  tenantsByPlan: Record<string, number>;
  tenantsByStatus: Record<string, number>;
}
