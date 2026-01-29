"use client"

import { useState, useEffect } from "react"
import { FileText, Download, Calendar, TrendingUp, Package, Users, DollarSign, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { reportingApi, TimeRange } from "@/lib/api/reporting"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils/currency"
import { usePermissions } from "@/hooks/use-permissions"

type ReportType = "revenue" | "sales" | "inventory" | "customers"

export default function ReportsContent() {
  const { canView } = usePermissions()
  const [selectedReport, setSelectedReport] = useState<ReportType>("revenue")
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.MONTH)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)

  // Reports are accessible if user can view dashboard (reports aggregate data from other resources)
  // No need for separate permission check since reports just display data they already have access to

  useEffect(() => {
    if (timeRange === TimeRange.CUSTOM && (!startDate || !endDate)) {
      return
    }
    fetchReport()
  }, [selectedReport, timeRange, startDate, endDate])

  const fetchReport = async () => {
    try {
      setIsLoading(true)
      const query: any = { timeRange }
      if (timeRange === TimeRange.CUSTOM) {
        if (!startDate || !endDate) {
          setIsLoading(false)
          return
        }
        query.startDate = startDate
        query.endDate = endDate
      }

      let data
      switch (selectedReport) {
        case "revenue":
          data = await reportingApi.getRevenueReport(query)
          break
        case "sales":
          data = await reportingApi.getDashboard(query)
          break
        case "inventory":
          data = await reportingApi.getInventoryReport()
          break
        case "customers":
          data = await reportingApi.getCustomerReport(query)
          break
        default:
          data = null
      }
      setReportData(data)
    } catch (error: any) {
      console.error('Failed to fetch report:', error)
      toast.error(error.message || 'Failed to fetch report')
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    let csvContent = ""
    let filename = ""

    switch (selectedReport) {
      case "revenue":
        filename = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`
        csvContent = generateRevenueCSV(reportData)
        break
      case "sales":
        filename = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
        csvContent = generateSalesCSV(reportData)
        break
      case "inventory":
        filename = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`
        csvContent = generateInventoryCSV(reportData)
        break
      case "customers":
        filename = `customers-report-${new Date().toISOString().split('T')[0]}.csv`
        csvContent = generateCustomersCSV(reportData)
        break
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    toast.success('Report exported successfully')
  }

  const generateRevenueCSV = (data: any): string => {
    let csv = "Revenue Report\n\n"
    csv += `Period: ${timeRange}\n`
    if (timeRange === TimeRange.CUSTOM) {
      csv += `From: ${startDate} To: ${endDate}\n`
    }
    csv += "\n"
    csv += "Metric,Value\n"
    csv += `Total Revenue,${formatCurrency(data.total || 0)}\n`
    csv += `Completed Revenue,${formatCurrency(data.completed || 0)}\n`
    csv += `Pending Revenue,${formatCurrency(data.pending || 0)}\n`
    csv += `Total Sales,${data.salesCount || 0}\n`
    csv += `Completed Sales,${data.completedSalesCount || 0}\n`
    return csv
  }

  const generateSalesCSV = (data: any): string => {
    let csv = "Sales Report\n\n"
    csv += `Period: ${timeRange}\n`
    if (timeRange === TimeRange.CUSTOM) {
      csv += `From: ${startDate} To: ${endDate}\n`
    }
    csv += "\n"
    csv += "Date,Customer,Total,Status\n"
    if (data.recentSales && Array.isArray(data.recentSales)) {
      data.recentSales.forEach((sale: any) => {
        csv += `${sale.createdAt || ''},${sale.customerName || ''},${formatCurrency(sale.total || 0)},${sale.status || ''}\n`
      })
    }
    return csv
  }

  const generateInventoryCSV = (data: any): string => {
    let csv = "Inventory Report\n\n"
    csv += "Product Name,SKU,Category,Stock Quantity,Low Stock Threshold,Status\n"
    if (data.lowStockItems && Array.isArray(data.lowStockItems)) {
      data.lowStockItems.forEach((item: any) => {
        const status = item.stockQuantity <= item.lowStockThreshold ? "Low Stock" : "In Stock"
        csv += `${item.name || ''},${item.sku || ''},${item.category || ''},${item.stockQuantity || 0},${item.lowStockThreshold || 0},${status}\n`
      })
    }
    return csv
  }

  const generateCustomersCSV = (data: any): string => {
    let csv = "Customers Report\n\n"
    csv += `Period: ${timeRange}\n`
    if (timeRange === TimeRange.CUSTOM) {
      csv += `From: ${startDate} To: ${endDate}\n`
    }
    csv += "\n"
    csv += "Customer Name,Email,Purchases,Total Spent\n"
    if (data.topCustomers && Array.isArray(data.topCustomers)) {
      data.topCustomers.forEach((customer: any) => {
        csv += `${customer.name || ''},${customer.email || ''},${customer.purchaseCount || 0},${formatCurrency(customer.totalSpent || 0)}\n`
      })
    }
    return csv
  }

  const getReportTitle = () => {
    switch (selectedReport) {
      case "revenue":
        return "Revenue Report"
      case "sales":
        return "Sales Report"
      case "inventory":
        return "Inventory Report"
      case "customers":
        return "Customers Report"
      default:
        return "Report"
    }
  }

  const getReportIcon = () => {
    switch (selectedReport) {
      case "revenue":
        return <DollarSign className="h-5 w-5" />
      case "sales":
        return <TrendingUp className="h-5 w-5" />
      case "inventory":
        return <Package className="h-5 w-5" />
      case "customers":
        return <Users className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate and export business reports
          </p>
        </div>
        {reportData && (
          <Button onClick={exportToCSV} className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Report Type</CardTitle>
          <CardDescription>Choose the type of report you want to generate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => setSelectedReport("revenue")}
              className={`p-4 border rounded-lg text-left transition-all ${
                selectedReport === "revenue"
                  ? "border-[#28a2fd] bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-[#1F1F23] hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-[#28a2fd]" />
                <div>
                  <div className="font-semibold">Revenue</div>
                  <div className="text-sm text-gray-500">Financial overview</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setSelectedReport("sales")}
              className={`p-4 border rounded-lg text-left transition-all ${
                selectedReport === "sales"
                  ? "border-[#28a2fd] bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-[#1F1F23] hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-[#28a2fd]" />
                <div>
                  <div className="font-semibold">Sales</div>
                  <div className="text-sm text-gray-500">Sales transactions</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setSelectedReport("inventory")}
              className={`p-4 border rounded-lg text-left transition-all ${
                selectedReport === "inventory"
                  ? "border-[#28a2fd] bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-[#1F1F23] hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-[#28a2fd]" />
                <div>
                  <div className="font-semibold">Inventory</div>
                  <div className="text-sm text-gray-500">Stock levels</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setSelectedReport("customers")}
              className={`p-4 border rounded-lg text-left transition-all ${
                selectedReport === "customers"
                  ? "border-[#28a2fd] bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-[#1F1F23] hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-[#28a2fd]" />
                <div>
                  <div className="font-semibold">Customers</div>
                  <div className="text-sm text-gray-500">Customer analytics</div>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {selectedReport !== "inventory" && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Set the time range for your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="timeRange">Time Range</Label>
                <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TimeRange.TODAY}>Today</SelectItem>
                    <SelectItem value={TimeRange.WEEK}>This Week</SelectItem>
                    <SelectItem value={TimeRange.MONTH}>This Month</SelectItem>
                    <SelectItem value={TimeRange.YEAR}>This Year</SelectItem>
                    <SelectItem value={TimeRange.CUSTOM}>Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {timeRange === TimeRange.CUSTOM && (
                <>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getReportIcon()}
            {getReportTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd]" />
            </div>
          ) : !reportData ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Select a report type and configure filters to generate a report
            </div>
          ) : (
            <div className="space-y-6">
              {/* Revenue Report */}
              {selectedReport === "revenue" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</div>
                        <div className="text-2xl font-bold mt-2">
                          {formatCurrency(reportData.total || 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Completed Revenue</div>
                        <div className="text-2xl font-bold mt-2">
                          {formatCurrency(reportData.completed || 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Pending Revenue</div>
                        <div className="text-2xl font-bold mt-2">
                          {formatCurrency(reportData.pending || 0)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Sales</div>
                        <div className="text-2xl font-bold mt-2">{reportData.salesCount || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Completed Sales</div>
                        <div className="text-2xl font-bold mt-2">{reportData.completedSalesCount || 0}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Sales Report */}
              {selectedReport === "sales" && reportData.recentSales && (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.recentSales.map((sale: any) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{sale.customerName}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(sale.total)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {sale.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Inventory Report */}
              {selectedReport === "inventory" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Products</div>
                        <div className="text-2xl font-bold mt-2">
                          {reportData.totalProducts || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Low Stock</div>
                        <div className="text-2xl font-bold mt-2 text-yellow-600">
                          {reportData.lowStockCount || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Out of Stock</div>
                        <div className="text-2xl font-bold mt-2 text-red-600">
                          {reportData.outOfStockCount || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Inventory Value</div>
                        <div className="text-2xl font-bold mt-2">
                          {formatCurrency(reportData.inventoryValue || 0)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {reportData.lowStockItems && reportData.lowStockItems.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Low Stock Items</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Current Stock</TableHead>
                            <TableHead>Threshold</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.lowStockItems.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.sku || '-'}</TableCell>
                              <TableCell>{item.stockQuantity || 0}</TableCell>
                              <TableCell>{item.lowStockThreshold || 0}</TableCell>
                              <TableCell>
                                <Badge variant="destructive">Low Stock</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              {/* Customers Report */}
              {selectedReport === "customers" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Customers</div>
                        <div className="text-2xl font-bold mt-2">
                          {reportData.total || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Active Customers</div>
                        <div className="text-2xl font-bold mt-2">
                          {reportData.active || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</div>
                        <div className="text-2xl font-bold mt-2">
                          {formatCurrency(reportData.revenue || 0)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {reportData.topCustomers && reportData.topCustomers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Purchases</TableHead>
                            <TableHead>Total Spent</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.topCustomers.map((customer: any) => (
                            <TableRow key={customer.id}>
                              <TableCell className="font-medium">{customer.name}</TableCell>
                              <TableCell>{customer.email || '-'}</TableCell>
                              <TableCell>{customer.purchaseCount || 0}</TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(customer.totalSpent || 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

