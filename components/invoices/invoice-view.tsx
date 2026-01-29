
"use client"

import React from "react"
import { formatCurrency } from "@/lib/utils/currency"
import type { Invoice, Sale } from "@/lib/api/types"

interface InvoiceViewProps {
  invoice: Invoice
  sale: Sale
  tenantBranding?: {
    name: string
    logoUrl?: string | null
    primaryColor?: string | null
    accentColor?: string | null
    bankName?: string | null
    accountName?: string | null
    accountNumber?: string | null
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/* Pagination */
const ROW_HEIGHT = 43.2
const FIRST_PAGE_ROWS = 6
const OTHER_PAGE_ROWS = 10

const paginateItems = (items: any[]) => {
  const pages: any[][] = []
  let index = 0

  pages.push(items.slice(0, FIRST_PAGE_ROWS))
  index += FIRST_PAGE_ROWS

  while (index < items.length) {
    pages.push(items.slice(index, index + OTHER_PAGE_ROWS))
    index += OTHER_PAGE_ROWS
  }

  return pages
}

export default function InvoiceView({
  invoice,
  sale,
  tenantBranding,
}: InvoiceViewProps) {
  const primaryColor = tenantBranding?.primaryColor || "#2EA0FF"
  const tenantName = tenantBranding?.name || "Company"
  const tenantLogo = tenantBranding?.logoUrl

  const subtotal = invoice.subtotal || sale.subtotal || 0
  const taxAmount = invoice.taxAmount || sale.tax_amount || 0
  const discountAmount = invoice.discountAmount || sale.discount_amount || 0
  const total = sale.total || 0
  const paidAmount = invoice.paidAmount || sale.paid_amount || 0
  const dueAmount = total - paidAmount

  const items = sale.items || []
  const pages = paginateItems(items)

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          /* Reset all margins and padding globally */
          * {
            box-sizing: border-box;
          }
          
          html {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: #040B14 !important;
            display: block !important;
          }
          
          /* Hide sidebar, header, and other UI elements */
          nav, header, aside, button, .print\\:hidden {
            display: none !important;
          }
          
          /* Reset main layout container */
          main {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            display: block !important;
          }
          
          /* Reset any parent containers that might affect positioning */
          div[class*="flex"], div[style*="margin"] {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          /* Center the invoice container - use flexbox for vertical centering */
          .invoice-container {
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            min-height: 100vh !important;
            padding: 0 !important;
            margin: 0 auto !important;
            background: white !important;
            left: 0 !important;
            right: 0 !important;
            text-align: center !important;
          }
          
          /* Inner wrapper - centers the pages horizontally */
          .invoice-container > div {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          
          /* Center each invoice page - both horizontally and vertically */
          .invoice-page {
            position: relative !important;
            width: 210mm !important;
            max-width: 210mm !important;
            height: 297mm !important;
            margin-left: auto !important;
            margin-right: auto !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
            page-break-after: always;
            page-break-inside: avoid;
            display: block !important;
            float: none !important;
            clear: both !important;
          }
          
          .invoice-page:last-child {
            page-break-after: auto;
          }
          
          /* Ensure inner content fills the page */
          .invoice-page > svg {
            width: 100% !important;
            height: 100% !important;
            display: block !important;
          }
        }
      `}</style>
      <div className="w-full min-h-screen bg-[#040B14] flex justify-center invoice-container print:bg-[#040B14]">
        <div className="w-full flex flex-col items-center print:w-auto">
        {pages.map((pageItems, pageIndex) => (
          <div
            key={pageIndex}
            className="w-full max-w-[210mm] print:w-[210mm] print:h-[297mm] mx-auto print:break-after-page invoice-page"
            style={{ aspectRatio: "210 / 297", background: "#040B14" }}
          >
            <svg
              viewBox="0 0 595.276 841.89"
              preserveAspectRatio="xMidYMid meet"
              style={{ width: "100%", height: "100%", display: "block" }}
            >
              {/* Background */}
              <rect x="-10" y="-10" width="620" height="870" fill="#040B14" />

              {/* Header */}
              <rect x="-10" y="-10" width="620" height="130" fill="#1D2027" />

              {/* Tenant Logo */}
              {tenantLogo && (
            <g>
              <defs>
                <rect id="SVGID_LOGO" x="62.542" y="88.229" width="56.939" height="56.939" />
              </defs>
              <clipPath id="SVGID_CLIP_LOGO">
                <use xlinkHref="#SVGID_LOGO" style={{ overflow: 'visible' }} />
              </clipPath>
              <image
                x="62.542"
                y="88.229"
                width="56.939"
                height="56.939"
                href={tenantLogo.startsWith('http') ? tenantLogo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api${tenantLogo}`}
                clipPath="url(#SVGID_CLIP_LOGO)"
              />
            </g>
          )}

              {/* Tenant Name */}
              <text
                x="297.6"
                y="70"
                textAnchor="middle"
                fill="#fff"
                fontSize="23"
                fontWeight="bold"
              >
                {tenantName}
              </text>

              {/* Invoice Title */}
              <text
                x="60"
                y="220"
                fill={primaryColor}
                fontSize="50"
                fontWeight="bold"
              >
                Invoice
              </text>

              {/* Invoice Meta (LEFT BLOCK) */}
              <text x="60" y="270" fill="#fff" fontSize="12" fontWeight="600">
                <tspan x="60" dy="0">
                  Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
                </tspan>
                <tspan x="60" dy="16">
                  Date: {formatDate(invoice.issuedAt || invoice.createdAt || sale.created_at)}
                </tspan>
              </text>

              {/* Billing To (RIGHT BLOCK – no overlap) */}
              <text x="400" y="270" fill="#fff" fontSize="12" fontWeight="600">
                <tspan x="400" dy="0">Billing To:</tspan>
                <tspan x="400" dy="16">
                  {sale.customer_name || "Customer"}
                </tspan>
              </text>

              {/* Table Header */}
              <rect x="58" y="295" width="479" height="27" fill={primaryColor} />
              <text x="87" y="313" fill="#fff" fontSize="12" fontWeight="bold">Product</text>
              <text x="289" y="313" fill="#fff" fontSize="12" fontWeight="bold">Price</text>
              <text x="376" y="313" fill="#fff" fontSize="12" fontWeight="bold">Qty</text>
              <text x="453" y="313" fill="#fff" fontSize="12" fontWeight="bold">Total</text>

              {/* Rows */}
              {pageItems.map((item, index) => {
                const y = 335 + index * ROW_HEIGHT
                return (
                  <g key={index}>
                    <rect x="58" y={y - 11} width="479" height="27" fill="#1D2027" />
                    <text x="87" y={y + 10} fill="#fff" fontSize="12">{item.product_name}</text>
                    <text x="289" y={y + 10} fill="#fff" fontSize="12">{formatCurrency(item.unit_price)}</text>
                    <text x="387" y={y + 10} fill="#fff" fontSize="12">{item.quantity}</text>
                    <text x="453" y={y + 10} fill="#fff" fontSize="12">{formatCurrency(item.total)}</text>
                  </g>
                )
              })}

              {/* Summary + Payment Info (LAST PAGE ONLY) */}
              {pageIndex === pages.length - 1 && (
                <>
                  <text x="337" y="490" fill="#fff" fontSize="11" fontWeight="bold">
                    <tspan x="337" dy="0">Subtotal</tspan>
                    <tspan x="337" dy="20">Tax</tspan>
                    <tspan x="337" dy="20">Discount</tspan>
                    <tspan x="337" dy="20">Total</tspan>
                    <tspan x="337" dy="20">Amount Paid</tspan>
                    <tspan x="337" dy="20">Due</tspan>
                  </text>

                  <text x="450" y="490" fill="#fff" fontSize="11" fontWeight="bold">
                    <tspan x="450" dy="0">{formatCurrency(subtotal)}</tspan>
                    <tspan x="450" dy="20">{formatCurrency(taxAmount)}</tspan>
                    <tspan x="450" dy="20">{formatCurrency(discountAmount)}</tspan>
                    <tspan x="450" dy="20">{formatCurrency(total)}</tspan>
                    <tspan x="450" dy="20">{formatCurrency(paidAmount)}</tspan>
                    <tspan x="450" dy="20">{formatCurrency(dueAmount)}</tspan>
                  </text>

                  {/* Payment Info */}
                  {dueAmount > 0 && (
                  <>
                  <text x="68" y="620" fill="#fff">
                    <tspan x="68" dy="0" fontWeight="bold" fontSize="14" fill={primaryColor}>Payment Info:</tspan>
                    {tenantBranding?.accountNumber && <tspan x="68" dy="18" fontSize="10">Account Number:</tspan>}
                    {tenantBranding?.accountName && <tspan x="68" dy="18" fontSize="10">A/C Name:</tspan>}
                    {tenantBranding?.bankName && <tspan x="68" dy="18" fontSize="10">Bank Name:</tspan>}
                  </text>
                  
                  <text x="160" y="620" fill="#fff">
                    {tenantBranding?.accountNumber && <tspan x="160" dy="18" fontSize="10">{tenantBranding.accountNumber}</tspan>}
                    {tenantBranding?.accountName && <tspan x="160" dy="18" fontSize="10">{tenantBranding.accountName}</tspan>}
                    {tenantBranding?.bankName && <tspan x="160" dy="18" fontSize="10">{tenantBranding.bankName}</tspan>}
                  </text>
                  </>
                  )}
                  {dueAmount <= 0 && (
                    <text x="68" y="620" fill="#fff" fontSize="10" fontWeight="bold">
                      Thank you for shopping with us!
                    </text>
                  )}
                </>
              )}

              {/* Footer */}
              <text x="298" y="805" textAnchor="middle" fill="#fff" fontSize="10">
                Powered by <tspan fill={primaryColor} fontWeight="bold">abledger.com</tspan>
              </text>
              

              <text x="298" y="825" textAnchor="middle" fill="#aaa" fontSize="9">
                Page {pageIndex + 1} of {pages.length}
              </text>
            </svg>
          </div>
        ))}
        </div>
      </div>
    </>
  )
}
