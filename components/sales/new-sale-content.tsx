"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { salesApi } from "@/lib/api/sales"
import { customersApi } from "@/lib/api/customers"
import { inventoryApi } from "@/lib/api/inventory"
import { usePermissions } from "@/hooks/use-permissions"
import { RouteProtection } from "@/components/auth/route-protection"
import type { Customer, Product, SaleItem } from "@/lib/api/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/currency"
import { useTenantSettings } from "@/contexts/tenant-settings-context"
import ProductSelectorModal from "@/components/products/product-selector-modal"
import CustomerSelectorModal from "@/components/customers/customer-selector-modal"

export default function NewSaleContent() {
  const { canManage } = usePermissions()
  const router = useRouter()
  const { settings } = useTenantSettings()

  // Get currency symbol from tenant settings
  const currencySymbol = getCurrencySymbol(settings?.currency)


  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(null)
  const [saleItems, setSaleItems] = useState<Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
  }>>([])
  const [status, setStatus] = useState<string>("DRAFT")
  const [paymentStatus, setPaymentStatus] = useState<string>("PENDING")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed')
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [taxRate, setTaxRate] = useState<number>(0)
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false)

  // Auto-set paid amount when payment status changes
  useEffect(() => {
    if (paymentStatus === 'PAID') {
      setPaidAmount(getTotal())
    } else if (paymentStatus === 'PENDING') {
      setPaidAmount(0)
    }
  }, [paymentStatus, saleItems, discountAmount, discountType, taxRate])


  // Removed unnecessary data fetching - modals fetch their own data
  // Only fetch if we need to display selected customer info, which we now get from the modal

  const addItem = () => {
    setEditingItemIndex(null)
    setIsProductSelectorOpen(true)
  }

  const handleProductSelected = (product: Product) => {
    if (editingItemIndex !== null) {
      // Update existing item
      const updated = [...saleItems]
      updated[editingItemIndex] = {
        ...updated[editingItemIndex],
        productId: product.id,
        productName: product.name,
        unitPrice: product.price || product.selling_price || updated[editingItemIndex].unitPrice,
      }
      setSaleItems(updated)
      toast.success(`Product changed to ${product.name}`)
    } else {
      // Add new item
      const newItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price || product.selling_price || 0,
      }
      setSaleItems([...saleItems, newItem])
      toast.success(`${product.name} added to sale`)
    }
    setIsProductSelectorOpen(false)
    setEditingItemIndex(null)
  }

  const handleChangeProduct = (index: number) => {
    setEditingItemIndex(index)
    setIsProductSelectorOpen(true)
  }

  const handleCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer.id)
    setSelectedCustomerData(customer)
    toast.success(`Customer ${customer.name} selected`)
  }

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, updates: { quantity?: number; unitPrice?: number }) => {
    const updated = [...saleItems]

    // Update quantity or unitPrice
    if (updates.quantity !== undefined) {
      updated[index].quantity = updates.quantity
    }
    if (updates.unitPrice !== undefined) {
      updated[index].unitPrice = updates.unitPrice
    }

    setSaleItems(updated)
  }

  const getSubtotal = () => {
    return saleItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  const getDiscount = () => {
    if (discountAmount <= 0) return 0
    if (discountType === 'percentage') {
      return (getSubtotal() * discountAmount) / 100
    }
    return discountAmount
  }

  const getTax = () => {
    if (taxRate <= 0) return 0
    return (getSubtotal() - getDiscount()) * (taxRate / 100)
  }

  const getTotal = () => {
    return getSubtotal() - getDiscount() + getTax()
  }

  // Auto-set paid amount when payment status changes
  useEffect(() => {
    if (paymentStatus === 'PAID') {
      setPaidAmount(getTotal())
    } else if (paymentStatus === 'PENDING') {
      setPaidAmount(0)
    }
  }, [paymentStatus, saleItems, discountAmount, discountType, taxRate])

  // Protect route - requires manage_sales permission
  if (!canManage('sales')) {
    return (
      <RouteProtection resource="sales" requiredPermission="manage">
        <div />
      </RouteProtection>
    )
  }

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer')
      return
    }

    if (saleItems.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    try {
      setIsSubmitting(true)
      const finalTotal = getTotal()
      const paidAmountValue = paymentStatus === 'PAID' ? finalTotal :
        (paymentStatus === 'PARTIAL' ? paidAmount : 0)

      const sale = await salesApi.createSale({
        customerId: selectedCustomer,
        status: status,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod || undefined,
        notes: notes || undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        discountType: discountAmount > 0 ? discountType : undefined,
        taxRate: taxRate > 0 ? taxRate : undefined,
        paidAmount: paidAmountValue > 0 ? paidAmountValue : undefined,
        items: saleItems.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      })

      toast.success('Sale created successfully')
      router.push(`/app/sales/${sale.id}`)
    } catch (error: any) {
      console.error('Failed to create sale:', error)
      toast.error(error.message || 'Failed to create sale')
    } finally {
      setIsSubmitting(false)
    }
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Sale</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create a new sales transaction
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="customer">Select Customer *</Label>
                <div className="flex gap-2">
                  <Input
                    value={
                      selectedCustomerData
                        ? selectedCustomerData.name
                        : "Select customer..."
                    }
                    readOnly
                    className="flex-1 cursor-pointer"
                    onClick={() => setIsCustomerSelectorOpen(true)}
                    placeholder="Click to select a customer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCustomerSelectorOpen(true)}
                  >
                    {selectedCustomer ? "Change Customer" : "Select Customer"}
                  </Button>
                </div>
                {selectedCustomerData && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="space-y-1">
                      {selectedCustomerData.email && <p>Email: {selectedCustomerData.email}</p>}
                      {selectedCustomerData.phone && <p>Phone: {selectedCustomerData.phone}</p>}
                      {selectedCustomerData.company && <p>Company: {selectedCustomerData.company}</p>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {saleItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No items added</p>
                  <Button onClick={addItem} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {saleItems.map((item, index) => (
                    <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
                      <div className="flex-1 space-y-4">
                        <div>
                          <Label>Product</Label>
                          <div className="flex gap-2">
                            <Input
                              value={item.productName || 'Select product...'}
                              readOnly
                              className="flex-1 cursor-pointer"
                              onClick={() => handleChangeProduct(index)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleChangeProduct(index)}
                            >
                              Change Product
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const value = parseInt(e.target.value)
                                if (!isNaN(value) && value > 0) {
                                  updateItem(index, { quantity: value })
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value)
                                if (!isNaN(value) && value >= 0) {
                                  updateItem(index, { unitPrice: value })
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Subtotal</Label>
                          <p className="text-lg font-semibold">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Selection */}
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Draft: Order being prepared. Completed: Order finalized.
                </p>
              </div>
              {/* Summary */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">{formatCurrency(getSubtotal())}</span>
                </div>

                {/* Discount */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label htmlFor="discountType" className="text-xs">Discount</Label>
                    <div className="flex gap-2">
                      <Select value={discountType} onValueChange={(v: 'percentage' | 'fixed') => setDiscountType(v)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">{currencySymbol}</SelectItem>
                          <SelectItem value="percentage">%</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="discountAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={discountType === 'percentage' ? 100 : getSubtotal()}
                        value={discountAmount}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          if (discountType === 'percentage' && value <= 100) {
                            setDiscountAmount(value)
                          } else if (discountType === 'fixed' && value <= getSubtotal()) {
                            setDiscountAmount(value)
                          } else if (value === 0) {
                            setDiscountAmount(0)
                          }
                        }}
                        placeholder="0"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  {getDiscount() > 0 && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">Discount</span>
                      <span className="font-medium text-red-600">-{formatCurrency(getDiscount())}</span>
                    </div>
                  )}
                </div>

                {/* Tax */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label htmlFor="taxRate" className="text-xs">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        if (value <= 100) {
                          setTaxRate(value)
                        }
                      }}
                      placeholder="0"
                    />
                  </div>
                  {getTax() > 0 && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">Tax</span>
                      <span className="font-medium">{formatCurrency(getTax())}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(getTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="paymentStatus">Payment Status *</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(paymentStatus === 'PARTIAL' || paymentStatus === 'PAID') && (
                  <div>
                    <Label htmlFor="paidAmount">
                      Paid Amount {paymentStatus === 'PARTIAL' ? '*' : ''}
                    </Label>
                    <Input
                      id="paidAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={getTotal()}
                      value={paymentStatus === 'PAID' ? getTotal() : paidAmount}
                      onChange={(e) => {
                        if (paymentStatus === 'PARTIAL') {
                          const value = parseFloat(e.target.value) || 0
                          if (value <= getTotal()) {
                            setPaidAmount(value)
                          }
                        }
                      }}
                      disabled={paymentStatus === 'PAID'}
                      placeholder="0.00"
                    />
                    {paymentStatus === 'PAID' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Full amount will be marked as paid
                      </p>
                    )}
                    {paymentStatus === 'PARTIAL' && paidAmount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Remaining: {formatCurrency(getTotal() - paidAmount)}
                      </p>
                    )}
                  </div>
                )}

                {paymentStatus !== 'PENDING' && (
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
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

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={
                  !selectedCustomer ||
                  saleItems.length === 0 ||
                  isSubmitting ||
                  (paymentStatus !== 'PENDING' && !paymentMethod) ||
                  (paymentStatus === 'PARTIAL' && (paidAmount <= 0 || paidAmount >= getTotal())) ||
                  (paymentStatus === 'PAID' && getTotal() === 0)
                }
                className="w-full bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Sale'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Selector Modal */}
      <ProductSelectorModal
        open={isProductSelectorOpen}
        onOpenChange={(open) => {
          setIsProductSelectorOpen(open)
          if (!open) {
            setEditingItemIndex(null)
          }
        }}
        onSelect={handleProductSelected}
        excludeProductIds={
          editingItemIndex !== null
            ? saleItems
              .filter((_, idx) => idx !== editingItemIndex)
              .map(item => item.productId)
            : saleItems.map(item => item.productId)
        }
      />

      {/* Customer Selector Modal */}
      <CustomerSelectorModal
        open={isCustomerSelectorOpen}
        onOpenChange={setIsCustomerSelectorOpen}
        onSelect={handleCustomerSelected}
      />
    </div>
  )
}


