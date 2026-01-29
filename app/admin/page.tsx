import type { Metadata } from "next"
import AdminDashboardContent from "@/components/admin/admin-dashboard-content"
import AdminLayout from "@/components/admin-layout/admin-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export const metadata: Metadata = {
  title: "Admin Dashboard - AbLedger",
  description: "Platform administration dashboard",
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requireRole="PLATFORM_ADMIN">
      <AdminLayout>
        <AdminDashboardContent />
      </AdminLayout>
    </ProtectedRoute>
  )
}

