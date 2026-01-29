import type { Metadata } from "next"
import AdminTenantDetailContent from "@/components/admin/admin-tenant-detail-content"
import AdminLayout from "@/components/admin-layout/admin-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export const metadata: Metadata = {
  title: "Tenant Details - AbLedger Admin",
  description: "View and manage tenant details",
}

export default function AdminTenantDetailPage() {
  return (
    <ProtectedRoute requireRole="PLATFORM_ADMIN">
      <AdminLayout>
        <AdminTenantDetailContent />
      </AdminLayout>
    </ProtectedRoute>
  )
}

