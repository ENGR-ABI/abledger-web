import type { Metadata } from "next"
import Content from "@/components/dashboard-layout/content"
import Layout from "@/components/dashboard-layout/layout"
import ReportsContent from "@/components/reports/reports-content"

export const metadata: Metadata = {
  title: "Reports - AbLedger",
  description: "Generate and export business reports",
}

export default function ReportsPage() {
  return (
    <Layout>
      <Content>
        <ReportsContent />
      </Content>
    </Layout>
  )
}

