"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Printer, Mail, Share2, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import InvoiceView from "./invoice-view"
import { salesApi } from "@/lib/api/sales"
import { tenantsApi } from "@/lib/api/tenants"
import { usePermissions } from "@/hooks/use-permissions"
import { RouteProtection } from "@/components/auth/route-protection"
import type { Invoice, Sale } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"
import { 
  generateInvoicePDFAdvanced, 
  generateInvoiceImageAdvanced 
} from "@/lib/utils/invoice-generator"

export default function InvoiceDetailContent() {
  const { canView } = usePermissions()
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const invoiceId = params.id as string
  const invoiceContainerRef = useRef<HTMLDivElement>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [sale, setSale] = useState<Sale | null>(null)
  const [tenantBranding, setTenantBranding] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEmailing, setIsEmailing] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingImage, setIsDownloadingImage] = useState(false)

  useEffect(() => {
    if (invoiceId && user?.tenantId) {
      fetchInvoiceData()
    }
  }, [invoiceId, user?.tenantId])

  const fetchInvoiceData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch invoice, sale, and tenant branding in parallel
      const [invoiceData, tenantBrandingData] = await Promise.all([
        salesApi.getInvoice(invoiceId).catch(() => null),
        user?.tenantId ? tenantsApi.getTenantSettings(user.tenantId).catch(() => null) : Promise.resolve(null),
      ])

      if (!invoiceData) {
        toast.error('Invoice not found')
        return
      }

      setInvoice(invoiceData)

      // Fetch sale data
      if (invoiceData.saleId) {
        try {
          const saleData = await salesApi.getSale(invoiceData.saleId)
          setSale(saleData)
        } catch (error) {
          console.error('Failed to fetch sale:', error)
        }
      }

      // Set tenant branding
      if (tenantBrandingData) {
        setTenantBranding({
          name: tenantBrandingData.name,
          logoUrl: tenantBrandingData.logoUrl,
          primaryColor: tenantBrandingData.primaryColor,
          accentColor: tenantBrandingData.accentColor,
          bankName: tenantBrandingData.bankName,
          accountName: tenantBrandingData.accountName,
          accountNumber: tenantBrandingData.accountNumber,
        })
      }
    } catch (error: any) {
      console.error('Failed to fetch invoice:', error)
      toast.error(error.message || 'Failed to load invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = async () => {
    if (!invoice || !invoiceContainerRef.current) return

    try {
      setIsEmailing(true)
      toast.loading('Generating invoice PDF...', { id: 'email-loading' })

      // Generate PDF only
      const pdfResult = await generateInvoicePDFAdvanced(
        invoiceContainerRef.current,
        invoice.invoiceNumber || invoice.id
      )

      // Send email with PDF attachment only
      await salesApi.emailInvoice(invoice.id, pdfResult.base64)
      
      toast.dismiss('email-loading')
      toast.success('Invoice email sent successfully')
    } catch (error: any) {
      console.error('Failed to email invoice:', error)
      toast.dismiss('email-loading')
      toast.error(error.message || 'Failed to send invoice email')
    } finally {
      setIsEmailing(false)
    }
  }

  const handleShare = async () => {
    if (!invoice || !invoiceContainerRef.current) return

    try {
      setIsSharing(true)
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

  const handleDownload = async () => {
    if (!invoice || !invoiceContainerRef.current) return

    try {
      setIsDownloading(true)
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

  const handleDownloadImage = async () => {
    if (!invoice || !invoiceContainerRef.current) return

    try {
      setIsDownloadingImage(true)
      toast.loading('Generating invoice image...', { id: 'download-image-loading' })

      // Generate image
      const imageResult = await generateInvoiceImageAdvanced(
        invoiceContainerRef.current,
        invoice.invoiceNumber || invoice.id
      )

      // Create download link
      const url = URL.createObjectURL(imageResult.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoice.invoiceNumber || invoice.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.dismiss('download-image-loading')
      toast.success('Invoice image downloaded successfully!')
    } catch (error: any) {
      console.error('Failed to download invoice image:', error)
      toast.dismiss('download-image-loading')
      toast.error(error.message || 'Failed to download invoice image')
    } finally {
      setIsDownloadingImage(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd] mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading invoice...</p>
        </div>
      </div>
    )
  }

  const handleBack = () => {
    // Use browser's back navigation
    router.back()
  }

  // Protect route
  if (!canView('invoices')) {
    return (
      <RouteProtection resource="invoices" requiredPermission="view">
        <div />
      </RouteProtection>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Invoice not found</p>
        <Button variant="outline" asChild>
          <Link href="/app/sales">Back to Sales</Link>
        </Button>
      </div>
    )
  }

  // If sale is not loaded yet, show loading state
  if (!sale) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Action buttons - hidden when printing */}
      <div className="flex flex-col gap-4 md:flex-row items-start md:justify-between print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="w-full md:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex-1 min-w-[60px] md:flex-initial"
            title="Print"
          >
            <Printer className="h-4 w-4 md:mr-2" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 min-w-[60px] md:flex-initial"
            title="Download PDF"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">PDF</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 md:mr-2" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadImage}
            disabled={isDownloadingImage}
            className="flex-1 min-w-[60px] md:flex-initial"
            title="Download Image"
          >
            {isDownloadingImage ? (
              <>
                <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">Image</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 md:mr-2" />
                <span className="hidden sm:inline">Download Image</span>
                <span className="sm:hidden">Image</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEmail}
            disabled={isEmailing}
            className="flex-1 min-w-[60px] md:flex-initial"
            title="Email Invoice"
          >
            {isEmailing ? (
              <>
                <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
                <span className="hidden sm:inline">Sending...</span>
                <span className="sm:hidden">Email</span>
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 md:mr-2" />
                <span className="hidden sm:inline">Email</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 min-w-[60px] md:flex-initial"
            title="Share Invoice"
          >
            {isSharing ? (
              <>
                <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
                <span className="hidden sm:inline">Sharing...</span>
                <span className="sm:hidden">Share</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 md:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Invoice View */}
      <Card className="print:border-0 print:shadow-none">
        <CardContent className="p-0 print:p-0">
          <div ref={invoiceContainerRef}>
            <InvoiceView 
              invoice={invoice} 
              sale={sale}
              tenantBranding={tenantBranding}
            />
          </div>
        </CardContent>
      </Card>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          /* Reset body */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          /* Hide sidebar - target nav that's a direct child of flex container */
          nav {
            display: none !important;
          }
          
          /* Hide header/top nav */
          header {
            display: none !important;
          }
          
          /* Reset layout container - remove left margin from content area */
          div[style*="marginLeft"] {
            margin-left: 0 !important;
          }
          
          /* Reset main content area */
          main {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            background: white !important;
          }
          
          /* Hide elements marked with print:hidden */
          .print\\:hidden {
            display: none !important;
          }
          
          /* Remove card styling */
          .print\\:border-0 {
            border: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          /* Ensure invoice SVG content is visible */
          svg {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}

