"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Loader2, 
  Mail, 
  Calendar, 
  User,
  CheckCircle2,
  XCircle,
  Ban,
  Trash2,
  Edit,
  Building2,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { adminApi } from "@/lib/api/admin"
import type { PlatformAdmin } from "@/lib/api/admin"
import { toast } from "sonner"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function AdminUserDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const userId = params.id as string
  const [user, setUser] = useState<PlatformAdmin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"activate" | "deactivate" | null>(null)
  
  // Form states
  const [fullName, setFullName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getUser(userId)
      setUser(data)
      setFullName(data.fullName || "")
    } catch (error: any) {
      console.error("Failed to fetch user:", error)
      // Only redirect on 404 (user not found), not on other errors
      if (error.status === 404 || error.statusCode === 404) {
        toast.error("User not found")
        router.push("/admin/users")
      } else {
        toast.error(error.message || "Failed to load user details")
        // Don't redirect on other errors, just show the error
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      setIsSubmitting(true)
      await adminApi.updatePlatformAdmin(userId, {
        fullName: fullName || undefined,
      })
      toast.success("User updated successfully")
      setIsEditDialogOpen(false)
      fetchUser()
    } catch (error: any) {
      toast.error(error.message || "Failed to update user")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleActivate = async () => {
    try {
      await adminApi.updatePlatformAdmin(userId, { isActive: true })
      toast.success("User activated successfully")
      setIsActionDialogOpen(false)
      fetchUser()
    } catch (error: any) {
      toast.error(error.message || "Failed to activate user")
    }
  }

  const handleDeactivate = async () => {
    // Prevent self-deactivation
    if (currentUser?.id === userId) {
      toast.error("You cannot deactivate yourself")
      setIsActionDialogOpen(false)
      return
    }
    try {
      await adminApi.updatePlatformAdmin(userId, { isActive: false })
      toast.success("User deactivated successfully")
      setIsActionDialogOpen(false)
      fetchUser()
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate user")
    }
  }

  const handleDelete = async () => {
    // Prevent self-removal
    if (currentUser?.id === userId) {
      toast.error("You cannot remove your own platform admin access")
      setIsDeleteDialogOpen(false)
      return
    }
    try {
      await adminApi.removePlatformAdmin(userId)
      toast.success("Platform admin access removed")
      router.push("/admin/users")
    } catch (error: any) {
      toast.error(error.message || "Failed to remove platform admin access")
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    try {
      const date = new Date(dateString)
      return date.toLocaleString("en-US", { 
        year: "numeric", 
        month: "short", 
        day: "numeric",
        hour: "numeric",
        minute: "numeric"
      })
    } catch {
      return "Invalid date"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{user.email}</h1>
            <p className="text-muted-foreground mt-1">
              {user.userType === 'platform_admin' ? 'Platform Admin' : 'Tenant User'} Details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.isActive ? (
            currentUser?.id !== user.id ? (
              <Button
                variant="outline"
                onClick={() => {
                  setActionType("deactivate")
                  setIsActionDialogOpen(true)
                }}
              >
                <Ban className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled
                title="You cannot deactivate yourself"
              >
                <Ban className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
            )
          ) : (
            <Button
              onClick={() => {
                setActionType("activate")
                setIsActionDialogOpen(true)
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Activate
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {user.userType === 'platform_admin' && (
            currentUser?.id !== user.id ? (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Platform Admin Access
              </Button>
            ) : (
              <Button
                variant="destructive"
                disabled
                title="You cannot remove your own platform admin access"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Platform Admin Access
              </Button>
            )
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Type</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {user.userType === 'platform_admin' ? (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                Platform Admin
              </Badge>
            ) : (
              <Badge variant="outline">Tenant User</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {user.isActive ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
          </CardHeader>
          <CardContent>
            {user.isActive ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Verified</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {user.emailVerified ? (
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                Verified
              </Badge>
            ) : (
              <Badge variant="outline">Unverified</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Login</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {formatDate(user.lastLogin)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            {user.userType === 'platform_admin' ? 'Platform administrator' : 'Tenant user'} account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
              <p className="text-sm font-mono mt-1">{user.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{user.email}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{user.fullName || "—"}</p>
              </div>
            </div>
            {user.role && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                <div className="mt-1">
                  <Badge variant="outline">{user.role.replace('TENANT_', '').replace('_', ' ')}</Badge>
                </div>
              </div>
            )}
            {user.tenantName && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Tenant</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Link 
                    href={`/admin/tenants/${user.tenantId}`}
                    className="text-sm hover:underline text-blue-600 dark:text-blue-400"
                  >
                    {user.tenantName}
                  </Link>
                </div>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Updated At</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{formatDate(user.updatedAt)}</p>
              </div>
            </div>
            {user.avatarUrl && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Avatar</Label>
                <div className="mt-1">
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="h-10 w-10 rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update platform admin user information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate/Deactivate Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "activate" ? "Activate User" : "Deactivate User"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionType === "activate" ? "activate" : "deactivate"}{" "}
              <strong>{user.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (actionType === "activate") {
                  handleActivate()
                } else {
                  handleDeactivate()
                }
              }}
            >
              {actionType === "activate" ? "Activate" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Platform Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove platform admin access from{" "}
              <strong>{user.email}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

