import type { Metadata } from "next"
import Content from "@/components/dashboard-layout/content"
import Layout from "@/components/dashboard-layout/layout"
import TeamSettingsContent from "@/components/settings/team-settings-content"

export const metadata: Metadata = {
  title: "Team Members - AbLedger",
  description: "Manage your team members and their roles",
}

export default function TeamSettingsPage() {
  return (
    <Layout>
      <Content>
        <TeamSettingsContent />
      </Content>
    </Layout>
  )
}

