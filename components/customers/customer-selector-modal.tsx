"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, X, Check, ArrowUpDown, Mail, Phone, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { customersApi } from "@/lib/api/customers"
import type { Customer } from "@/lib/api/types"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface CustomerSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (customer: Customer) => void
  excludeCustomerIds?: string[] // Customers to exclude from selection
}

type SortOption = "name" | "email" | "company"
type SortOrder = "asc" | "desc"

export default function CustomerSelectorModal({
  open,
  onOpenChange,
  onSelect,
  excludeCustomerIds = [],
}: CustomerSelectorModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const itemsPerPage = 20

  const fetchCustomers = async (reset = false) => {
    try {
      setIsLoading(true)
      const offset = reset ? 0 : (page - 1) * itemsPerPage
      const limit = itemsPerPage

      const data = await customersApi.getCustomers(limit, offset)

      if (reset) {
        setCustomers(data)
      } else {
        setCustomers((prev) => [...prev, ...data])
      }

      setHasMore(data.length === limit)
    } catch (error: any) {
      console.error('Failed to fetch customers:', error)
      toast.error(error.message || 'Failed to fetch customers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchCustomers(true)
      setSearchQuery("")
      setPage(1)
      setSelectedCustomer(null)
    } else {
      // Reset when closed
      setCustomers([])
      setPage(1)
      setHasMore(true)
    }
  }, [open])

  useEffect(() => {
    if (open && page > 1 && !isLoading) {
      fetchCustomers(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    const filtered = customers.filter((customer) => {
      // Exclude customers if specified
      if (excludeCustomerIds.includes(customer.id)) {
        return false
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.phone?.toLowerCase().includes(query) ||
          customer.company?.toLowerCase().includes(query) ||
          customer.address?.toLowerCase().includes(query) ||
          customer.city?.toLowerCase().includes(query)
        )
      }
      return true
    })

    // Sort customers
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "email":
          aValue = (a.email || "").toLowerCase()
          bValue = (b.email || "").toLowerCase()
          break
        case "company":
          aValue = (a.company || "").toLowerCase()
          bValue = (b.company || "").toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [customers, searchQuery, sortBy, sortOrder, excludeCustomerIds])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    onSelect(customer)
    onOpenChange(false)
  }

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
          <DialogDescription>
            Search and select a customer for this sale
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search and Sort Controls */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, phone, company, or address..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortOrder}
              className="w-[100px]"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === "asc" ? "Asc" : "Desc"}
            </Button>
          </div>

          {/* Customers Grid */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {isLoading && customers.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd]" />
              </div>
            ) : filteredAndSortedCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="text-lg font-medium mb-2">No customers found</p>
                <p className="text-sm">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "No customers available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {filteredAndSortedCustomers.map((customer) => {
                  const isSelected = selectedCustomer?.id === customer.id

                  return (
                    <div
                      key={customer.id}
                      onClick={() => handleSelect(customer)}
                      className={`
                        relative p-4 border rounded-lg cursor-pointer transition-all
                        hover:border-[#28a2fd] hover:shadow-md
                        ${isSelected ? "border-[#28a2fd] bg-blue-50 dark:bg-blue-900/20" : ""}
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-[#28a2fd] text-white rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                            {customer.name}
                          </h3>
                        </div>

                        {customer.company && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <Building className="h-3 w-3" />
                            <span className="line-clamp-1">{customer.company}</span>
                          </div>
                        )}

                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <Mail className="h-3 w-3" />
                            <span className="line-clamp-1">{customer.email}</span>
                          </div>
                        )}

                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <Phone className="h-3 w-3" />
                            <span className="line-clamp-1">{customer.phone}</span>
                          </div>
                        )}

                        {(customer.city || customer.state) && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500">
                              {[customer.city, customer.state].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Load More Button */}
          {hasMore && !searchQuery && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-500 text-center pt-2 border-t">
            Showing {filteredAndSortedCustomers.length} customer
            {filteredAndSortedCustomers.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

