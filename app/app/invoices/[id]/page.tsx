import type { Metadata } from "next"
import Content from "@/components/dashboard-layout/content"
import Layout from "@/components/dashboard-layout/layout"
import InvoiceDetailContent from "@/components/invoices/invoice-detail-content"

export const metadata: Metadata = {
  title: "Invoice - AbLedger",
  description: "View invoice details",
}

export default function InvoicePage() {
  return (
    <Layout>
      <Content>
        <InvoiceDetailContent />
      </Content>
    </Layout>
  )
}

