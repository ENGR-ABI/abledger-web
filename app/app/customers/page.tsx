import type { Metadata } from "next"
import Layout from "@/components/dashboard-layout/layout"
import CustomersContent from "@/components/customers/customers-content"

export const metadata: Metadata = {
  title: "Customers - AbLedger",
  description: "Manage your customers",
}

export default function CustomersPage() {
  return (
    <Layout>
      <CustomersContent />
    </Layout>
  )
}


