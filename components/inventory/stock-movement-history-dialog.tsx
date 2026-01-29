"use client"

import { useState, useEffect } from "react"
import { Package, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { inventoryApi } from "@/lib/api/inventory"
import type { StockMovement } from "@/lib/api/types"
import { Loader2 } from "lucide-react"
// Simple date formatting without date-fns dependency
const formatTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  } catch {
    return 'Recently'
  }
}

interface StockMovementHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string | null
  productName?: string
}

export function StockMovementHistoryDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: StockMovementHistoryDialogProps) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && productId) {
      fetchStockMovements()
    } else {
      setMovements([])
    }
  }, [open, productId])

  const fetchStockMovements = async () => {
    if (!productId) return

    try {
      setIsLoading(true)
      const data = await inventoryApi.getStockMovements(productId, 100)
      setMovements(data)
    } catch (error: any) {
      console.error('Failed to fetch stock movements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMovementIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    }
    return <ArrowRight className="h-4 w-4 text-gray-400" />
  }

  const getMovementBadge = (change: number) => {
    if (change > 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">+{change}</Badge>
    } else if (change < 0) {
      return <Badge variant="destructive">{change}</Badge>
    }
    return <Badge variant="outline">0</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Movement History
          </DialogTitle>
          <DialogDescription>
            {productName ? `Stock movements for ${productName}` : "View stock adjustment history"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd]" />
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p>No stock movements found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-sm">
                      {movement.created_at ? formatTimeAgo(movement.created_at) : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.change)}
                        {getMovementBadge(movement.change)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {movement.previous_quantity ?? "N/A"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {movement.new_quantity ?? "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {movement.reason || "Manual adjustment"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

