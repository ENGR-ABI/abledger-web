"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { tenantsApi, type TenantSettings } from "@/lib/api/tenants"
import { TrialNotification } from "./trial-notification"

export function TrialNotificationWrapper() {
  const { user } = useAuth()
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.tenantId) {
      setIsLoading(false)
      return
    }

    const fetchTenantSettings = async () => {
      try {
        const settings = await tenantsApi.getTenantSettings(user.tenantId!)
        setTenantSettings(settings)
      } catch (error) {
        console.error("Failed to fetch tenant settings for trial notification:", error)
        // Don't show notification if we can't fetch settings
      } finally {
        setIsLoading(false)
      }
    }

    fetchTenantSettings()
  }, [user?.tenantId])

  if (isLoading || !tenantSettings) {
    return null
  }

  // Calculate days remaining if trialEndsAt is available
  const calculateDaysRemaining = (): number | null => {
    if (!tenantSettings.trialEndsAt) return null
    
    // Skip if trialEndsAt is not a valid date (e.g., "TRIALING" string)
    if (typeof tenantSettings.trialEndsAt === 'string' && 
        (tenantSettings.trialEndsAt === 'TRIALING' || 
         tenantSettings.trialEndsAt === 'ACTIVE' || 
         tenantSettings.trialEndsAt === 'PAST_DUE' || 
         tenantSettings.trialEndsAt === 'CANCELED' || 
         tenantSettings.trialEndsAt === 'EXPIRED')) {
      return null
    }
    
    const endDate = new Date(tenantSettings.trialEndsAt)
    
    // Check if date is valid
    if (isNaN(endDate.getTime())) {
      return null
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const daysRemaining = calculateDaysRemaining()

  return (
    <TrialNotification
      trialEndDate={tenantSettings.trialEndsAt || null}
      subscriptionStatus={tenantSettings.subscriptionStatus || 'TRIALING'}
      daysRemaining={daysRemaining || undefined}
    />
  )
}

