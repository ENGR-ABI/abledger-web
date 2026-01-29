"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, X, Check, ArrowUpDown } from "lucide-react"
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
import { inventoryApi } from "@/lib/api/inventory"
import type { Product } from "@/lib/api/types"
import { formatCurrency } from "@/lib/utils/currency"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ProductSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (product: Product) => void
  excludeProductIds?: string[] // Products to exclude from selection
}

type SortOption = "name" | "price" | "stock" | "category"
type SortOrder = "asc" | "desc"

export default function ProductSelectorModal({
  open,
  onOpenChange,
  onSelect,
  excludeProductIds = [],
}: ProductSelectorModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const itemsPerPage = 20

  const fetchProducts = async (reset = false) => {
    try {
      setIsLoading(true)
      const offset = reset ? 0 : (page - 1) * itemsPerPage
      const limit = itemsPerPage

      const data = await inventoryApi.getProducts(limit, offset)

      if (reset) {
        setProducts(data)
      } else {
        setProducts((prev) => [...prev, ...data])
      }

      setHasMore(data.length === limit)
    } catch (error: any) {
      console.error('Failed to fetch products:', error)
      toast.error(error.message || 'Failed to fetch products')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchProducts(true)
      setSearchQuery("")
      setPage(1)
      setSelectedProduct(null)
    } else {
      // Reset when closed
      setProducts([])
      setPage(1)
      setHasMore(true)
    }
  }, [open])

  useEffect(() => {
    if (open && page > 1 && !isLoading) {
      fetchProducts(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      // Exclude products if specified
      if (excludeProductIds.includes(product.id)) {
        return false
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          product.name.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.barcode?.toLowerCase().includes(query)
        )
      }
      return true
    })

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "price":
          aValue = a.price || a.selling_price || 0
          bValue = b.price || b.selling_price || 0
          break
        case "stock":
          aValue = a.stock_quantity || 0
          bValue = b.stock_quantity || 0
          break
        case "category":
          aValue = (a.category || "").toLowerCase()
          bValue = (b.category || "").toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [products, searchQuery, sortBy, sortOrder, excludeProductIds])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1)
    // Reset products and fetch with search
    if (query) {
      // For search, we might want to fetch more products
      // For now, filter client-side from already loaded products
    }
  }

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  const handleSelect = (product: Product) => {
    setSelectedProduct(product)
    onSelect(product)
    onOpenChange(false)
  }

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Product</DialogTitle>
          <DialogDescription>
            Search and select a product to add to the sale
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search and Sort Controls */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, SKU, category, or barcode..."
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
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="category">Category</SelectItem>
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

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {isLoading && products.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd]" />
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="text-lg font-medium mb-2">No products found</p>
                <p className="text-sm">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "No products available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {filteredAndSortedProducts.map((product) => {
                  const isSelected = selectedProduct?.id === product.id
                  const isLowStock =
                    product.low_stock_threshold &&
                    product.stock_quantity <= product.low_stock_threshold
                  const price = product.price || product.selling_price || 0

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelect(product)}
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
                            {product.name}
                          </h3>
                          {isLowStock && (
                            <Badge variant="destructive" className="text-xs">
                              Low Stock
                            </Badge>
                          )}
                        </div>

                        {product.sku && (
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                        )}

                        {product.category && (
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <p className="text-sm font-bold text-[#28a2fd]">
                              {formatCurrency(price)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {product.stock_quantity || 0}
                            </p>
                          </div>
                        </div>
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
            Showing {filteredAndSortedProducts.length} product
            {filteredAndSortedProducts.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

