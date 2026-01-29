"use client"

import { useEffect, useState } from "react"
import { Search, Eye, Download, Mail, Share2, Filter, Calendar, X } from "lucide-react"
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
import { usePermissions } from "@/hooks/use-permissions"
import { RouteProtection } from "@/components/auth/route-protection"
import type { Invoice } from "@/lib/api/types"
import { toast } from "sonner"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/currency"
import { Input as DateInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/pagination"

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PARTIAL: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

export default function InvoicesContent() {
  const { canView } = usePermissions()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)


  const [searchQuery, setSearchQuery] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const currentPage = Math.floor(offset / limit) + 1

  useEffect(() => {
    fetchInvoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, paymentStatusFilter, startDate, endDate, offset])

  // Protect route
  if (!canView('invoices')) {
    return (
      <RouteProtection resource="invoices" requiredPermission="view">
        <div />
      </RouteProtection>
    )
  }

  const fetchInvoices = async () => {
    try {
      setIsLoading(true)
      const response = await salesApi.getInvoices({
        limit,
        offset,
        search: searchQuery || undefined,
        paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      setInvoices(response.invoices)
      setTotal(response.total)
    } catch (error: any) {
      console.error('Failed to fetch invoices:', error)
      toast.error(error.message || 'Failed to fetch invoices')
      setInvoices([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setOffset(0) // Reset to first page on new search
  }

  const handlePaymentStatusChange = (value: string) => {
    setPaymentStatusFilter(value)
    setOffset(0) // Reset to first page on filter change
  }

  const handleDateFilterChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartDate(value)
    } else {
      setEndDate(value)
    }
    setOffset(0) // Reset to first page on date filter change
  }

  const handlePageChange = (page: number) => {
    setOffset((page - 1) * limit)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setSearchQuery("")
    setPaymentStatusFilter("all")
    setStartDate("")
    setEndDate("")
    setOffset(0)
  }

  const hasActiveFilters = searchQuery !== "" || paymentStatusFilter !== "all" || startDate !== "" || endDate !== ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage your invoices
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23]">
        <div className="p-4 border-b border-gray-200 dark:border-[#1F1F23] space-y-4">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by invoice number or customer name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-200 dark:border-[#1F1F23]">
              <div>
                <label className="text-sm font-medium mb-2 block">Payment Status</label>
                <Select value={paymentStatusFilter} onValueChange={handlePaymentStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateFilterChange('start', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => handleDateFilterChange('end', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-12 border border-gray-200 dark:border-[#1F1F23] text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || paymentStatusFilter !== 'all' || startDate || endDate
              ? 'No invoices found matching your filters'
              : 'No invoices yet'}
          </p>
          {(searchQuery || paymentStatusFilter !== 'all' || startDate || endDate) && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/app/invoices/${invoice.id}`}
                        className="text-[#28a2fd] hover:underline"
                      >
                        {invoice.invoiceNumber || invoice.id.substring(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.customerName || 'Unknown Customer'}</div>
                        {invoice.customerEmail && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {invoice.customerEmail}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(invoice.issuedAt || invoice.createdAt)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${paymentStatusColors[invoice.paymentStatus || 'PENDING'] || paymentStatusColors.PENDING
                          } border-0 capitalize`}
                      >
                        {invoice.paymentStatus || 'PENDING'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/app/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(total / limit)}
              onPageChange={handlePageChange}
              itemsPerPage={limit}
              totalItems={total}
            />
          )}
        </div>
      )}
    </div>
  )
}

