import type { Metadata } from "next"
import Content from "@/components/dashboard-layout/content"
import Layout from "@/components/dashboard-layout/layout"
import ProfileSettingsContent from "@/components/settings/profile-settings-content"

export const metadata: Metadata = {
  title: "Profile Settings - AbLedger",
  description: "Manage your personal profile settings",
}

export default function ProfileSettingsPage() {
  return (
    <Layout>
      <Content>
        <ProfileSettingsContent />
      </Content>
    </Layout>
  )
}

