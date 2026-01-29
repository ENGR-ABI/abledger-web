import type { Metadata } from "next"
import Content from "@/components/dashboard-layout/content"
import Layout from "@/components/dashboard-layout/layout"
import BillingSettingsContent from "@/components/settings/billing-settings-content"

export const metadata: Metadata = {
  title: "Billing & Subscription - AbLedger",
  description: "Manage your subscription and billing",
}

export default function BillingSettingsPage() {
  return (
    <Layout>
      <Content>
        <BillingSettingsContent />
      </Content>
    </Layout>
  )
}

