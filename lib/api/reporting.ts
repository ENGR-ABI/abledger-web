import apiClient from './client';

export enum TimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export interface DashboardQuery {
  timeRange?: TimeRange;
  startDate?: string;
  endDate?: string;
}

export interface DashboardRevenue {
  total: number;
  completed: number;
  pending: number;
  salesCount: number;
  completedSalesCount: number;
}

export interface DashboardTrend {
  date: string;
  salesCount: number;
  revenue: number;
}

export interface DashboardInventory {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  inventoryValue: number;
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    lowStockThreshold: number;
  }>;
  topProducts?: Array<{
    id: string;
    name: string;
    sku: string | null;
    category: string | null;
    stockQuantity: number;
    totalQuantitySold: number;
    totalRevenue: number;
  }>;
}

export interface DashboardCustomer {
  id: string;
  name: string;
  email: string;
  purchaseCount: number;
  totalSpent: number;
}

export interface DashboardCustomers {
  total: number;
  active: number;
  revenue: number;
  topCustomers: DashboardCustomer[];
}

export interface DashboardRecentSale {
  id: string;
  total: number;
  status: string;
  customerName: string;
  createdAt: string;
}

export interface DashboardData {
  revenue: DashboardRevenue;
  trends: DashboardTrend[];
  inventory: DashboardInventory;
  customers: DashboardCustomers;
  recentSales: DashboardRecentSale[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export const reportingApi = {
  /**
   * Get dashboard data
   */
  async getDashboard(query?: DashboardQuery): Promise<DashboardData> {
    const params = new URLSearchParams();
    if (query?.timeRange) {
      // Ensure we pass the enum value as a string
      params.append('timeRange', String(query.timeRange));
    }
    if (query?.startDate) {
      params.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      params.append('endDate', query.endDate);
    }

    const queryString = params.toString();
    const url = `/reporting/dashboard${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<DashboardData>(url);
  },

  /**
   * Get revenue report
   */
  async getRevenueReport(query?: DashboardQuery): Promise<any> {
    const params = new URLSearchParams();
    if (query?.timeRange) {
      params.append('timeRange', String(query.timeRange));
    }
    if (query?.startDate) {
      params.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      params.append('endDate', query.endDate);
    }

    const queryString = params.toString();
    const url = `/reporting/revenue${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(url);
  },

  /**
   * Get inventory report
   */
  async getInventoryReport(): Promise<any> {
    return apiClient.get('/reporting/inventory');
  },

  /**
   * Get customer report
   */
  async getCustomerReport(query?: DashboardQuery): Promise<any> {
    const params = new URLSearchParams();
    if (query?.timeRange) {
      params.append('timeRange', String(query.timeRange));
    }
    if (query?.startDate) {
      params.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      params.append('endDate', query.endDate);
    }

    const queryString = params.toString();
    const url = `/reporting/customers${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(url);
  },
};

