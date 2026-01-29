import AdminLayout from "@/components/admin-layout/admin-layout"
import AdminUserDetailContent from "@/components/admin/admin-user-detail-content"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AdminUserDetailPage() {
  return (
    <ProtectedRoute requireRole="PLATFORM_ADMIN">
      <AdminLayout>
        <AdminUserDetailContent />
      </AdminLayout>
    </ProtectedRoute>
  )
}

