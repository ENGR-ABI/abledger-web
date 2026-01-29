import AdminLayout from "@/components/admin-layout/admin-layout"
import AdminUsersContent from "@/components/admin/admin-users-content"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requireRole="PLATFORM_ADMIN">
      <AdminLayout>
        <AdminUsersContent />
      </AdminLayout>
    </ProtectedRoute>
  )
}

