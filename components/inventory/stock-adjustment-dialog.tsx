"use client"

import { useState, useEffect } from "react"
import { Package, Plus, Minus, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { inventoryApi } from "@/lib/api/inventory"
import type { Product } from "@/lib/api/types"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess?: () => void
}

type AdjustmentType = "add" | "remove" | "set"

const ADJUSTMENT_REASONS = [
  { value: "damaged", label: "Damaged Goods" },
  { value: "returned", label: "Customer Return" },
  { value: "found", label: "Found Inventory" },
  { value: "theft", label: "Theft/Loss" },
  { value: "correction", label: "Stock Correction" },
  { value: "purchase", label: "Purchase Order" },
  { value: "transfer_in", label: "Transfer In" },
  { value: "transfer_out", label: "Transfer Out" },
  { value: "other", label: "Other" },
]

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("add")
  const [quantity, setQuantity] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [customReason, setCustomReason] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>("")

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (open && product) {
      setQuantity("")
      setReason("")
      setCustomReason("")
      setError("")
      setAdjustmentType("add")
    }
  }, [open, product])

  const calculateNewStock = (): number | null => {
    if (!product || !quantity) return null

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) return null

    switch (adjustmentType) {
      case "add":
        return product.stock_quantity + qty
      case "remove":
        return product.stock_quantity - qty
      case "set":
        return qty
      default:
        return null
    }
  }

  const calculateChange = (): number | null => {
    if (!product || !quantity) return null

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) return null

    switch (adjustmentType) {
      case "add":
        return qty
      case "remove":
        return -qty
      case "set":
        return qty - product.stock_quantity
      default:
        return null
    }
  }

  const newStock = calculateNewStock()
  const change = calculateChange()
  const isValid = quantity && newStock !== null && newStock >= 0 && change !== null

  const handleSubmit = async () => {
    if (!product || !isValid) return

    setError("")
    setIsSubmitting(true)

    try {
      const finalReason = reason === "other" ? customReason : reason || "Manual adjustment"
      
      await inventoryApi.updateStock(product.id, {
        change: change!,
        reason: finalReason,
      })

      toast.success(`Stock ${adjustmentType === "add" ? "added" : adjustmentType === "remove" ? "removed" : "set"} successfully`)
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to adjust stock"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Adjust Stock
          </DialogTitle>
          <DialogDescription>
            Adjust stock quantity for <strong>{product.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Stock Display */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Current Stock:</span>
              <span className="text-lg font-semibold">{product.stock_quantity}</span>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label htmlFor="adjustment-type">Adjustment Type</Label>
            <Select
              value={adjustmentType}
              onValueChange={(value: AdjustmentType) => {
                setAdjustmentType(value)
                setQuantity("")
              }}
            >
              <SelectTrigger id="adjustment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-500" />
                    Add Stock
                  </div>
                </SelectItem>
                <SelectItem value="remove">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-500" />
                    Remove Stock
                  </div>
                </SelectItem>
                <SelectItem value="set">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    Set Stock
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              {adjustmentType === "add" && "Quantity to Add"}
              {adjustmentType === "remove" && "Quantity to Remove"}
              {adjustmentType === "set" && "New Stock Quantity"}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={adjustmentType === "set" ? "Enter new quantity" : "Enter quantity"}
            />
          </div>

          {/* New Stock Preview */}
          {newStock !== null && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New Stock:</span>
                <span className={`font-semibold ${newStock < 0 ? "text-red-500" : "text-green-600"}`}>
                  {newStock}
                </span>
              </div>
              {change !== null && change !== 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>Change:</span>
                  <span className={change > 0 ? "text-green-600" : "text-red-500"}>
                    {change > 0 ? "+" : ""}{change}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Warning for negative stock */}
          {newStock !== null && newStock < 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This adjustment would result in negative stock. Please check your input.
              </AlertDescription>
            </Alert>
          )}

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason Input */}
          {reason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Custom Reason</Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter reason for stock adjustment"
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting || (reason === "other" && !customReason.trim())}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adjusting...
              </>
            ) : (
              `Adjust Stock`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

