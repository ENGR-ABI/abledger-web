"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Loader2, 
  Building2, 
  Mail, 
  Calendar, 
  CreditCard, 
  Clock, 
  TrendingUp,
  Send,
  Ban,
  CheckCircle2,
  AlertTriangle,
  User,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function AdminTenantDetailContent() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialog states
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false)
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"suspend" | "activate" | null>(null)
  
  // Form states
  const [extendDays, setExtendDays] = useState("30")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [messageTitle, setMessageTitle] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [messageType, setMessageType] = useState("system")
  const [emailType, setEmailType] = useState("notification")
  const messageEditorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tenantId) {
      fetchTenant()
    }
  }, [tenantId])

  const fetchTenant = async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getTenant(tenantId)
      setTenant(data)
      setSelectedPlan(data.subscription_plan || "")
    } catch (error: any) {
      console.error("Failed to fetch tenant:", error)
      toast.error(error.message || "Failed to load tenant details")
      router.push("/admin/tenants")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExtendSubscription = async () => {
    try {
      const days = parseInt(extendDays)
      if (isNaN(days) || days <= 0) {
        toast.error("Please enter a valid number of days")
        return
      }
      await adminApi.extendSubscription(tenantId, { days })
      toast.success(`Subscription extended by ${days} days`)
      setIsExtendDialogOpen(false)
      setExtendDays("30")
      fetchTenant()
    } catch (error: any) {
      toast.error(error.message || "Failed to extend subscription")
    }
  }

  const handleUpgradePlan = async () => {
    try {
      if (!selectedPlan) {
        toast.error("Please select a plan")
        return
      }
      await adminApi.upgradePlan(tenantId, { plan: selectedPlan })
      toast.success(`Subscription plan upgraded to ${selectedPlan}`)
      setIsUpgradeDialogOpen(false)
      fetchTenant()
    } catch (error: any) {
      toast.error(error.message || "Failed to upgrade plan")
    }
  }

  const handleSendMessage = async () => {
    try {
      if (!messageTitle || !messageContent) {
        toast.error("Please fill in both title and message")
        return
      }
      await adminApi.sendMessage(tenantId, {
        title: messageTitle,
        message: messageContent,
        type: messageType,
        emailType: emailType,
      })
      toast.success("Message sent to tenant")
      setIsMessageDialogOpen(false)
      setMessageTitle("")
      setMessageContent("")
      setMessageType("system")
      setEmailType("notification")
      if (messageEditorRef.current) {
        messageEditorRef.current.innerHTML = ""
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send message")
    }
  }

  const handleSuspend = async () => {
    try {
      await adminApi.suspendTenant(tenantId)
      toast.success(`Tenant "${tenant?.name}" has been suspended`)
      setIsActionDialogOpen(false)
      fetchTenant()
    } catch (error: any) {
      toast.error(error.message || "Failed to suspend tenant")
    }
  }

  const handleActivate = async () => {
    try {
      await adminApi.activateTenant(tenantId)
      toast.success(`Tenant "${tenant?.name}" has been activated`)
      setIsActionDialogOpen(false)
      fetchTenant()
    } catch (error: any) {
      toast.error(error.message || "Failed to activate tenant")
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'N/A'
    }
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
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSubscriptionStatusBadge = (status: string | null | undefined) => {
    if (!status) return null
    switch (status.toUpperCase()) {
      case "TRIALING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Trial
          </Badge>
        )
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Active
          </Badge>
        )
      case "PAST_DUE":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            Past Due
          </Badge>
        )
      case "CANCELED":
      case "EXPIRED":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {status}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd]" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tenant not found</p>
        <Link href="/admin/tenants">
          <Button variant="outline" className="mt-4">
            Back to Tenants
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/tenants">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              @{tenant.slug} • {tenant.owner_email || 'No owner email'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {tenant.status === "ACTIVE" ? (
            <Button
              variant="destructive"
              onClick={() => {
                setActionType("suspend")
                setIsActionDialogOpen(true)
              }}
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspend
            </Button>
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
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Extend Subscription
            </CardTitle>
            <CardDescription>Add days to the subscription period</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
              onClick={() => setIsExtendDialogOpen(true)}
            >
              Extend Period
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Upgrade Plan
            </CardTitle>
            <CardDescription>Change the subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
              onClick={() => setIsUpgradeDialogOpen(true)}
            >
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Message
            </CardTitle>
            <CardDescription>Send a notification to tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
              onClick={() => setIsMessageDialogOpen(true)}
            >
              Send Message
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Tenant Status</Label>
                  <div className="mt-2">{getStatusBadge(tenant.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Subscription Status</Label>
                  <div className="mt-2">
                    {getSubscriptionStatusBadge(tenant.subscription_status) || (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Current Plan</Label>
                  <div className="mt-2 text-lg font-semibold">
                    {tenant.subscription_plan || "No Plan"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Trial Started
                  </Label>
                  <div className="mt-2">{formatDate(tenant.trial_started_at)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Trial Ends
                  </Label>
                  <div className="mt-2">{formatDate(tenant.trial_ends_at)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Subscription Started
                  </Label>
                  <div className="mt-2">{formatDate(tenant.subscription_started_at)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Subscription Ends
                  </Label>
                  <div className="mt-2">{formatDate(tenant.subscription_ends_at)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Tenant ID</Label>
                  <div className="mt-2 font-mono text-sm">{tenant.id}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Schema Name</Label>
                  <div className="mt-2 font-mono text-sm">{tenant.schema_name || "N/A"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Owner Email
                  </Label>
                  <div className="mt-2">{tenant.owner_email || "N/A"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created At
                  </Label>
                  <div className="mt-2">{formatDate(tenant.created_at)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Updated At
                  </Label>
                  <div className="mt-2">{formatDate(tenant.updated_at)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Extend Subscription Dialog */}
      <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscription Period</DialogTitle>
            <DialogDescription>
              Add additional days to the subscription period for {tenant.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="days">Number of Days</Label>
              <Input
                id="days"
                type="number"
                min="1"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Current end date: {formatDate(tenant.subscription_ends_at || tenant.trial_ends_at)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtendSubscription}>
              Extend Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Plan Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Subscription Plan</DialogTitle>
            <DialogDescription>
              Change the subscription plan for {tenant.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="plan">Select Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Current plan: {tenant.subscription_plan || "No Plan"}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgradePlan}>
              Upgrade Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Message to Tenant</DialogTitle>
            <DialogDescription>
              Send a notification message and email to {tenant.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="messageType">Notification Type</Label>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="emailType">Email Type</Label>
                <Select value={emailType} onValueChange={setEmailType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notification">📬 Notification</SelectItem>
                    <SelectItem value="announcement">📢 Announcement</SelectItem>
                    <SelectItem value="system">🔔 System</SelectItem>
                    <SelectItem value="none">None (Notification Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="messageTitle">Title</Label>
              <Input
                id="messageTitle"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Message title"
              />
            </div>
            <div>
              <Label htmlFor="messageContent">Message</Label>
              <div className="mt-2 border rounded-md relative">
                {!messageContent && (
                  <div className="absolute top-3 left-3 text-muted-foreground pointer-events-none z-10">
                    Enter your message... (supports basic HTML formatting)
                  </div>
                )}
                <div
                  ref={messageEditorRef}
                  contentEditable
                  id="messageContent"
                  className="min-h-[200px] p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 prose prose-sm max-w-none relative z-20"
                  onInput={(e) => {
                    const target = e.currentTarget;
                    setMessageContent(target.innerHTML);
                  }}
                  suppressContentEditableWarning
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                />
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    messageEditorRef.current?.focus();
                    document.execCommand('bold', false);
                  }}
                >
                  <strong>B</strong>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    messageEditorRef.current?.focus();
                    document.execCommand('italic', false);
                  }}
                >
                  <em>I</em>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    messageEditorRef.current?.focus();
                    document.execCommand('underline', false);
                  }}
                >
                  <u>U</u>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    messageEditorRef.current?.focus();
                    document.execCommand('formatBlock', false, 'h3');
                  }}
                >
                  H3
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    messageEditorRef.current?.focus();
                    document.execCommand('insertUnorderedList', false);
                  }}
                >
                  • List
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    messageEditorRef.current?.focus();
                    document.execCommand('insertOrderedList', false);
                  }}
                >
                  1. List
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use the toolbar above to format your message. HTML formatting is supported.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "suspend" ? "Suspend Tenant" : "Activate Tenant"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionType === "suspend" ? "suspend" : "activate"} the tenant{" "}
              <strong>{tenant.name}</strong>? This action will{" "}
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
                if (actionType === "suspend") {
                  handleSuspend()
                } else {
                  handleActivate()
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

