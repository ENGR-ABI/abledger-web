import type { Metadata } from "next"
import Layout from "@/components/dashboard-layout/layout"
import InvoicesContent from "@/components/invoices/invoices-content"

export const metadata: Metadata = {
  title: "Invoices - AbLedger",
  description: "View and manage your invoices",
}

export default function InvoicesPage() {
  return (
    <Layout>
      <InvoicesContent />
    </Layout>
  )
}

