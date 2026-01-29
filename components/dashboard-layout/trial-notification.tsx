"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X, AlertTriangle, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

interface TrialNotificationProps {
  // Trial data - should come from tenant settings
  trialEndDate?: Date | string | null
  isTrial?: boolean
  daysRemaining?: number
  subscriptionStatus?: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'
}

export function TrialNotification({ 
  trialEndDate, 
  isTrial,
  daysRemaining,
  subscriptionStatus = 'TRIALING'
}: TrialNotificationProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const { user } = useAuth()

  // Check localStorage for dismissed state on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('trial_notification_dismissed')
    if (dismissed === 'true') {
      // Check if dismissal has expired (24 hours)
      const dismissedAt = localStorage.getItem('trial_notification_dismissed_at')
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt, 10)
        const now = Date.now()
        const hoursSinceDismissal = (now - dismissedTime) / (1000 * 60 * 60)
        if (hoursSinceDismissal >= 24) {
          // Dismissal expired, show notification again
          localStorage.removeItem('trial_notification_dismissed')
          localStorage.removeItem('trial_notification_dismissed_at')
        } else {
          setIsDismissed(true)
        }
      } else {
        setIsDismissed(true)
      }
    }
  }, [])

  // Calculate days remaining
  const calculateDaysRemaining = (): number | null => {
    if (daysRemaining !== undefined) return daysRemaining
    if (!trialEndDate) return null
    
    const endDate = typeof trialEndDate === 'string' ? new Date(trialEndDate) : trialEndDate
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  }

  const remainingDays = calculateDaysRemaining()

  // Determine if we should show the notification
  // Show if: on trial (TRIALING status) and not dismissed and trial hasn't expired
  const shouldShow = 
    subscriptionStatus === 'TRIALING' && 
    !isDismissed && 
    (remainingDays === null || remainingDays > 0)

  // Don't show if dismissed, not on trial, or trial already ended
  if (!shouldShow) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('trial_notification_dismissed', 'true')
    localStorage.setItem('trial_notification_dismissed_at', Date.now().toString())
  }

  // Determine alert variant based on days remaining
  const getVariant = (): "default" | "destructive" => {
    if (remainingDays === null) return "default"
    if (remainingDays <= 3) return "destructive"
    if (remainingDays <= 7) return "destructive"
    return "default"
  }

  const variant = getVariant()
  const isUrgent = remainingDays !== null && remainingDays <= 7

  return (
    <Alert 
      variant={variant}
      className="mx-3 sm:mx-4 mb-3 border-l-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{
        borderLeftColor: isUrgent ? 'var(--destructive)' : 'var(--primary)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {isUrgent ? (
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          ) : (
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <AlertDescription className="flex items-center gap-2 flex-wrap">
              <span>
                {remainingDays !== null ? (
                  <>
                    {remainingDays === 0 ? (
                      <strong>Your trial has ended.</strong>
                    ) : remainingDays === 1 ? (
                      <strong>Your trial ends tomorrow.</strong>
                    ) : remainingDays <= 7 ? (
                      <strong>Your trial ends in {remainingDays} days.</strong>
                    ) : (
                      <>You're on a <strong>free trial</strong> with <strong>{remainingDays} days</strong> remaining.</>
                    )}
                  </>
                ) : (
                  <>You're currently on a <strong>free trial</strong>.</>
                )}
                {" "}Upgrade now to continue enjoying all features and keep your data safe.
              </span>
              <Button
                size="sm"
                variant={isUrgent ? "default" : "outline"}
                className="ml-auto sm:ml-0 shrink-0"
                asChild
              >
                <Link href="/app/settings/billing">
                  Upgrade Now
                </Link>
              </Button>
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}

