"use client"

import { useEffect, useState } from "react"
import { Search, Plus, MoreVertical, Eye, Ban, CheckCircle2, Loader2, Download, Mail, Calendar, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import type { Tenant } from "@/lib/api/types"
import { toast } from "sonner"
import Link from "next/link"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"

export default function AdminTenantsContent() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"suspend" | "activate" | null>(null)

  useEffect(() => {
    fetchTenants()
  }, [currentPage, statusFilter, searchQuery])

  const fetchTenants = async () => {
    try {
      setIsLoading(true)
      const offset = (currentPage - 1) * itemsPerPage
      const status = statusFilter !== "all" ? statusFilter : undefined
      const response = await adminApi.getTenants(itemsPerPage, offset, searchQuery || undefined, status)
      setTenants(response.tenants)
      setTotalItems(response.total)
    } catch (error: any) {
      console.error("Failed to fetch tenants:", error)
      toast.error(error.message || "Failed to load tenants")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuspend = async (tenant: Tenant) => {
    try {
      await adminApi.suspendTenant(tenant.id)
      toast.success(`Tenant "${tenant.name}" has been suspended`)
      fetchTenants()
      setIsActionDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to suspend tenant")
    }
  }

  const handleActivate = async (tenant: Tenant) => {
    try {
      await adminApi.activateTenant(tenant.id)
      toast.success(`Tenant "${tenant.name}" has been activated`)
      fetchTenants()
      setIsActionDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to activate tenant")
    }
  }

  const openActionDialog = (tenant: Tenant, action: "suspend" | "activate") => {
    setSelectedTenant(tenant)
    setActionType(action)
    setIsActionDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Active
          </Badge>
        )
      case "SUSPENDED":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Suspended
          </Badge>
        )
      case "TRIAL":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Trial
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        )
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Slug', 'Status', 'Subscription Plan', 'Subscription Status', 'Owner Email', 'Created At', 'Trial Ends', 'Subscription Ends']
    const rows = tenants.map(tenant => [
      tenant.name,
      tenant.slug,
      tenant.status,
      tenant.subscription_plan || 'N/A',
      tenant.subscription_status || 'N/A',
      tenant.owner_email || 'N/A',
      tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'N/A',
      tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString() : 'N/A',
      tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at).toLocaleDateString() : 'N/A',
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tenants-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('Tenants exported successfully')
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const getSubscriptionStatusBadge = (status: string | null | undefined) => {
    if (!status) return null
    switch (status.toUpperCase()) {
      case "TRIALING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
            Trial
          </Badge>
        )
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
            Active
          </Badge>
        )
      case "PAST_DUE":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
            Past Due
          </Badge>
        )
      case "CANCELED":
      case "EXPIRED":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">
            {status}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">{status}</Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tenant Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage all tenants on the platform ({totalItems} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={tenants.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90 gap-2"
            onClick={() => {
              // TODO: Open create tenant dialog
              toast.info('Create tenant functionality coming soon')
            }}
          >
            <Plus className="h-4 w-4" />
            Create Tenant
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23]">
        <div className="p-4 border-b border-gray-200 dark:border-[#1F1F23]">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tenants by name or slug..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && tenants.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            Loading tenants...
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No tenants found
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow 
                    key={tenant.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1F1F23]"
                    onClick={() => {
                      // Navigate to tenant details
                      window.location.href = `/admin/tenants/${tenant.id}`
                    }}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{tenant.name}</span>
                        <span className="text-xs text-muted-foreground">@{tenant.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(tenant.status)}
                        {getSubscriptionStatusBadge(tenant.subscription_status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{tenant.subscription_plan || "No Plan"}</span>
                        {tenant.subscription_status && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {tenant.subscription_status.toLowerCase().replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tenant.owner_email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{tenant.owner_email}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Created: {formatDate(tenant.created_at)}</span>
                        </div>
                        {tenant.trial_ends_at && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span>Trial ends: {formatDate(tenant.trial_ends_at)}</span>
                          </div>
                        )}
                        {tenant.subscription_ends_at && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <CreditCard className="h-3 w-3" />
                            <span>Sub ends: {formatDate(tenant.subscription_ends_at)}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/admin/tenants/${tenant.id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          {tenant.status === "ACTIVE" ? (
                            <DropdownMenuItem
                              onClick={() => openActionDialog(tenant, "suspend")}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => openActionDialog(tenant, "activate")}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalItems > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / itemsPerPage)}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
              />
            )}
          </>
        )}
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "suspend" ? "Suspend Tenant" : "Activate Tenant"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionType === "suspend" ? "suspend" : "activate"} the tenant{" "}
              <strong>{selectedTenant?.name}</strong>? This action will{" "}
              {actionType === "suspend"
                ? "prevent users from accessing their tenant dashboard."
                : "restore access to the tenant dashboard."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedTenant) {
                  if (actionType === "suspend") {
                    handleSuspend(selectedTenant)
                  } else {
                    handleActivate(selectedTenant)
                  }
                }
              }}
              variant={actionType === "suspend" ? "destructive" : "default"}
            >
              {actionType === "suspend" ? "Suspend" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

