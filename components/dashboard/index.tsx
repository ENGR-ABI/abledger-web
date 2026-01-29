"use client"

import { useState } from "react"
import { TimeRange } from "@/lib/api/reporting"
import OverviewStats from "./overview-stats"
import { SalesChart, RevenueChart } from "./sales-chart"
import RecentOrders from "./recent-orders"
import TopProducts from "./top-products"
import CustomerAnalytics from "./customer-analytics"
import ActivityFeed from "./activity-feed"
import FinancialWidgets from "./financial-widgets"
import DateRangeFilter from "./date-range-filter"

export default function DashboardContent() {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.MONTH)

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Header with Date Range Filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <DateRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Overview Stats */}
      <OverviewStats timeRange={timeRange} />

      {/* Charts Row - Stack on mobile, side by side on desktop */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
        <div className="w-full min-w-0">
          <SalesChart timeRange={timeRange} />
        </div>
        <div className="w-full min-w-0">
          <RevenueChart timeRange={timeRange} />
        </div>
      </div>

      {/* Main Content Grid - Stack on mobile, responsive grid on larger screens */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left Column - Full width on mobile, 2/3 width on desktop */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 w-full min-w-0">
          <RecentOrders timeRange={timeRange} />
          <TopProducts timeRange={timeRange} />
        </div>

        {/* Right Column - Full width on mobile, 1/3 width on desktop */}
        <div className="space-y-4 sm:space-y-6 w-full min-w-0">
          <CustomerAnalytics timeRange={timeRange} />
          {/* <ActivityFeed /> */}
        </div>
      </div>
    </div>
  )
}
