"use client"

import { useEffect, useState } from "react"
import { Building2, Users, TrendingUp, AlertTriangle, Loader2, RefreshCw, DollarSign, PieChart, BarChart3, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { adminApi } from "@/lib/api/admin"
import type { PlatformMetrics } from "@/lib/api/types"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboardContent() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getPlatformMetrics()
      setMetrics(data)
    } catch (error: any) {
      console.error("Failed to fetch platform metrics:", error)
      toast.error(error.message || "Failed to load platform metrics")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd]" />
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load platform metrics</p>
        <Button onClick={fetchMetrics} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "SUSPENDED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "TRIAL":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of platform-wide metrics and statistics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMetrics}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.activeTenants} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {metrics.activeTenants}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.suspendedTenants} suspended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Tenants</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {metrics.trialTenants}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              On trial period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended Tenants</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {metrics.suspendedTenants}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalTenants > 0 
                ? `${Math.round((metrics.suspendedTenants / metrics.totalTenants) * 100)}% of total`
                : 'No tenants'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Visualizations */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Subscription Plans Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Subscription Plans
            </CardTitle>
            <CardDescription>Distribution of tenants by subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(metrics.tenantsByPlan).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(metrics.tenantsByPlan)
                  .sort(([, a], [, b]) => b - a)
                  .map(([plan, count]) => {
                    const percentage = metrics.totalTenants > 0 
                      ? Math.round((count / metrics.totalTenants) * 100) 
                      : 0
                    return (
                      <div key={plan} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{plan || 'No Plan'}</span>
                          <span className="text-muted-foreground">{count} tenants ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No subscription plan data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tenant Status
            </CardTitle>
            <CardDescription>Distribution of tenants by status</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(metrics.tenantsByStatus).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(metrics.tenantsByStatus)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => {
                    const percentage = metrics.totalTenants > 0 
                      ? Math.round((count / metrics.totalTenants) * 100) 
                      : 0
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{status}</span>
                            <Badge variant="outline" className={getStatusColor(status)}>
                              {status}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              status === "ACTIVE"
                                ? "bg-green-500"
                                : status === "SUSPENDED"
                                ? "bg-red-500"
                                : status === "TRIAL"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No status data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Recent Tenants</CardTitle>
              <CardDescription>Latest tenant registrations</CardDescription>
            </div>
            <Link href="/admin/tenants">
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {metrics.recentTenants && metrics.recentTenants.length > 0 ? (
              <div className="space-y-2">
                {metrics.recentTenants.slice(0, 5).map((tenant) => (
                  <Link
                    key={tenant.id}
                    href={`/admin/tenants/${tenant.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-[#1F1F23] hover:bg-gray-50 dark:hover:bg-[#1F1F23] hover:border-[#28a2fd] transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tenant.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                            {tenant.created_at 
                              ? new Date(tenant.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'N/A'}
                      </p>
                          {tenant.slug && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground truncate">@{tenant.slug}</p>
                            </>
                          )}
                        </div>
                    </div>
                      <Badge 
                        variant="outline" 
                        className={`ml-2 ${getStatusColor(tenant.status)}`}
                    >
                      {tenant.status}
                      </Badge>
                  </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No recent tenants</p>
                <Link href="/admin/tenants">
                  <Button variant="outline" size="sm" className="mt-4">
                    Create First Tenant
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common platform administration tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/tenants">
              <Button variant="outline" className="w-full justify-start group">
                <Building2 className="h-4 w-4 mr-2" />
                Manage Tenants
                <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
            <Link href="/admin/tenants?action=create">
              <Button variant="outline" className="w-full justify-start group">
                <Building2 className="h-4 w-4 mr-2" />
                Create New Tenant
                <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
            <div className="pt-2 border-t border-gray-200 dark:border-[#1F1F23]">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1F1F23]">
                  <div className="text-2xl font-bold">{metrics.activeTenants}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1F1F23]">
                  <div className="text-2xl font-bold">{metrics.trialTenants}</div>
                  <div className="text-xs text-muted-foreground">On Trial</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

