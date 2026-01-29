import type { Metadata } from "next"
import Layout from "@/components/dashboard-layout/layout"
import SalesContent from "@/components/sales/sales-content"

export const metadata: Metadata = {
  title: "Sales - AbLedger",
  description: "Manage your sales and orders",
}

export default function SalesPage() {
  return (
    <Layout>
      <SalesContent />
    </Layout>
  )
}


