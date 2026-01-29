"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileText, Download, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { salesApi } from "@/lib/api/sales"
import { customersApi } from "@/lib/api/customers"
import { inventoryApi } from "@/lib/api/inventory"
import { usePermissions } from "@/hooks/use-permissions"
import { RouteProtection } from "@/components/auth/route-protection"
import type { Sale, Invoice, Product } from "@/lib/api/types"
import { toast } from "sonner"
import Link from "next/link"
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/currency"
import { useTenantSettings } from "@/contexts/tenant-settings-context"
import { Plus, Trash2, Pencil, Save, X, Printer, Share2, Loader2 } from "lucide-react"
import { useRef } from "react"
import {
  generateInvoicePDFAdvanced,
  generateInvoiceImageAdvanced
} from "@/lib/utils/invoice-generator"
import InvoiceView from "@/components/invoices/invoice-view"
import { tenantsApi } from "@/lib/api/tenants"
import { useAuth } from "@/contexts/auth-context"
import ProductSelectorModal from "@/components/products/product-selector-modal"

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function SaleDetailContent() {
  const { canManage, canView } = usePermissions()
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const saleId = params.id as string
  const invoiceContainerRef = useRef<HTMLDivElement>(null)
  const [sale, setSale] = useState<Sale | null>(null)
  const [customerName, setCustomerName] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tenantBranding, setTenantBranding] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [editFormData, setEditFormData] = useState({
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    discountAmount: 0,
    discountType: 'fixed' as 'percentage' | 'fixed',
    taxRate: 0,
    paidAmount: 0,
    notes: '',
  })
  const [editItems, setEditItems] = useState<Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
  }>>([])

  // Item edit modal state
  const [isItemEditModalOpen, setIsItemEditModalOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [itemEditData, setItemEditData] = useState<{
    productId: string
    quantity: number
    unitPrice: number
  } | null>(null)
  // Delete item confirmation dialog state
  const [isDeleteItemDialogOpen, setIsDeleteItemDialogOpen] = useState(false)
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState<number | null>(null)

  // Product selector modal state
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false)
  const [productSelectorContext, setProductSelectorContext] = useState<'add' | 'edit'>('add')

  // Local sale items state for editing
  const [saleItems, setSaleItems] = useState<Array<{
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    total: number
  }>>([])

  const { settings } = useTenantSettings()

  // Get currency symbol from tenant settings
  const currencySymbol = getCurrencySymbol(settings?.currency)



  useEffect(() => {
    if (saleId) {
      fetchSaleData()
    }
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId])

  // Protect route
  if (!canView('sales')) {
    return (
      <RouteProtection resource="sales" requiredPermission="view">
        <div />
      </RouteProtection>
    )
  }

  const fetchProducts = async () => {
    try {
      const productsData = await inventoryApi.getProducts(1000, 0)
      setProducts(productsData)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchSaleData = async () => {
    try {
      setIsLoading(true)
      const [saleData, invoicesData] = await Promise.all([
        salesApi.getSale(saleId),
        salesApi.getSaleInvoices(saleId).catch(() => []),
      ])

      setSale(saleData)
      setInvoices(invoicesData)

      // Fetch tenant branding if we have invoices
      if (invoicesData.length > 0 && user?.tenantId) {
        try {
          const settings = await tenantsApi.getTenantSettings(user.tenantId)
          setTenantBranding(settings)
        } catch (error) {
          console.error('Failed to fetch tenant branding:', error)
        }
      }

      // Initialize sale items for editing
      if (saleData.items && saleData.items.length > 0) {
        setSaleItems(saleData.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name || 'Unknown Product',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })))
      } else {
        setSaleItems([])
      }

      // Fetch customer name and email
      try {
        const customer = await customersApi.getCustomer(saleData.customer_id)
        setCustomerName(customer.name)
        setCustomerEmail(customer.email || null)
      } catch (error) {
        setCustomerName('Unknown Customer')
        setCustomerEmail(null)
      }
    } catch (error: any) {
      console.error('Failed to fetch sale:', error)
      toast.error(error.message || 'Failed to load sale details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateInvoice = async () => {
    if (!sale) return

    try {
      const invoice = await salesApi.generateInvoice(sale.id)
      toast.success('Invoice generated successfully')
      fetchSaleData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate invoice')
    }
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    // Small delay to ensure invoice view is rendered
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleDownloadInvoice = async (invoice: Invoice) => {
    if (!invoice || !sale) return

    try {
      setIsDownloading(true)
      setSelectedInvoice(invoice)

      // Wait for invoice view to render
      await new Promise(resolve => setTimeout(resolve, 500))

      if (!invoiceContainerRef.current) {
        throw new Error('Invoice view not ready')
      }

      toast.loading('Generating invoice PDF...', { id: 'download-loading' })

      // Generate PDF
      const pdfResult = await generateInvoicePDFAdvanced(
        invoiceContainerRef.current,
        invoice.invoiceNumber || invoice.id
      )

      // Create download link
      const url = URL.createObjectURL(pdfResult.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.dismiss('download-loading')
      toast.success('Invoice PDF downloaded successfully!')
    } catch (error: any) {
      console.error('Failed to download invoice:', error)
      toast.dismiss('download-loading')
      toast.error(error.message || 'Failed to download invoice')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShareInvoice = async (invoice: Invoice) => {
    if (!invoice || !sale) return

    try {
      setIsSharing(true)
      setSelectedInvoice(invoice)

      // Wait for invoice view to render
      await new Promise(resolve => setTimeout(resolve, 500))

      if (!invoiceContainerRef.current) {
        throw new Error('Invoice view not ready')
      }

      toast.loading('Generating invoice image...', { id: 'share-loading' })

      // Generate image for sharing
      const imageResult = await generateInvoiceImageAdvanced(
        invoiceContainerRef.current,
        invoice.invoiceNumber || invoice.id
      )

      // Create a File object from the blob
      const fileName = `invoice-${invoice.invoiceNumber || invoice.id}.png`
      const file = new File([imageResult.blob], fileName, { type: 'image/png' })

      // Use Web Share API if available
      if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Invoice ${invoice.invoiceNumber || invoice.id}`,
            text: `Invoice ${invoice.invoiceNumber || invoice.id} from ${tenantBranding?.name || 'Company'}`,
            files: [file],
          })
          toast.dismiss('share-loading')
          toast.success('Invoice shared successfully!')
        } catch (shareError: any) {
          // User cancelled or share failed, fall back to clipboard
          if (shareError.name !== 'AbortError') {
            throw shareError
          }
        }
      } else {
        // Fallback: copy shareable link to clipboard
        const shareUrl = `${window.location.origin}/app/invoices/${invoice.id}`
        await navigator.clipboard.writeText(shareUrl)
        toast.dismiss('share-loading')
        toast.success('Invoice link copied to clipboard!')
      }
    } catch (error: any) {
      console.error('Failed to share invoice:', error)
      toast.dismiss('share-loading')
      toast.error(error.message || 'Failed to share invoice')
    } finally {
      setIsSharing(false)
    }
  }

  const startEditing = () => {
    if (!sale) return

    // Calculate discount value (convert percentage to value if needed)
    let discountValue = sale.discount_amount || 0
    if (sale.discount_type === 'percentage' && sale.subtotal) {
      discountValue = ((sale.discount_amount || 0) / sale.subtotal) * 100
    }

    setEditFormData({
      status: sale.status || 'DRAFT',
      paymentStatus: sale.payment_status || 'PENDING',
      paymentMethod: sale.payment_method || '',
      discountAmount: discountValue,
      discountType: (sale.discount_type as 'percentage' | 'fixed') || 'fixed',
      taxRate: sale.tax_rate ? sale.tax_rate * 100 : 0, // Convert to percentage
      paidAmount: sale.paid_amount || 0,
      notes: sale.notes || '',
    })

    // Load sale items for editing
    if (sale.items && sale.items.length > 0) {
      const items = sale.items.map(item => ({
        productId: item.product_id,
        productName: item.product_name || 'Unknown Product',
        quantity: item.quantity,
        unitPrice: item.unit_price,
      }))
      setEditItems(items)
    } else {
      setEditItems([])
    }

    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    // Reset form data to original sale values
    if (sale) {
      let discountValue = sale.discount_amount || 0
      if (sale.discount_type === 'percentage' && sale.subtotal) {
        discountValue = ((sale.discount_amount || 0) / sale.subtotal) * 100
      }

      setEditFormData({
        status: sale.status || 'DRAFT',
        paymentStatus: sale.payment_status || 'PENDING',
        paymentMethod: sale.payment_method || '',
        discountAmount: discountValue,
        discountType: (sale.discount_type as 'percentage' | 'fixed') || 'fixed',
        taxRate: sale.tax_rate ? sale.tax_rate * 100 : 0,
        paidAmount: sale.paid_amount || 0,
        notes: sale.notes || '',
      })

      if (sale.items && sale.items.length > 0) {
        const items = sale.items.map(item => ({
          productId: item.product_id,
          productName: item.product_name || 'Unknown Product',
          quantity: item.quantity,
          unitPrice: item.unit_price,
        }))
        setEditItems(items)

        // Reset saleItems to original items
        setSaleItems(sale.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name || 'Unknown Product',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })))
      } else {
        setEditItems([])
        setSaleItems([])
      }
    }
  }

  const addEditItem = () => {
    if (products.length === 0) {
      toast.error('No products available. Please add products first.')
      return
    }

    const firstProduct = products[0]
    setEditItems([
      ...editItems,
      {
        productId: firstProduct.id,
        productName: firstProduct.name,
        quantity: 1,
        unitPrice: firstProduct.price || 0,
      },
    ])
  }

  const handleAddItem = () => {
    setProductSelectorContext('add')
    setIsProductSelectorOpen(true)
  }

  const handleProductSelected = (product: Product) => {
    if (productSelectorContext === 'add') {
      // Add new item
      const newItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price || product.selling_price || 0,
        total: product.price || product.selling_price || 0,
      }
      setSaleItems([...saleItems, newItem])
      toast.success(`${product.name} added to sale`)
    } else if (productSelectorContext === 'edit' && editingItemIndex !== null && itemEditData) {
      // Update existing item in edit modal
      const newPrice = product.price || product.selling_price || itemEditData.unitPrice
      setItemEditData({
        productId: product.id,
        quantity: itemEditData.quantity,
        unitPrice: newPrice,
      })
      toast.success(`Product changed to ${product.name}`)
    }
  }

  const removeEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index))
  }

  const updateEditItem = (index: number, updates: { productId?: string; quantity?: number; unitPrice?: number }) => {
    const updated = [...editItems]

    if (updates.productId !== undefined) {
      const product = products.find(p => p.id === updates.productId)
      if (product) {
        updated[index] = {
          ...updated[index],
          productId: updates.productId,
          productName: product.name,
          unitPrice: product.price || 0,
          quantity: updated[index].quantity || 1,
        }
      }
    } else {
      if (updates.quantity !== undefined) {
        updated[index].quantity = updates.quantity
      }
      if (updates.unitPrice !== undefined) {
        updated[index].unitPrice = updates.unitPrice
      }
    }

    setEditItems(updated)
  }

  const getEditSubtotal = () => {
    return editItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  const handleUpdateSale = async () => {
    if (!sale) return

    try {
      setIsUpdating(true)
      const finalTotal = getNewTotal()
      const paidAmountValue = editFormData.paymentStatus === 'PAID' ? finalTotal :
        (editFormData.paymentStatus === 'PARTIAL' ? editFormData.paidAmount : 0)

      // Calculate total - if items were edited, use the new total based on edited items
      // Otherwise, the backend will recalculate based on existing items and discount/tax changes
      const updateData: any = {
        status: editFormData.status,
        paymentStatus: editFormData.paymentStatus,
        paymentMethod: editFormData.paymentMethod || undefined,
        discountAmount: editFormData.discountAmount > 0 ? editFormData.discountAmount : undefined,
        discountType: editFormData.discountAmount > 0 ? editFormData.discountType : undefined,
        taxRate: editFormData.taxRate > 0 ? editFormData.taxRate : undefined,
        paidAmount: paidAmountValue > 0 ? paidAmountValue : undefined,
        notes: editFormData.notes || undefined,
      }

      // If items were edited, send the items array to update them
      if (saleItems.length > 0) {
        // Send the items array to update them in the backend
        updateData.items = saleItems.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        }))
      }

      await salesApi.updateSale(sale.id, updateData)

      toast.success('Sale updated successfully')
      setIsEditing(false)
      fetchSaleData()
    } catch (error: any) {
      console.error('Failed to update sale:', error)
      toast.error(error.message || 'Failed to update sale')
    } finally {
      setIsUpdating(false)
    }
  }

  const getDiscount = () => {
    const subtotal = saleItems.length > 0 ? getSaleItemsSubtotal() : (sale?.subtotal || 0)
    if (editFormData.discountAmount <= 0) return 0
    if (editFormData.discountType === 'percentage') {
      return (subtotal * editFormData.discountAmount) / 100
    }
    return editFormData.discountAmount
  }

  const getTax = () => {
    const subtotal = saleItems.length > 0 ? getSaleItemsSubtotal() : (sale?.subtotal || 0)
    const discount = getDiscount()
    if (editFormData.taxRate <= 0) return 0
    return (subtotal - discount) * (editFormData.taxRate / 100)
  }

  const getNewTotal = () => {
    const subtotal = saleItems.length > 0 ? getSaleItemsSubtotal() : (sale?.subtotal || 0)
    const discount = getDiscount()
    const tax = getTax()
    return subtotal - discount + tax
  }

  // Calculate subtotal from saleItems
  const getSaleItemsSubtotal = () => {
    return saleItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  // Calculate new total based on saleItems
  const getSaleItemsTotal = () => {
    const subtotal = getSaleItemsSubtotal()
    const discountAmount = sale?.discount_amount || 0
    const discount = sale?.discount_type === 'percentage'
      ? (subtotal * discountAmount) / 100
      : discountAmount
    const taxAmount = sale?.tax_amount || 0
    const tax = sale?.tax_rate
      ? (subtotal - discount) * (sale.tax_rate / 100)
      : taxAmount
    return subtotal - discount + tax
  }

  // Open item edit modal
  const handleEditItem = (index: number) => {
    if (!sale || !sale.items) return

    const items = saleItems.length > 0 ? saleItems : sale.items
    const item = items[index]
    setEditingItemIndex(index)
    setItemEditData({
      productId: item.product_id,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })
    setIsItemEditModalOpen(true)
  }

  const handleChangeProduct = () => {
    setProductSelectorContext('edit')
    setIsProductSelectorOpen(true)
  }

  // Save item edit
  const handleSaveItemEdit = async () => {
    if (editingItemIndex === null || !itemEditData || !sale || !sale.items) return

    try {
      const product = products.find(p => p.id === itemEditData.productId)
      if (!product) {
        toast.error('Product not found')
        return
      }

      // Get current items (use saleItems if available, otherwise sale.items)
      const currentItems = saleItems.length > 0 ? saleItems : sale.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name || 'Unknown Product',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }))

      // Update the item
      const updatedItems = [...currentItems]
      updatedItems[editingItemIndex] = {
        ...updatedItems[editingItemIndex],
        product_id: itemEditData.productId,
        product_name: product.name,
        quantity: itemEditData.quantity,
        unit_price: itemEditData.unitPrice,
        total: itemEditData.quantity * itemEditData.unitPrice,
      }
      setSaleItems(updatedItems)

      // Update sale with items array - backend will recalculate subtotal, discount, tax, and total
      await salesApi.updateSale(sale.id, {
        items: updatedItems.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        })),
      })

      toast.success('Item updated successfully')
      setIsItemEditModalOpen(false)
      setEditingItemIndex(null)
      setItemEditData(null)
      fetchSaleData() // Refresh to get updated data
    } catch (error: any) {
      console.error('Failed to update item:', error)
      toast.error(error.message || 'Failed to update item')
    }
  }

  // Delete item - open confirmation dialog
  const handleDeleteItemClick = (index: number) => {
    setItemToDeleteIndex(index)
    setIsDeleteItemDialogOpen(true)
  }

  // Delete item - confirmed
  const handleDeleteItem = async () => {
    if (!sale || !sale.items || itemToDeleteIndex === null) return

    try {
      // Get current items (use saleItems if available, otherwise sale.items)
      const currentItems = saleItems.length > 0 ? saleItems : sale.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name || 'Unknown Product',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }))

      // Remove item from local state
      const updatedItems = currentItems.filter((_, i) => i !== itemToDeleteIndex)

      // If no items left, show warning
      if (updatedItems.length === 0) {
        toast.error('Cannot delete all items. Sale must have at least one item.')
        setIsDeleteItemDialogOpen(false)
        setItemToDeleteIndex(null)
        return
      }

      setSaleItems(updatedItems)

      // Update sale with items array - backend will recalculate subtotal, discount, tax, and total
      await salesApi.updateSale(sale.id, {
        items: updatedItems.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        })),
      })

      toast.success('Item deleted successfully')
      setIsDeleteItemDialogOpen(false)
      setItemToDeleteIndex(null)
      fetchSaleData() // Refresh to get updated data
    } catch (error: any) {
      console.error('Failed to delete item:', error)
      toast.error(error.message || 'Failed to delete item')
      setIsDeleteItemDialogOpen(false)
      setItemToDeleteIndex(null)
      fetchSaleData() // Refresh to restore items on error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a2fd] mx-auto"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading sale details...</p>
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Sale not found</p>
        <Link href="/app/sales">
          <Button variant="outline">Back to Sales</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/sales">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sale {(() => {
              if (sale.sale_number) {
                // Replace SALE- with SL- if present, otherwise use as is
                return sale.sale_number.replace(/^SALE-/, 'SL-')
              }
              // Use shorter ID format: SL- followed by first 6 characters
              return `SL-${sale.id.substring(0, 6)}`
            })()}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(sale.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          {canManage('sales') && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={startEditing}
              disabled={sale.status === 'CANCELLED' || sale.status === 'REFUNDED'}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canManage('sales') && isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditing}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateSale}
                disabled={isUpdating || (editFormData.paymentStatus !== 'PENDING' && !editFormData.paymentMethod)}
                className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
          <Badge className={`${statusColors[sale.status || 'pending'] || statusColors.pending} border-0 capitalize`}>
            {sale.status || 'pending'}
          </Badge>
          {sale.payment_status && (
            <Badge variant="outline" className="capitalize">
              {sale.payment_status}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customer Name</p>
                  <p className="font-medium">{customerName}</p>
                </div>
                {customerEmail && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium">{customerEmail}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          {(sale.items && sale.items.length > 0) || (isEditing && saleItems.length > 0) ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Items</CardTitle>
                  {isEditing && canManage('sales') && (
                    <Button
                      onClick={handleAddItem}
                      variant="outline"
                      size="sm"
                      type="button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      {canManage('sales') && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(saleItems.length > 0 ? saleItems : (sale.items || [])).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_name || 'Product'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                        {canManage('sales') && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditItem(index)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItemClick(index)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}

          {/* Invoices */}
          {invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber || `Invoice #${invoice.id.substring(0, 8)}`}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(invoice.issuedAt || invoice.createdAt || invoice.issuedAt || invoice.createdAt)} • {formatCurrency(invoice.total)}
                        </p>
                        <Badge variant="outline" className="mt-2 capitalize">
                          {(invoice.paymentStatus || invoice.paymentStatus || 'pending').toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/app/invoices/${invoice.id}`}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Invoice
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintInvoice(invoice)}
                          title="Print Invoice"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice)}
                          disabled={isDownloading}
                          title="Download PDF"
                        >
                          {isDownloading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareInvoice(invoice)}
                          disabled={isSharing}
                          title="Share Invoice"
                        >
                          {isSharing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Share2 className="h-4 w-4 mr-2" />
                          )}
                          Share
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">Status</Label>
                {isEditing ? (
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium mt-1">{sale.status || 'DRAFT'}</p>
                )}
              </div>

              {/* Payment Status */}
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">Payment Status</Label>
                {isEditing ? (
                  <Select
                    value={editFormData.paymentStatus}
                    onValueChange={(value) => setEditFormData({ ...editFormData, paymentStatus: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium mt-1">{sale.payment_status || 'PENDING'}</p>
                )}
              </div>

              {/* Payment Method */}
              {isEditing && editFormData.paymentStatus !== 'PENDING' && (
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Payment Method</Label>
                  <Select
                    value={editFormData.paymentMethod}
                    onValueChange={(value) => setEditFormData({ ...editFormData, paymentMethod: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">{formatCurrency(isEditing && saleItems.length > 0 ? getSaleItemsSubtotal() : (sale.subtotal || sale.total))}</span>
                </div>

                {/* Discount */}
                <div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Discount</span>
                    {isEditing ? (
                      <div className="flex gap-2 items-center">
                        <Select
                          value={editFormData.discountType}
                          onValueChange={(value: 'percentage' | 'fixed') => setEditFormData({ ...editFormData, discountType: value })}
                        >
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">{currencySymbol}</SelectItem>
                            <SelectItem value="percentage">%</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={editFormData.discountType === 'percentage' ? 100 : (saleItems.length > 0 ? getSaleItemsSubtotal() : (sale?.subtotal || 0))}
                          value={editFormData.discountAmount}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            setEditFormData({ ...editFormData, discountAmount: value })
                          }}
                          className="w-20 h-8"
                        />
                      </div>
                    ) : (
                      <span className="font-medium text-red-600">-{formatCurrency(sale.discount_amount || 0)}</span>
                    )}
                  </div>
                </div>

                {/* Tax Rate */}
                <div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Tax Rate</span>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={editFormData.taxRate}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setEditFormData({ ...editFormData, taxRate: value })
                        }}
                        className="w-20 h-8"
                        placeholder="0"
                      />
                    ) : (
                      <span className="font-medium">{sale.tax_rate ? `${(sale.tax_rate * 100).toFixed(2)}%` : '0%'}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax Amount</span>
                    <span className="font-medium">{formatCurrency(isEditing ? getTax() : (sale.tax_amount || 0))}</span>
                  </div>
                </div>

                {/* Paid Amount */}
                {(isEditing && (editFormData.paymentStatus === 'PARTIAL' || editFormData.paymentStatus === 'PAID')) ||
                  (!isEditing && (sale.payment_status === 'PARTIAL' || sale.payment_status === 'PAID')) ? (
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Paid Amount</span>
                      {isEditing && editFormData.paymentStatus === 'PARTIAL' ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={getNewTotal()}
                          value={editFormData.paidAmount}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            if (value <= getNewTotal()) {
                              setEditFormData({ ...editFormData, paidAmount: value })
                            }
                          }}
                          className="w-24 h-8"
                        />
                      ) : (
                        <span className="font-medium">{formatCurrency(isEditing && editFormData.paymentStatus === 'PAID' ? getNewTotal() : (sale.paid_amount || 0))}</span>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(isEditing ? getNewTotal() : (sale.total - (sale.paid_amount || 0)))}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">Notes</Label>
                {isEditing ? (
                  <Input
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    placeholder="Optional notes..."
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{sale.notes || 'No notes'}</p>
                )}
              </div>

              {canManage('sales') && !isEditing && (
                <Button
                  onClick={handleGenerateInvoice}
                  className="w-full bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoice
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden Invoice View for PDF/Image generation */}
      {selectedInvoice && sale && tenantBranding && (
        <div className="fixed -left-[9999px] top-0" style={{ visibility: 'hidden' }}>
          <div ref={invoiceContainerRef}>
            <InvoiceView
              invoice={selectedInvoice}
              sale={sale}
              tenantBranding={tenantBranding}
            />
          </div>
        </div>
      )}


      {/* Item Edit Modal */}
      <Dialog open={isItemEditModalOpen} onOpenChange={setIsItemEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the product, quantity, or unit price for this item.
            </DialogDescription>
          </DialogHeader>

          {itemEditData && (
            <div className="space-y-4 py-4">
              {/* Product Selection */}
              <div>
                <Label htmlFor="item-product">Product *</Label>
                <div className="flex gap-2">
                  <Input
                    id="item-product"
                    value={products.find(p => p.id === itemEditData.productId)?.name || 'Select product...'}
                    readOnly
                    className="flex-1 cursor-pointer"
                    onClick={handleChangeProduct}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleChangeProduct}
                  >
                    Change Product
                  </Button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="item-quantity">Quantity *</Label>
                <Input
                  id="item-quantity"
                  type="number"
                  min="1"
                  value={itemEditData.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (!isNaN(value) && value > 0) {
                      setItemEditData({ ...itemEditData, quantity: value })
                    }
                  }}
                />
              </div>

              {/* Unit Price */}
              <div>
                <Label htmlFor="item-unit-price">Unit Price *</Label>
                <Input
                  id="item-unit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemEditData.unitPrice}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    if (!isNaN(value) && value >= 0) {
                      setItemEditData({ ...itemEditData, unitPrice: value })
                    }
                  }}
                />
              </div>

              {/* Subtotal Preview */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Subtotal:</span>
                  <span className="font-bold">
                    {formatCurrency(itemEditData.quantity * itemEditData.unitPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsItemEditModalOpen(false)
                setEditingItemIndex(null)
                setItemEditData(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveItemEdit}
              disabled={!itemEditData || itemEditData.quantity <= 0 || itemEditData.unitPrice < 0}
              className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Selector Modal */}
      <ProductSelectorModal
        open={isProductSelectorOpen}
        onOpenChange={setIsProductSelectorOpen}
        onSelect={handleProductSelected}
        excludeProductIds={
          productSelectorContext === 'edit' && itemEditData
            ? saleItems
              .filter((_, idx) => idx !== editingItemIndex)
              .map(item => item.product_id)
            : saleItems.map(item => item.product_id)
        }
      />

      {/* Delete Item Confirmation Dialog */}
      <AlertDialog open={isDeleteItemDialogOpen} onOpenChange={setIsDeleteItemDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                if (itemToDeleteIndex === null || !sale) return 'Are you sure you want to delete this item from this sale? This action cannot be undone.'

                // Get item name from saleItems if available, otherwise from sale.items
                const currentItems = saleItems.length > 0 ? saleItems : (sale.items || [])
                const item = currentItems[itemToDeleteIndex]
                const itemName = item?.product_name || 'this item'

                return (
                  <>
                    Are you sure you want to delete <strong>{itemName}</strong> from this sale?
                    This action cannot be undone.
                  </>
                )
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteItemDialogOpen(false)
              setItemToDeleteIndex(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


