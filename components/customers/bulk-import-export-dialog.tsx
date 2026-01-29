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
import { customersApi } from "@/lib/api/customers"
import type { Customer } from "@/lib/api/types"
import { toast } from "sonner"

interface BulkImportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
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

// CSV headers for export (includes all fields from database)
const CUSTOMER_CSV_HEADERS = [
  "name",
  "email",
  "phone",
  "company",
  "address",
  "city",
  "state",
  "zip",
  "country",
]

// Fields that can be imported (API only supports these in CreateCustomerDto)
const CUSTOMER_IMPORT_FIELDS = ["name", "email", "phone"]

const CUSTOMER_REQUIRED_FIELDS = ["name"]

export function BulkImportExportDialog({
  open,
  onOpenChange,
  customers,
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
      CUSTOMER_REQUIRED_FIELDS,
      (row, index) => {
        const errors: string[] = []

        // Validate name
        if (!row.name || String(row.name).trim() === '') {
          errors.push('Customer name is required')
        }

        // Validate email format (if provided)
        if (row.email && row.email.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(row.email)) {
            errors.push('Invalid email format')
          }
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
        // Create customer with supported fields (name, email, phone)
        // Note: Additional fields (company, address, etc.) are stored in DB but not in CreateCustomerDto
        // They can be added later via update if needed
        await customersApi.createCustomer({
          name: String(row.name).trim(),
          email: row.email ? String(row.email).trim() : undefined,
          phone: row.phone ? String(row.phone).trim() : undefined,
        })
        successCount++
      } catch (error: any) {
        failedCount++
        errors.push({
          row: i + 2, // +2 because row 1 is header, index is 0-based
          errors: [error?.response?.data?.message || error?.message || 'Failed to create customer'],
        })
      }

      setProgress((i + 1) * progressIncrement)
    }

    setImportResult({ success: successCount, failed: failedCount, errors })
    setImportStep("complete")
    setIsProcessing(false)

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} customer(s)`)
      onSuccess?.()
    }
    if (failedCount > 0) {
      toast.error(`Failed to import ${failedCount} customer(s)`)
    }
  }

  const handleExport = () => {
    try {
      const exportData = customers.map((customer) => ({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip: customer.zip || '',
        country: customer.country || '',
      }))

      exportToCSV(exportData, `customers-export-${new Date().toISOString().split('T')[0]}.csv`, CUSTOMER_CSV_HEADERS)
      toast.success('Customers exported successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to export customers')
    }
  }

  const handleDownloadTemplate = () => {
    // Template includes all fields, but only name, email, phone will be imported
    generateCSVTemplate(CUSTOMER_IMPORT_FIELDS, 'customers-import-template.csv')
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
          <DialogTitle>Bulk Import / Export Customers</DialogTitle>
          <DialogDescription>
            Import customers from CSV or export existing customers to CSV
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
                    Select a CSV file to import customers
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
                          CSV file is valid! Found {csvData.length} customer(s) to import.
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
                        Import {csvData.length} Customer(s)
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {importStep === "importing" && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd]" />
                <p className="text-sm font-medium">Importing customers...</p>
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
                <p className="text-sm font-medium">Export Customers</p>
                <p className="text-xs text-muted-foreground">
                  Export {customers.length} customer(s) to CSV file
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownloadTemplate} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <Button onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Customers
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

