"use client"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { useEffect, useState } from "react"
import { reportingApi, TimeRange } from "@/lib/api/reporting"
import { formatCurrency } from "@/lib/utils/currency"

ChartJS.register(ArcElement, Tooltip, Legend)

interface CustomerAnalyticsProps {
  timeRange?: TimeRange
}

export default function CustomerAnalytics({ timeRange = TimeRange.MONTH }: CustomerAnalyticsProps) {
  const [customerData, setCustomerData] = useState<any>(null)
  const [customerStats, setCustomerStats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCustomers, setTotalCustomers] = useState(0)

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setIsLoading(true)
        const dashboardData = await reportingApi.getDashboard({ timeRange })
        
        const total = dashboardData.customers.total
        const active = dashboardData.customers.active
        const newCustomers = active // Simplified - in a real app you'd track new vs returning
        const returningCustomers = total > active ? total - active : 0
        
        // Calculate percentages
        const newPercent = total > 0 ? Math.round((newCustomers / total) * 100) : 0
        const returningPercent = total > 0 ? Math.round((returningCustomers / total) * 100) : 0
        
        // Top customers count (simplified - using top 5 as VIP)
        const vipCount = dashboardData.customers.topCustomers.length
        const vipPercent = total > 0 ? Math.round((vipCount / total) * 100) : 0
        
        const formatNumber = (num: number) => {
          return new Intl.NumberFormat('en-US').format(num)
        }
        
        const stats = [
          {
            label: "Active Customers",
            value: formatNumber(active),
            percentage: `${newPercent}%`,
            color: "bg-blue-500",
          },
          {
            label: "Total Customers",
            value: formatNumber(total),
            percentage: `${returningPercent}%`,
            color: "bg-green-500",
          },
          {
            label: "Top Customers",
            value: formatNumber(vipCount),
            percentage: `${vipPercent}%`,
            color: "bg-yellow-500",
          },
        ]
        
        const chartData = {
          labels: ["Active Customers", "Total Customers", "Top Customers"],
          datasets: [
            {
              data: [active, returningCustomers, vipCount],
              backgroundColor: ["rgba(59, 130, 246, 0.8)", "rgba(16, 185, 129, 0.8)", "rgba(245, 158, 11, 0.8)"],
              borderColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(245, 158, 11)"],
              borderWidth: 2,
            },
          ],
        }
        
        setCustomerData(chartData)
        setCustomerStats(stats)
        setTotalCustomers(total)
      } catch (error) {
        console.error('Failed to fetch customer analytics:', error)
        setCustomerData({
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 2,
          }],
        })
        setCustomerStats([])
        setTotalCustomers(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomerData()
  }, [timeRange])

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.label}: ${context.parsed}%`,
      },
    },
  },
}

  if (isLoading || !customerData) {
    return (
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-3 sm:p-6 border border-gray-200 dark:border-[#1F1F23] w-full min-w-0">
        <div className="h-64 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-3 sm:p-6 border border-gray-200 dark:border-[#1F1F23] w-full min-w-0">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Customer Analytics</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Chart - Full width on mobile */}
        {customerData.datasets[0].data.some((val: number) => val > 0) && (
          <div className="h-32 sm:h-48 w-full flex justify-center">
            <div className="w-32 sm:w-48 h-32 sm:h-48">
              <Doughnut data={customerData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Stats - Below chart on mobile */}
        <div className="space-y-3 sm:space-y-4">
          {customerStats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className={`w-3 h-3 rounded-full ${stat.color} flex-shrink-0`} />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{stat.label}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.percentage}</p>
              </div>
            </div>
          ))}

          <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Total Customers</span>
              <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{formatNumber(totalCustomers)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
