import type { Metadata } from "next"
import Content from "@/components/dashboard-layout/content"
import Layout from "@/components/dashboard-layout/layout"
import BrandingSettingsContent from "@/components/settings/branding-settings-content"

export const metadata: Metadata = {
  title: "Branding Settings - AbLedger",
  description: "Manage your organization's branding and appearance",
}

export default function BrandingSettingsPage() {
  return (
    <Layout>
      <Content>
        <BrandingSettingsContent />
      </Content>
    </Layout>
  )
}

