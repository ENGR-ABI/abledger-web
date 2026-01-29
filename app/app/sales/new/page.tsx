import type { Metadata } from "next"
import Layout from "@/components/dashboard-layout/layout"
import NewSaleContent from "@/components/sales/new-sale-content"

export const metadata: Metadata = {
  title: "New Sale - AbLedger",
  description: "Create a new sale transaction",
}

export default function NewSalePage() {
  return (
    <Layout>
      <NewSaleContent />
    </Layout>
  )
}


