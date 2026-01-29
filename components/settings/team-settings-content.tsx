"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, Edit, Trash2, Mail, User as UserIcon, Shield, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usersApi, User } from "@/lib/api/users"
import { ROLE_OPTIONS, getRoleCapabilities } from "@/lib/api/roles"
import { useAuth } from "@/contexts/auth-context"
import { usePermissions } from "@/hooks/use-permissions"
import { RouteProtection } from "@/components/auth/route-protection"
import { toast } from "sonner"
import { tenantsApi, TenantSettings } from "@/lib/api/tenants"
import { useRouter } from "next/navigation"
import { pricingApi, PricingPlan } from "@/lib/api/pricing"
import { ArrowUpRight } from "lucide-react"

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export default function TeamSettingsContent() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null)
  const [availablePlans, setAvailablePlans] = useState<PricingPlan[]>([])

  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: 'STAFF',
  })

  const [editFormData, setEditFormData] = useState({
    role: '',
    status: '',
  })

  // Check if current user can manage users
  const { canManage, canView } = usePermissions()
  const canManageUsers = canManage('team')
  const canChangeRoles = currentUser?.role === 'TENANT_OWNER'
  const canDeleteUsers = currentUser?.role === 'TENANT_OWNER'

  // Protect route


  useEffect(() => {
    if (canManageUsers && currentUser?.tenantId) {
      fetchUsers()
      fetchTenantSettings()
      fetchAvailablePlans()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageUsers, currentUser?.tenantId])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const data = await usersApi.getUsers(1000, 0)
      setUsers(data)
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load team members')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTenantSettings = async () => {
    if (!currentUser?.tenantId) return
    try {
      const settings = await tenantsApi.getTenantSettings(currentUser.tenantId)
      setTenantSettings(settings)
    } catch (error: any) {
      console.error('Failed to fetch tenant settings:', error)
    }
  }

  const fetchAvailablePlans = async () => {
    try {
      const plans = await pricingApi.getActivePlans()
      // Filter out trial plans and sort by price
      const paidPlans = plans
        .filter(plan => !plan.isTrial && plan.billingCycle === 'yearly')
        .sort((a, b) => a.price - b.price)
      setAvailablePlans(paidPlans)
    } catch (error: any) {
      console.error('Failed to fetch pricing plans:', error)
    }
  }

  // Get the next plan tier (plan with higher price than current)
  const getNextPlan = (): PricingPlan | null => {
    if (!tenantSettings?.subscriptionPlan || availablePlans.length === 0) {
      return availablePlans.find(plan => plan.planCode === 'BUSINESS') || null
    }

    const currentPlan = availablePlans.find(
      plan => plan.planCode === tenantSettings.subscriptionPlan
    )

    if (!currentPlan) {
      // If current plan not found, return BUSINESS as default upgrade
      return availablePlans.find(plan => plan.planCode === 'BUSINESS') || null
    }

    // Find the next plan with higher price
    const nextPlan = availablePlans.find(plan => plan.price > currentPlan.price)
    return nextPlan || null
  }

  const handleInviteUser = async () => {
    if (!inviteFormData.email) {
      toast.error('Email is required')
      return
    }

    if (!inviteFormData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setIsSubmitting(true)
      await usersApi.inviteUser({
        email: inviteFormData.email,
        role: inviteFormData.role,
      })
      toast.success('User invited successfully! An email with login credentials has been sent.')
      setIsInviteDialogOpen(false)
      setInviteFormData({ email: '', role: 'STAFF' })
      await fetchUsers()
      await fetchTenantSettings()
    } catch (error: any) {
      console.error('Failed to invite user:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to invite user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditUser = (user: User) => {
    // Don't allow editing TENANT_OWNER
    if (user.role === 'TENANT_OWNER') {
      toast.error('Cannot edit tenant owner')
      return
    }
    setSelectedUser(user)
    setEditFormData({
      role: user.role,
      status: user.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      setIsSubmitting(true)
      // Update role if changed
      if (editFormData.role !== selectedUser.role) {
        await usersApi.updateUserRole(selectedUser.id, editFormData.role)
      }
      // Update status if changed
      if (editFormData.status !== selectedUser.status) {
        await usersApi.updateUserStatus(selectedUser.id, editFormData.status)
      }
      toast.success('User updated successfully')
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to update user:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to update user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (user: User) => {
    if (user.role === 'TENANT_OWNER') {
      toast.error('Cannot delete tenant owner')
      return
    }
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setIsSubmitting(true)
      await usersApi.removeUser(selectedUser.id)
      toast.success('User removed successfully')
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to remove user:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to remove user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'TENANT_OWNER') return 'default'
    if (role === 'TENANT_ADMIN') return 'secondary'
    return 'outline'
  }

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'ACTIVE') return 'default'
    if (status === 'INACTIVE') return 'secondary'
    return 'destructive'
  }

  const getRoleLabel = (role: string) => {
    const roleOption = ROLE_OPTIONS.find(r => r.value === role)
    return roleOption?.label || (role === 'TENANT_OWNER' ? 'Owner' : role)
  }

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Access Denied</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  You don&apos;t have permission to manage team members. Only owners and admins can access this page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!canView('team')) {
    return (
      <RouteProtection resource="team" requiredPermission="view">
        <div />
      </RouteProtection>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd]" />
      </div>
    )
  }

  const selectedRoleCapabilities = inviteFormData.role ? getRoleCapabilities(inviteFormData.role) : null

  // Check if staff limit is reached
  const planLimits = tenantSettings?.planLimits
  const maxStaffUsers = planLimits?.maxStaffUsers
  const currentStaffCount = planLimits?.currentStaffCount || 0
  const isStaffLimitReached = maxStaffUsers != null && currentStaffCount >= maxStaffUsers
  const isInvitingStaff = inviteFormData.role === 'STAFF' || inviteFormData.role === 'TENANT_ADMIN'

  return (
    <div className="space-y-6">
      {/* Upgrade Prompt Card when limit is reached */}
      {isStaffLimitReached && getNextPlan() && (
        <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Staff User Limit Reached
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    You&apos;ve reached the maximum of {maxStaffUsers} staff users on your {tenantSettings?.subscriptionPlan || 'current'} plan.
                    Upgrade to <strong>{getNextPlan()?.name}</strong> to add more team members.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => router.push('/app/settings/billing')}
                      className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
                      size="sm"
                    >
                      Upgrade to {getNextPlan()?.name}
                      <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      {getNextPlan()?.maxStaffUsers === null
                        ? 'Unlimited staff users'
                        : `Up to ${getNextPlan()?.maxStaffUsers} staff users`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Members</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your team members and their roles. New users will receive an email with their login credentials.
          </p>
          {planLimits && maxStaffUsers !== null && (
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Staff users: <strong>{currentStaffCount}</strong> / <strong>{maxStaffUsers}</strong>
                </span>
                {isStaffLimitReached && (
                  <Badge variant="destructive" className="ml-2">
                    Limit Reached
                  </Badge>
                )}
              </div>
              {isStaffLimitReached && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/app/settings/billing')}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  Upgrade Plan
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
              disabled={isStaffLimitReached}
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Invite a new user to join your team. They will receive an email with their login credentials and role information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteFormData.email}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  The user will receive login credentials at this email address
                </p>
              </div>
              <div>
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteFormData.role}
                  onValueChange={(value) => setInviteFormData({ ...inviteFormData, role: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isInvitingStaff && isStaffLimitReached && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                        Staff User Limit Reached
                      </h4>
                      <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                        Your {tenantSettings?.subscriptionPlan || 'current'} plan allows up to {maxStaffUsers} staff users.
                        You currently have {currentStaffCount} staff members.
                      </p>
                      {getNextPlan() && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setIsInviteDialogOpen(false)
                              router.push('/app/settings/billing')
                            }}
                            className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
                          >
                            Upgrade to {getNextPlan()?.name}
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                          <span className="text-xs text-red-700 dark:text-red-300">
                            {getNextPlan()?.maxStaffUsers === null
                              ? 'Unlimited staff users'
                              : `Up to ${getNextPlan()?.maxStaffUsers} staff users`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedRoleCapabilities && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        {selectedRoleCapabilities.name} - {selectedRoleCapabilities.description}
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-2 font-medium">Capabilities:</p>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        {selectedRoleCapabilities.capabilities.map((capability, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{capability}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInviteUser}
                disabled={isSubmitting || !inviteFormData.email || (isInvitingStaff && isStaffLimitReached)}
                className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Team Members</CardTitle>
          <CardDescription>
            View and manage all users in your organization ({users.length} {users.length === 1 ? 'member' : 'members'})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members yet</p>
              <p className="text-sm mt-2">Invite your first team member to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isOwner = user.role === 'TENANT_OWNER'
                  const isCurrentUser = user.id === currentUser?.id
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                          {isCurrentUser && (
                            <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {STATUSES.find((s) => s.value === user.status)?.label || user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!isOwner && canManageUsers && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              title="Edit user"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {!isOwner && canDeleteUsers && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              title="Remove user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user role and status for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                disabled={!canChangeRoles}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!canChangeRoles && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Only tenant owners can change user roles
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{selectedUser?.email}</strong> from your team?
              This action cannot be undone. The user will lose access to the platform immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
