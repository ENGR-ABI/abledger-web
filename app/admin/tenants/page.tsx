import type { Metadata } from "next"
import AdminTenantsContent from "@/components/admin/admin-tenants-content"
import AdminLayout from "@/components/admin-layout/admin-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export const metadata: Metadata = {
  title: "Tenant Management - AbLedger Admin",
  description: "Manage all tenants on the platform",
}

export default function AdminTenantsPage() {
  return (
    <ProtectedRoute requireRole="PLATFORM_ADMIN">
      <AdminLayout>
        <AdminTenantsContent />
      </AdminLayout>
    </ProtectedRoute>
  )
}

