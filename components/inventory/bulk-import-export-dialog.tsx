"use client"

import { useState, useRef } from "react"
import { Upload, Download, FileText, AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { parseCSV, validateCSVData, generateCSVTemplate, exportToCSV } from "@/lib/utils/csv"
import { inventoryApi } from "@/lib/api/inventory"
import type { Product } from "@/lib/api/types"
import { toast } from "sonner"

interface BulkImportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  onSuccess?: () => void
}

type ImportStep = "upload" | "validate" | "importing" | "complete"

interface ImportError {
  row: number
  errors: string[]
}

interface ImportResult {
  success: number
  failed: number
  errors: ImportError[]
}

const PRODUCT_CSV_HEADERS = [
  "name",
  "sku",
  "category",
  "price",
  "stockQuantity",
  "lowStockThreshold",
]

const PRODUCT_REQUIRED_FIELDS = ["name"]

export function BulkImportExportDialog({
  open,
  onOpenChange,
  products,
  onSuccess,
}: BulkImportExportDialogProps) {
  const [activeTab, setActiveTab] = useState<"import" | "export">("import")
  const [importStep, setImportStep] = useState<ImportStep>("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetImport = () => {
    setSelectedFile(null)
    setCsvData([])
    setValidationErrors([])
    setImportResult(null)
    setImportStep("upload")
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    setSelectedFile(file)
    setIsProcessing(true)
    setImportStep("validate")

    parseCSV<any>(
      file,
      (results) => {
        setCsvData(results.data)
        validateCSV(results.data)
      },
      (error) => {
        toast.error(error.message)
        setIsProcessing(false)
        setImportStep("upload")
      }
    )
  }

  const validateCSV = (data: any[]) => {
    const validation = validateCSVData(
      data,
      PRODUCT_REQUIRED_FIELDS,
      (row, index) => {
        const errors: string[] = []

        // Validate name
        if (!row.name || String(row.name).trim() === '') {
          errors.push('Product name is required')
        }

        // Validate price (if provided)
        if (row.price && isNaN(parseFloat(row.price))) {
          errors.push('Price must be a valid number')
        }

        // Validate stock quantity (if provided)
        if (row.stockQuantity && (isNaN(parseInt(row.stockQuantity)) || parseInt(row.stockQuantity) < 0)) {
          errors.push('Stock quantity must be a valid non-negative integer')
        }

        // Validate low stock threshold (if provided)
        if (row.lowStockThreshold && (isNaN(parseInt(row.lowStockThreshold)) || parseInt(row.lowStockThreshold) < 0)) {
          errors.push('Low stock threshold must be a valid non-negative integer')
        }

        return { valid: errors.length === 0, errors }
      }
    )

    setValidationErrors(validation.errors)
    setIsProcessing(false)

    if (!validation.valid) {
      toast.error(`Found ${validation.errors.length} row(s) with errors`)
    } else {
      toast.success('CSV file is valid! Ready to import.')
    }
  }

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors before importing')
      return
    }

    setIsProcessing(true)
    setImportStep("importing")
    setProgress(0)

    let successCount = 0
    let failedCount = 0
    const errors: ImportError[] = []

    const total = csvData.length
    const progressIncrement = 100 / total

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      try {
        await inventoryApi.createProduct({
          name: String(row.name).trim(),
          sku: row.sku ? String(row.sku).trim() : undefined,
          category: row.category ? String(row.category).trim() : undefined,
          price: row.price ? parseFloat(row.price) : undefined,
          stockQuantity: row.stockQuantity ? parseInt(row.stockQuantity) : 0,
          lowStockThreshold: row.lowStockThreshold ? parseInt(row.lowStockThreshold) : undefined,
        })
        successCount++
      } catch (error: any) {
        failedCount++
        errors.push({
          row: i + 2, // +2 because row 1 is header, index is 0-based
          errors: [error?.response?.data?.message || error?.message || 'Failed to create product'],
        })
      }

      setProgress((i + 1) * progressIncrement)
    }

    setImportResult({ success: successCount, failed: failedCount, errors })
    setImportStep("complete")
    setIsProcessing(false)

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} product(s)`)
      onSuccess?.()
    }
    if (failedCount > 0) {
      toast.error(`Failed to import ${failedCount} product(s)`)
    }
  }

  const handleExport = () => {
    try {
      const exportData = products.map((product) => ({
        name: product.name,
        sku: product.sku || '',
        category: product.category || '',
        price: product.price || product.selling_price || 0,
        stockQuantity: product.stock_quantity || 0,
        lowStockThreshold: product.low_stock_threshold || 0,
      }))

      exportToCSV(exportData, `products-export-${new Date().toISOString().split('T')[0]}.csv`, PRODUCT_CSV_HEADERS)
      toast.success('Products exported successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to export products')
    }
  }

  const handleDownloadTemplate = () => {
    generateCSVTemplate(PRODUCT_CSV_HEADERS, 'products-import-template.csv')
    toast.success('Template downloaded!')
  }

  const handleClose = () => {
    resetImport()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import / Export Products</DialogTitle>
          <DialogDescription>
            Import products from CSV or export existing products to CSV
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "import" | "export")} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="flex-1 flex flex-col min-h-0 space-y-4 mt-4">
            {importStep === "upload" && (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Upload CSV File</p>
                  <p className="text-xs text-muted-foreground">
                    Select a CSV file to import products
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            )}

            {importStep === "validate" && (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Validating CSV file...
                  </p>
                  {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>

                {!isProcessing && (
                  <>
                    {validationErrors.length === 0 ? (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          CSV file is valid! Found {csvData.length} product(s) to import.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Found {validationErrors.length} row(s) with errors. Please fix them before importing.
                        </AlertDescription>
                      </Alert>
                    )}

                    {validationErrors.length > 0 && (
                      <ScrollArea className="h-48 border rounded-lg p-4">
                        <div className="space-y-2">
                          {validationErrors.map((error, index) => (
                            <div key={index} className="text-sm">
                              <Badge variant="destructive" className="mr-2">
                                Row {error.row}
                              </Badge>
                              <span className="text-muted-foreground">
                                {error.errors.join(', ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={resetImport}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={validationErrors.length > 0}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import {csvData.length} Product(s)
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {importStep === "importing" && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd]" />
                <p className="text-sm font-medium">Importing products...</p>
                <div className="w-full space-y-2">
                  <Progress value={progress} />
                  <p className="text-xs text-center text-muted-foreground">
                    {Math.round(progress)}% complete
                  </p>
                </div>
              </div>
            )}

            {importStep === "complete" && importResult && (
              <div className="flex-1 flex flex-col space-y-4">
                <Alert variant={importResult.failed === 0 ? "default" : "destructive"}>
                  {importResult.failed === 0 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    Import complete! {importResult.success} succeeded, {importResult.failed} failed.
                  </AlertDescription>
                </Alert>

                {importResult.errors.length > 0 && (
                  <ScrollArea className="h-48 border rounded-lg p-4">
                    <div className="space-y-2">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm">
                          <Badge variant="destructive" className="mr-2">
                            Row {error.row}
                          </Badge>
                          <span className="text-muted-foreground">
                            {error.errors.join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetImport}>
                    Import More
                  </Button>
                  <Button onClick={handleClose}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="flex-1 flex flex-col space-y-4 mt-4">
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 space-y-4">
              <Download className="h-12 w-12 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Export Products</p>
                <p className="text-xs text-muted-foreground">
                  Export {products.length} product(s) to CSV file
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownloadTemplate} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <Button onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Products
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

