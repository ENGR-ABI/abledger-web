"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from "lucide-react"
import { reportingApi, TimeRange } from "@/lib/api/reporting"
import { formatCurrency } from "@/lib/utils/currency"

interface StatCard {
  title: string
  value: string
  change: string
  changeType: "increase" | "decrease" | "neutral"
  icon: React.ReactNode
  isLoading: boolean
  color: "blue" | "green" | "purple" | "orange"
}

interface OverviewStatsProps {
  timeRange?: TimeRange
}

// Helper function to get previous period's date range
function getPreviousPeriodDateRange(timeRange: TimeRange, currentStartDate: Date, currentEndDate: Date): { startDate: Date; endDate: Date } {
  const endDate = new Date(currentStartDate)
  endDate.setMilliseconds(endDate.getMilliseconds() - 1) // One millisecond before current period starts
  const startDate = new Date(endDate)

  switch (timeRange) {
    case TimeRange.TODAY:
      // Previous day (same length as current period)
      const todayDiff = currentEndDate.getTime() - currentStartDate.getTime()
      startDate.setTime(endDate.getTime() - todayDiff)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      break
    case TimeRange.WEEK:
      // Previous week (7 days before, same length)
      const weekDiff = currentEndDate.getTime() - currentStartDate.getTime()
      startDate.setTime(endDate.getTime() - weekDiff)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      break
    case TimeRange.MONTH:
      // Previous month (same length)
      const monthDiff = currentEndDate.getTime() - currentStartDate.getTime()
      startDate.setTime(endDate.getTime() - monthDiff)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      break
    case TimeRange.YEAR:
      // Previous year (same length)
      const yearDiff = currentEndDate.getTime() - currentStartDate.getTime()
      startDate.setTime(endDate.getTime() - yearDiff)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      break
    default:
      // Default to previous month (same length)
      const defaultDiff = currentEndDate.getTime() - currentStartDate.getTime()
      startDate.setTime(endDate.getTime() - defaultDiff)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
  }

  return { startDate, endDate }
}

// Helper function to calculate percentage change
function calculateChange(current: number, previous: number): { change: string; changeType: "increase" | "decrease" | "neutral" } {
  if (previous === 0) {
    if (current === 0) {
      return { change: "0%", changeType: "neutral" }
    }
    return { change: "∞", changeType: "increase" }
  }

  const percentChange = ((current - previous) / previous) * 100
  const changeType = percentChange > 0 ? "increase" : percentChange < 0 ? "decrease" : "neutral"
  const change = `${Math.abs(percentChange).toFixed(1)}%`

  return { change, changeType }
}

export default function OverviewStats({ timeRange = TimeRange.MONTH }: OverviewStatsProps) {
  const [stats, setStats] = useState<StatCard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        // Fetch current period dashboard data
        const currentData = await reportingApi.getDashboard({ timeRange })
        
        // Fetch previous period data for comparison
        const currentStartDate = new Date(currentData.dateRange.startDate)
        const currentEndDate = new Date(currentData.dateRange.endDate)
        const previousRange = getPreviousPeriodDateRange(timeRange, currentStartDate, currentEndDate)
        const previousData = await reportingApi.getDashboard({
          timeRange: TimeRange.CUSTOM,
          startDate: previousRange.startDate.toISOString().split('T')[0],
          endDate: previousRange.endDate.toISOString().split('T')[0],
        })

        // Ensure numeric values
        const currentRevenue = typeof currentData.revenue.completed === 'string' 
          ? parseFloat(currentData.revenue.completed) 
          : currentData.revenue.completed || 0
        const previousRevenue = typeof previousData.revenue.completed === 'string'
          ? parseFloat(previousData.revenue.completed)
          : previousData.revenue.completed || 0

        const currentOrders = typeof currentData.revenue.completedSalesCount === 'string'
          ? parseInt(currentData.revenue.completedSalesCount)
          : currentData.revenue.completedSalesCount || 0
        const previousOrders = typeof previousData.revenue.completedSalesCount === 'string'
          ? parseInt(previousData.revenue.completedSalesCount)
          : previousData.revenue.completedSalesCount || 0

        const currentCustomers = typeof currentData.customers.active === 'string'
          ? parseInt(currentData.customers.active)
          : currentData.customers.active || 0
        const previousCustomers = typeof previousData.customers.active === 'string'
          ? parseInt(previousData.customers.active)
          : previousData.customers.active || 0

        // Note: Products don't have a time-based comparison, so we'll skip it
        const products = typeof currentData.inventory.totalProducts === 'string'
          ? parseInt(currentData.inventory.totalProducts)
          : currentData.inventory.totalProducts || 0

        // Format number
        const formatNumber = (num: number) => {
          return new Intl.NumberFormat('en-US').format(num)
        }

        // Calculate changes
        const revenueChange = calculateChange(currentRevenue, previousRevenue)
        const ordersChange = calculateChange(currentOrders, previousOrders)
        const customersChange = calculateChange(currentCustomers, previousCustomers)

        setStats([
          {
            title: "Total Revenue",
            value: formatCurrency(currentRevenue),
            change: revenueChange.change,
            changeType: revenueChange.changeType,
            icon: <DollarSign className="h-4 w-4" />,
            isLoading: false,
            color: "green",
          },
          {
            title: "Orders",
            value: formatNumber(currentOrders),
            change: ordersChange.change,
            changeType: ordersChange.changeType,
            icon: <ShoppingCart className="h-4 w-4" />,
            isLoading: false,
            color: "blue",
          },
          {
            title: "Customers",
            value: formatNumber(currentCustomers),
            change: customersChange.change,
            changeType: customersChange.changeType,
            icon: <Users className="h-4 w-4" />,
            isLoading: false,
            color: "purple",
          },
          {
            title: "Products",
            value: formatNumber(products),
            change: "—",
            changeType: "neutral",
            icon: <Package className="h-4 w-4" />,
            isLoading: false,
            color: "orange",
          },
        ])
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        // Set error state
        setStats([
  {
    title: "Total Revenue",
            value: "$0.00",
            change: "—",
            changeType: "neutral",
    icon: <DollarSign className="h-4 w-4" />,
            isLoading: false,
            color: "green",
  },
  {
    title: "Orders",
            value: "0",
            change: "—",
            changeType: "neutral",
    icon: <ShoppingCart className="h-4 w-4" />,
            isLoading: false,
            color: "blue",
  },
  {
    title: "Customers",
            value: "0",
            change: "—",
            changeType: "neutral",
    icon: <Users className="h-4 w-4" />,
            isLoading: false,
            color: "purple",
  },
  {
    title: "Products",
            value: "0",
            change: "—",
            changeType: "neutral",
    icon: <Package className="h-4 w-4" />,
            isLoading: false,
            color: "orange",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [timeRange])

  // Color configurations for each card type
  const colorConfig = {
    blue: {
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    green: {
      iconBg: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
      borderColor: "border-green-200 dark:border-green-800",
    },
    purple: {
      iconBg: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    orange: {
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
  }

  // Show loading state
  if (isLoading || stats.length === 0) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#0F0F12] rounded-lg sm:rounded-xl p-3 sm:p-6 border border-gray-200 dark:border-[#1F1F23] animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const colors = colorConfig[stat.color]
        const periodLabel = timeRange === TimeRange.TODAY ? "yesterday" 
          : timeRange === TimeRange.WEEK ? "last week"
          : timeRange === TimeRange.MONTH ? "last month"
          : timeRange === TimeRange.YEAR ? "last year"
          : "previous period"

        return (
          <div
            key={stat.title}
            className={`bg-white dark:bg-[#0F0F12] rounded-lg sm:rounded-xl p-3 sm:p-6 border ${colors.borderColor} hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate flex-1">
                {stat.title}
              </h3>
              <div className={`${colors.iconBg} ${colors.iconColor} p-1.5 sm:p-2 rounded-lg flex-shrink-0 ml-2`}>
                {stat.icon}
              </div>
            </div>
            <div className="space-y-1 mt-2">
              <div className={`text-base sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white break-words min-w-0 ${
                stat.value.length > 15 ? 'text-sm sm:text-lg lg:text-xl' : ''
              }`}>
                {stat.value}
              </div>
              <div className="flex items-center text-xs flex-wrap gap-1">
                {stat.changeType === "increase" ? (
                  <TrendingUp className="h-3 w-3 text-green-500 dark:text-green-400 flex-shrink-0" />
                ) : stat.changeType === "decrease" ? (
                  <TrendingDown className="h-3 w-3 text-red-500 dark:text-red-400 flex-shrink-0" />
                ) : null}
                <span className={`font-medium ${
                  stat.changeType === "increase" 
                    ? "text-green-600 dark:text-green-400" 
                    : stat.changeType === "decrease"
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  {stat.change}
                </span>
                {stat.changeType !== "neutral" && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400 ml-1 hidden sm:inline">from {periodLabel}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1 sm:hidden">vs last</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
