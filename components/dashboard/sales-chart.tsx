"use client"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"
import { useEffect, useState } from "react"
import { reportingApi, TimeRange } from "@/lib/api/reporting"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
        },
      },
    },
    title: {
      display: false,
    },
    tooltip: {
      mode: "index" as const,
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(0, 0, 0, 0.1)",
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
    x: {
      grid: {
        color: "rgba(0, 0, 0, 0.1)",
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
  },
  interaction: {
    mode: "nearest" as const,
    axis: "x" as const,
    intersect: false,
  },
}

const mobileChartOptions = {
  ...chartOptions,
  plugins: {
    ...chartOptions.plugins,
    legend: {
      ...chartOptions.plugins.legend,
      labels: {
        ...chartOptions.plugins.legend.labels,
        padding: 10,
        font: {
          size: 10,
        },
      },
    },
  },
  scales: {
    ...chartOptions.scales,
    y: {
      ...chartOptions.scales.y,
      ticks: {
        font: {
          size: 9,
        },
        maxTicksLimit: 6,
      },
    },
    x: {
      ...chartOptions.scales.x,
      ticks: {
        font: {
          size: 9,
        },
        maxRotation: 45,
        minRotation: 0,
      },
    },
  },
}

interface SalesChartProps {
  timeRange?: TimeRange
}

export function SalesChart({ timeRange = TimeRange.MONTH }: SalesChartProps) {
  const [salesChartData, setSalesChartData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsLoading(true)
        const dashboardData = await reportingApi.getDashboard({ timeRange })
        
        // Format dates for labels
        const labels = dashboardData.trends.map((trend) => {
          const date = new Date(trend.date)
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })
        
        // Prepare chart data
        const chartData = {
          labels,
          datasets: [
            {
              label: "Revenue",
              data: dashboardData.trends.map((trend) => trend.revenue),
              borderColor: "rgb(59, 130, 246)",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              tension: 0.4,
            },
            {
              label: "Orders",
              data: dashboardData.trends.map((trend) => trend.salesCount),
              borderColor: "rgb(16, 185, 129)",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              tension: 0.4,
            },
          ],
        }
        
        setSalesChartData(chartData)
      } catch (error) {
        console.error('Failed to fetch sales chart data:', error)
        // Set empty data on error
        setSalesChartData({
          labels: [],
          datasets: [
            {
              label: "Revenue",
              data: [],
              borderColor: "rgb(59, 130, 246)",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              tension: 0.4,
            },
            {
              label: "Orders",
              data: [],
              borderColor: "rgb(16, 185, 129)",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              tension: 0.4,
            },
          ],
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchChartData()
  }, [timeRange])

  if (isLoading || !salesChartData) {
    return (
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-3 sm:p-6 border border-gray-200 dark:border-[#1F1F23] w-full min-w-0">
        <div className="h-64 sm:h-80 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-3 sm:p-6 border border-gray-200 dark:border-[#1F1F23] w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Sales Overview</h3>
      </div>
      <div className="h-64 sm:h-80 w-full">
        <Line data={salesChartData} options={typeof window !== 'undefined' && window.innerWidth < 640 ? mobileChartOptions : chartOptions} />
      </div>
    </div>
  )
}

export function RevenueChart({ timeRange = TimeRange.MONTH }: SalesChartProps) {
  const [revenueChartData, setRevenueChartData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsLoading(true)
        const dashboardData = await reportingApi.getDashboard({ timeRange })
        
        // Format dates for labels
        const labels = dashboardData.trends.map((trend) => {
          const date = new Date(trend.date)
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })
        
        // Prepare chart data
        const chartData = {
          labels,
          datasets: [
            {
              label: "Revenue",
              data: dashboardData.trends.map((trend) => trend.revenue),
              backgroundColor: "rgba(139, 92, 246, 0.8)",
              borderColor: "rgb(139, 92, 246)",
              borderWidth: 1,
            },
          ],
        }
        
        setRevenueChartData(chartData)
      } catch (error) {
        console.error('Failed to fetch revenue chart data:', error)
        setRevenueChartData({
          labels: [],
          datasets: [
            {
              label: "Revenue",
              data: [],
              backgroundColor: "rgba(139, 92, 246, 0.8)",
              borderColor: "rgb(139, 92, 246)",
              borderWidth: 1,
            },
          ],
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchChartData()
  }, [timeRange])

  if (isLoading || !revenueChartData) {
    return (
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-3 sm:p-6 border border-gray-200 dark:border-[#1F1F23] w-full min-w-0">
        <div className="h-48 sm:h-64 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-3 sm:p-6 border border-gray-200 dark:border-[#1F1F23] w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Revenue</h3>
      </div>
      <div className="h-48 sm:h-64 w-full">
        <Bar data={revenueChartData} options={typeof window !== 'undefined' && window.innerWidth < 640 ? mobileChartOptions : chartOptions} />
      </div>
    </div>
  )
}
