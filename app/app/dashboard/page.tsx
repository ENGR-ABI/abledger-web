import type { Metadata } from "next"
import Content from "@/components/dashboard-layout/content"
import Layout from "@/components/dashboard-layout/layout"

export const metadata: Metadata = {
  title: "Dashboard - AbLedger",
  description: "AbLedger dashboard for managing your business operations",
}

export default function TenantDashboardPage() {
  return (
    <Layout>
      <Content />
    </Layout>
  )
}

