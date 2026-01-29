"use client"

import { useEffect, useState, useMemo } from "react"
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Filter, X, TrendingUp, History, Upload, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { inventoryApi } from "@/lib/api/inventory"
import type { Product } from "@/lib/api/types"
import { usePermissions } from "@/hooks/use-permissions"
import { RouteProtection } from "@/components/auth/route-protection"
import { toast } from "sonner"
import Link from "next/link"
import { Pagination } from "@/components/ui/pagination"
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils/currency"
import { StockAdjustmentDialog } from "./stock-adjustment-dialog"
import { StockMovementHistoryDialog } from "./stock-movement-history-dialog"
import { BulkImportExportDialog } from "./bulk-import-export-dialog"

const formatCurrency = (amount?: number) => {
  if (!amount) return formatCurrencyUtil(0)
  return formatCurrencyUtil(amount)
}

export default function ProductsContent() {
  const { canManage, canView } = usePermissions()
  const [products, setProducts] = useState<Product[]>([])


  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [showFilters, setShowFilters] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isStockAdjustmentDialogOpen, setIsStockAdjustmentDialogOpen] = useState(false)
  const [productForStockAdjustment, setProductForStockAdjustment] = useState<Product | null>(null)
  const [isStockHistoryDialogOpen, setIsStockHistoryDialogOpen] = useState(false)
  const [productForStockHistory, setProductForStockHistory] = useState<Product | null>(null)
  const [isBulkImportExportDialogOpen, setIsBulkImportExportDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stockQuantity: "",
    lowStockThreshold: "",
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const data = await inventoryApi.getProducts(1000, 0)
      setProducts(data)
    } catch (error: any) {
      console.error('Failed to fetch products:', error)
      toast.error(error.message || 'Failed to fetch products')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await inventoryApi.createProduct({
        name: formData.name,
        sku: formData.sku || undefined,
        category: formData.category || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : undefined,
        lowStockThreshold: formData.lowStockThreshold ? parseInt(formData.lowStockThreshold) : undefined,
      })
      toast.success('Product created successfully')
      setIsCreateDialogOpen(false)
      resetForm()
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create product')
    }
  }

  const handleEdit = async () => {
    if (!selectedProduct) return

    try {
      await inventoryApi.updateProduct(selectedProduct.id, {
        name: formData.name,
        sku: formData.sku || undefined,
        category: formData.category || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : undefined,
        lowStockThreshold: formData.lowStockThreshold ? parseInt(formData.lowStockThreshold) : undefined,
      })
      toast.success('Product updated successfully')
      setIsEditDialogOpen(false)
      setSelectedProduct(null)
      resetForm()
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product')
    }
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!productToDelete) return

    try {
      await inventoryApi.deleteProduct(productToDelete.id)
      toast.success('Product deleted successfully')
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product')
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      price: "",
      stockQuantity: "",
      lowStockThreshold: "",
    })
  }

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku || "",
      category: product.category || "",
      price: product.price?.toString() || "",
      stockQuantity: product.stock_quantity?.toString() || "",
      lowStockThreshold: product.low_stock_threshold?.toString() || "",
    })
    setIsEditDialogOpen(true)
  }

  const isLowStock = (product: Product) => {
    return product.low_stock_threshold && product.stock_quantity <= product.low_stock_threshold
  }

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter((cat): cat is string => Boolean(cat)))
    return Array.from(cats).sort()
  }, [products])

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = searchQuery === "" || (
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      const matchesStockStatus = stockStatusFilter === "all" ||
        (stockStatusFilter === "low" && isLowStock(product)) ||
        (stockStatusFilter === "in_stock" && !isLowStock(product) && (product.stock_quantity || 0) > 0) ||
        (stockStatusFilter === "out_of_stock" && (product.stock_quantity || 0) === 0)
      return matchesSearch && matchesCategory && matchesStockStatus
    })
  }, [products, searchQuery, categoryFilter, stockStatusFilter])

  // Paginate filtered products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredProducts.slice(start, end)
  }, [filteredProducts, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setCategoryFilter("all")
    setStockStatusFilter("all")
    setSearchQuery("")
    setCurrentPage(1)
  }

  const hasActiveFilters = categoryFilter !== "all" || stockStatusFilter !== "all" || searchQuery !== ""

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, stockStatusFilter])

  // Protect route
  if (!canView('inventory')) {
    return (
      <RouteProtection resource="inventory" requiredPermission="view">
        <div />
      </RouteProtection>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your inventory products
          </p>
        </div>
        {canManage('inventory') && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkImportExportDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import/Export
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Product</DialogTitle>
                  <DialogDescription>
                    Add a new product to your inventory
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Enter SKU"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Enter category"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stockQuantity">Stock Quantity</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={!formData.name}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23]">
        <div className="p-4 border-b border-gray-200 dark:border-[#1F1F23] space-y-4">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, SKU, or category..."
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
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Stock Status</label>
                <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {hasActiveFilters ? 'No products match your filters' : 'No products yet. Create your first product!'}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{product.stock_quantity || 0}</span>
                        {isLowStock(product) && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isLowStock(product) ? (
                        <Badge variant="destructive">Low Stock</Badge>
                      ) : (
                        <Badge variant="default">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage('inventory') && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setProductForStockAdjustment(product)
                              setIsStockAdjustmentDialogOpen(true)
                            }}
                            title="Adjust Stock"
                          >
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setProductForStockHistory(product)
                              setIsStockHistoryDialogOpen(true)
                            }}
                            title="View Stock History"
                          >
                            <History className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(product)}
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={filteredProducts.length}
              />
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-stockQuantity">Stock Quantity</Label>
              <Input
                id="edit-stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="edit-lowStockThreshold"
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{productToDelete?.name}</strong>?
              This action cannot be undone. All product data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        open={isStockAdjustmentDialogOpen}
        onOpenChange={setIsStockAdjustmentDialogOpen}
        product={productForStockAdjustment}
        onSuccess={() => {
          fetchProducts()
          setProductForStockAdjustment(null)
        }}
      />

      {/* Stock Movement History Dialog */}
      <StockMovementHistoryDialog
        open={isStockHistoryDialogOpen}
        onOpenChange={setIsStockHistoryDialogOpen}
        productId={productForStockHistory?.id || null}
        productName={productForStockHistory?.name}
      />

      {/* Bulk Import/Export Dialog */}
      <BulkImportExportDialog
        open={isBulkImportExportDialogOpen}
        onOpenChange={setIsBulkImportExportDialogOpen}
        products={products}
        onSuccess={() => {
          fetchProducts()
        }}
      />
    </div>
  )
}


