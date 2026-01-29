"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { reportingApi, TimeRange } from "@/lib/api/reporting"
import Link from "next/link"

interface RecentOrdersProps {
  timeRange?: TimeRange
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

import { formatCurrency } from "@/lib/utils/currency"

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export default function RecentOrders({ timeRange = TimeRange.MONTH }: RecentOrdersProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        // Fetch dashboard data which includes recent sales
        const dashboardData = await reportingApi.getDashboard({ timeRange })
        
        // Transform recent sales to order display format
        const ordersWithCustomers = dashboardData.recentSales.map((sale) => ({
          id: sale.id.substring(0, 8), // Short ID for display
          customer: {
            name: sale.customerName || 'Unknown Customer',
            email: undefined,
          },
          total: sale.total,
          status: sale.status || 'pending',
          date: sale.createdAt,
        }))

        setOrders(ordersWithCustomers)
      } catch (error) {
        console.error('Failed to fetch recent orders:', error)
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [timeRange])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
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

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
          <Link href="/app/sales" className="text-sm text-[#28a2fd] hover:underline">
            View all
          </Link>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No orders yet</p>
          <Link href="/app/sales" className="text-sm text-[#28a2fd] hover:underline mt-2 inline-block">
            Create your first sale
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
        <Link href="/app/sales" className="text-sm text-[#28a2fd] hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/app/sales/${order.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors block"
          >
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {order.customer.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customer.name}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">#{order.id}</span>
                </div>
                {order.customer.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{order.customer.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={`${statusColors[order.status] || statusColors.pending} border-0 capitalize`}>
                {order.status}
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.date)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
