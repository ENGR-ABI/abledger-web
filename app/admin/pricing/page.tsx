import type { Metadata } from "next"
import AdminPricingContent from "@/components/admin/admin-pricing-content"
import AdminLayout from "@/components/admin-layout/admin-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export const metadata: Metadata = {
  title: "Pricing Plans - Admin - AbLedger",
  description: "Manage pricing plans and features",
}

export default function AdminPricingPage() {
  return (
    <ProtectedRoute requireRole="PLATFORM_ADMIN">
      <AdminLayout>
        <AdminPricingContent />
      </AdminLayout>
    </ProtectedRoute>
  )
}

