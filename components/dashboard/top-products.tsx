"use client"

import { useEffect, useState } from "react"
import { Package, TrendingUp } from "lucide-react"
import { reportingApi, TimeRange } from "@/lib/api/reporting"
import { formatCurrency } from "@/lib/utils/currency"

interface ProductDisplay {
  id: string
  name: string
  sku: string | null
  category: string | null
  stockQuantity: number
  totalQuantitySold: number
  totalRevenue: number
}

interface TopProductsProps {
  timeRange?: TimeRange
}

export default function TopProducts({ timeRange = TimeRange.MONTH }: TopProductsProps) {
  const [products, setProducts] = useState<ProductDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setIsLoading(true)
        // Fetch dashboard data which includes top products
        const dashboardData = await reportingApi.getDashboard({ timeRange })
        
        // Use top-selling products if available, otherwise show empty state
        const topProducts = dashboardData.inventory.topProducts || []
        
        setProducts(topProducts)
      } catch (error) {
        console.error('Failed to fetch top products:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopProducts()
  }, [timeRange])


  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products</h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No products available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products</h3>
        <TrendingUp className="h-5 w-5 text-gray-400" />
      </div>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#093c93]/10 to-[#28a2fd]/10 rounded-full text-sm font-medium text-[#28a2fd] shrink-0">
                {index + 1}
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 shrink-0">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {product.sku && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                  )}
                  {product.category && (
                    <>
                      {product.sku && <span className="text-xs text-gray-400">•</span>}
                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right ml-4 shrink-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(product.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {product.totalQuantitySold} {product.totalQuantitySold === 1 ? 'sold' : 'sold'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Stock: {product.stockQuantity}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
