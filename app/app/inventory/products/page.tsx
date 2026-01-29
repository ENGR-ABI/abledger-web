import type { Metadata } from "next"
import Layout from "@/components/dashboard-layout/layout"
import ProductsContent from "@/components/inventory/products-content"

export const metadata: Metadata = {
  title: "Products - AbLedger",
  description: "Manage your inventory products",
}

export default function ProductsPage() {
  return (
    <Layout>
      <ProductsContent />
    </Layout>
  )
}


