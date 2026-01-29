"use client"

import { useEffect, useState } from "react"
import { Search, Plus, MoreVertical, Eye, Ban, CheckCircle2, Loader2, Mail, Calendar, User, Trash2, Building2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Label } from "@/components/ui/label"
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
import { Pagination } from "@/components/ui/pagination"

export default function AdminUsersContent() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<PlatformAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'platform_admin' | 'tenant_user'>('all')
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20
  const [selectedUser, setSelectedUser] = useState<PlatformAdmin | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"activate" | "deactivate" | null>(null)
  const [newUser, setNewUser] = useState({ email: "", password: "", fullName: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [currentPage, userTypeFilter, roleFilter])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const offset = (currentPage - 1) * itemsPerPage
      const response = await adminApi.getPlatformAdmins(
        itemsPerPage,
        offset,
        userTypeFilter,
        undefined, // tenantId filter - can be added later
        roleFilter !== "all" ? roleFilter : undefined
      )
      
      // Client-side search filtering
      let filteredUsers = response.users
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredUsers = response.users.filter(
          (user) =>
            user.email.toLowerCase().includes(query) ||
            user.fullName?.toLowerCase().includes(query) ||
            user.tenantName?.toLowerCase().includes(query)
        )
      }
      
      setUsers(filteredUsers)
      setTotalItems(response.total)
    } catch (error: any) {
      console.error("Failed to fetch users:", error)
      toast.error(error.message || "Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivate = async (user: PlatformAdmin) => {
    try {
      await adminApi.updatePlatformAdmin(user.id, { isActive: true })
      toast.success(`User "${user.email}" has been activated`)
      fetchUsers()
      setIsActionDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to activate user")
    }
  }

  const handleDeactivate = async (user: PlatformAdmin) => {
    // Prevent self-deactivation
    if (currentUser?.id === user.id) {
      toast.error("You cannot deactivate yourself")
      setIsActionDialogOpen(false)
      return
    }
    try {
      await adminApi.updatePlatformAdmin(user.id, { isActive: false })
      toast.success(`User "${user.email}" has been deactivated`)
      fetchUsers()
      setIsActionDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate user")
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    
    // Prevent self-removal
    if (currentUser?.id === selectedUser.id) {
      toast.error("You cannot remove your own platform admin access")
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      return
    }
    
    try {
      await adminApi.removePlatformAdmin(selectedUser.id)
      toast.success(`Platform admin access removed for "${selectedUser.email}"`)
      fetchUsers()
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to remove platform admin access")
    }
  }

  const handleCreate = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error("Email and password are required")
      return
    }

    try {
      setIsSubmitting(true)
      await adminApi.createPlatformAdmin({
        email: newUser.email,
        password: newUser.password,
        fullName: newUser.fullName || undefined,
      })
      toast.success(`Platform admin "${newUser.email}" created successfully`)
      setIsCreateDialogOpen(false)
      setNewUser({ email: "", password: "", fullName: "" })
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message || "Failed to create platform admin")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openActionDialog = (user: PlatformAdmin, action: "activate" | "deactivate") => {
    setSelectedUser(user)
    setActionType(action)
    setIsActionDialogOpen(true)
  }

  const openDeleteDialog = (user: PlatformAdmin) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const getStatusBadge = (user: PlatformAdmin) => {
    if (user.isActive) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
    }
    return <Badge variant="secondary">Inactive</Badge>
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    } catch {
      return "Invalid date"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage all users including platform admins and tenant users
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Platform Admin
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={userTypeFilter} onValueChange={(value: 'all' | 'platform_admin' | 'tenant_user') => {
          setUserTypeFilter(value)
          setCurrentPage(1)
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="User Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="platform_admin">Platform Admins</SelectItem>
            <SelectItem value="tenant_user">Tenant Users</SelectItem>
          </SelectContent>
        </Select>
        {userTypeFilter === 'tenant_user' && (
          <Select value={roleFilter} onValueChange={(value) => {
            setRoleFilter(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="TENANT_OWNER">Owner</SelectItem>
              <SelectItem value="TENANT_ADMIN">Admin</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No users found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email Verified</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{user.fullName || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.userType === 'platform_admin' ? (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        Platform Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline">Tenant User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.tenantName ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <Link 
                          href={`/admin/tenants/${user.tenantId}`}
                          className="text-sm hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {user.tenantName}
                        </Link>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.role ? (
                      <Badge variant="outline">{user.role.replace('TENANT_', '').replace('_', ' ')}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell>
                    {user.emailVerified ? (
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline">Unverified</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(user.lastLogin)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(user.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {user.isActive ? (
                          <DropdownMenuItem 
                            onClick={() => openActionDialog(user, "deactivate")}
                            disabled={currentUser?.id === user.id}
                            className={currentUser?.id === user.id ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Deactivate
                            {currentUser?.id === user.id && " (Cannot deactivate yourself)"}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => openActionDialog(user, "activate")}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {user.userType === 'platform_admin' && (
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(user)}
                            disabled={currentUser?.id === user.id}
                            className={`text-red-600 dark:text-red-400 ${currentUser?.id === user.id ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Platform Admin Access
                            {currentUser?.id === user.id && " (Cannot remove your own access)"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalItems > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalItems / itemsPerPage)}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Platform Admin</DialogTitle>
            <DialogDescription>
              Create a new platform administrator account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Admin"
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
              <strong>{selectedUser?.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (actionType === "activate" && selectedUser) {
                  handleActivate(selectedUser)
                } else if (actionType === "deactivate" && selectedUser) {
                  handleDeactivate(selectedUser)
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
              <strong>{selectedUser?.email}</strong>? This will only remove their platform admin privileges. 
              If they are also a tenant user, that access will remain. This action cannot be undone.
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

