"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Eye, FileText, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { salesApi } from "@/lib/api/sales"
import { customersApi } from "@/lib/api/customers"
import { usePermissions } from "@/hooks/use-permissions"
import { RouteProtection } from "@/components/auth/route-protection"
import type { Sale } from "@/lib/api/types"
import { toast } from "sonner"
import Link from "next/link"
import { Pagination } from "@/components/ui/pagination"
import { formatCurrency } from "@/lib/utils/currency"

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function SalesContent() {
  const { canManage, canView } = usePermissions()
  const [sales, setSales] = useState<Sale[]>([])


  const [customers, setCustomers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchSales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, paymentStatusFilter])

  // Protect route
  if (!canView('sales')) {
    return (
      <RouteProtection resource="sales" requiredPermission="view">
        <div />
      </RouteProtection>
    )
  }

  const fetchSales = async () => {
    try {
      setIsLoading(true)
      const offset = (currentPage - 1) * itemsPerPage
      const status = statusFilter !== "all" ? statusFilter : undefined
      const salesData = await salesApi.getSales(itemsPerPage + 1, offset, status) // Fetch one extra to check if there are more
      const hasMore = salesData.length > itemsPerPage
      const actualSales = salesData.slice(0, itemsPerPage)
      setSales(actualSales)
      // Estimate total: if we got a full page + 1, there are likely more
      setTotalItems(hasMore ? (currentPage * itemsPerPage) + 1 : (currentPage - 1) * itemsPerPage + actualSales.length)

      // Optimize: Use customer_name from sale if available, otherwise fetch in batch
      const customerMap: Record<string, string> = {}

      // First, use customer_name from sale if available
      salesData.forEach((sale: Sale) => {
        if (sale.customer_name) {
          customerMap[sale.customer_id] = sale.customer_name
        }
      })

      // Get unique customer IDs that we don't have names for
      const missingCustomerIds = [...new Set(
        salesData
          .filter((sale: Sale) => !customerMap[sale.customer_id])
          .map((sale: Sale) => sale.customer_id)
      )]

      // Fetch missing customers in batch (fetch all customers and map them)
      if (missingCustomerIds.length > 0) {
        try {
          const allCustomers = await customersApi.getCustomers(1000, 0)
          const customerLookup = new Map(allCustomers.map(c => [c.id, c.name]))

          missingCustomerIds.forEach((id) => {
            customerMap[id] = customerLookup.get(id) || 'Unknown Customer'
          })
        } catch (error) {
          // If batch fetch fails, mark as unknown
          missingCustomerIds.forEach((id) => {
            if (!customerMap[id]) {
              customerMap[id] = 'Unknown Customer'
            }
          })
        }
      }

      setCustomers(customerMap)
    } catch (error: any) {
      console.error('Failed to fetch sales:', error)
      toast.error(error.message || 'Failed to fetch sales')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSales = sales.filter((sale) => {
    const customerName = customers[sale.customer_id] || ''
    const matchesSearch = searchQuery === "" || (
      sale.sale_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatCurrency(sale.total).toLowerCase().includes(searchQuery.toLowerCase())
    )
    const matchesPaymentStatus = paymentStatusFilter === "all" || sale.payment_status === paymentStatusFilter
    return matchesSearch && matchesPaymentStatus
  })

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setPaymentStatusFilter("all")
    setSearchQuery("")
    setCurrentPage(1)
  }

  const hasActiveFilters = statusFilter !== "all" || paymentStatusFilter !== "all" || searchQuery !== ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage your sales transactions
          </p>
        </div>
        {canManage('sales') && (
          <Link href="/app/sales/new">
            <Button className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              New Sale
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23]">
        <div className="p-4 border-b border-gray-200 dark:border-[#1F1F23] space-y-4">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by sale number, customer, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-gray-100 dark:bg-gray-800" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-[#1F1F23]">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Payment Status</label>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading sales...</div>
        ) : filteredSales.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No sales found' : 'No sales yet. Create your first sale!'}
            {!searchQuery && (
              <div className="mt-4">
                <Link href="/app/sales/new">
                  <Button variant="outline">Create Sale</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">
                    {(() => {
                      if (sale.sale_number) {
                        // Replace SALE- with SL- if present, otherwise use as is
                        return sale.sale_number.replace(/^SALE-/, 'SL-')
                      }
                      // Use shorter ID format: SL- followed by first 6 characters
                      return `SL-${sale.id.substring(0, 6)}`
                    })()}
                  </TableCell>
                  <TableCell>{customers[sale.customer_id] || 'Unknown Customer'}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(sale.total)}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[sale.status || 'pending'] || statusColors.pending} border-0 capitalize`}>
                      {sale.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sale.payment_status && (
                      <Badge variant="outline" className="capitalize">
                        {sale.payment_status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(sale.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/app/sales/${sale.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {sale.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await salesApi.generateInvoice(sale.id)
                              toast.success('Invoice generated successfully')
                            } catch (error: any) {
                              toast.error(error.message || 'Failed to generate invoice')
                            }
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!isLoading && filteredSales.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / itemsPerPage)}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        )}
      </div>
    </div>
  )
}


