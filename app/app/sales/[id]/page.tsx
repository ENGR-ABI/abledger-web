import type { Metadata } from "next"
import Layout from "@/components/dashboard-layout/layout"
import SaleDetailContent from "@/components/sales/sale-detail-content"

export const metadata: Metadata = {
  title: "Sale Details - AbLedger",
  description: "View sale transaction details",
}

export default function SaleDetailPage() {
  return (
    <Layout>
      <SaleDetailContent />
    </Layout>
  )
}


