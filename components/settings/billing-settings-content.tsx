"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { tenantsApi, type TenantSettings } from "@/lib/api/tenants"
import { paymentApi, type PaymentHistoryItem } from "@/lib/api/payment"
import { pricingApi, type PricingPlan } from "@/lib/api/pricing"
import { Loader2, CreditCard, Calendar, Check, AlertCircle, Sparkles, ChevronRight, Receipt, Info } from "lucide-react"
import { RouteProtection } from "@/components/auth/route-protection"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function BillingSettingsContent() {
  const { user } = useAuth()
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([])
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)

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
        console.error("Failed to fetch tenant settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchPaymentHistory = async () => {
      if (!user?.tenantId) return
      setIsLoadingHistory(true)
      try {
        const history = await paymentApi.getPaymentHistory(user.tenantId, 10, 0)
        setPaymentHistory(history)
      } catch (error) {
        console.error("Failed to fetch payment history:", error)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    const fetchPricingPlans = async () => {
      try {
        setIsLoadingPlans(true)
        const allPlans = await pricingApi.getActivePlans()
        // Filter out trial plans and only show paid plans
        const paidPlans = allPlans.filter(plan => !plan.isTrial && plan.billingCycle === 'yearly')
        setPlans(paidPlans)
      } catch (error) {
        console.error("Failed to fetch pricing plans:", error)
        toast.error("Failed to load pricing plans")
      } finally {
        setIsLoadingPlans(false)
      }
    }

    fetchTenantSettings()
    fetchPaymentHistory()
    fetchPricingPlans()
  }, [user?.tenantId])

  const calculateDaysRemaining = (): number | null => {
    if (!tenantSettings?.trialEndsAt) return null
    const endDate = new Date(tenantSettings.trialEndsAt)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const daysRemaining = calculateDaysRemaining()
  const subscriptionStatus = tenantSettings?.subscriptionStatus || 'TRIALING'
  const isTrial = subscriptionStatus === 'TRIALING'
  const isActive = subscriptionStatus === 'ACTIVE'
  // For trial accounts, don't set a current plan - they haven't paid for any plan yet
  // Only set currentPlan if user has an active paid subscription
  const currentPlan: string | null = isTrial ? null : (tenantSettings?.subscriptionPlan || null)

  // Calculate prorated amount for upgrade
  const calculateUpgradeAmount = (newPlanCode: string): { amount: number; originalAmount: number; isProrated: boolean } => {
    if (!tenantSettings || !isActive || !currentPlan) {
      const selectedPlan = plans.find(p => p.planCode === newPlanCode)
      return {
        amount: selectedPlan?.price || 0,
        originalAmount: selectedPlan?.price || 0,
        isProrated: false,
      }
    }

    const selectedPlan = plans.find(p => p.planCode === newPlanCode)
    const currentPlanData = plans.find(p => p.planCode === currentPlan.toUpperCase())
    
    if (!selectedPlan || !currentPlanData) {
      return {
        amount: selectedPlan?.price || 0,
        originalAmount: selectedPlan?.price || 0,
        isProrated: false,
      }
    }

    // If same plan, return full price
    if (currentPlan.toUpperCase() === newPlanCode) {
      return {
        amount: selectedPlan.price,
        originalAmount: selectedPlan.price,
        isProrated: false,
      }
    }

    // Calculate prorated amount
    if (tenantSettings.subscriptionEndsAt) {
      const now = new Date()
      const endDate = new Date(tenantSettings.subscriptionEndsAt)
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysRemaining > 0) {
        const dailyRate = currentPlanData.price / 365
        const proratedValue = dailyRate * daysRemaining
        const finalAmount = Math.max(0, selectedPlan.price - proratedValue)
        
        return {
          amount: Math.round(finalAmount),
          originalAmount: selectedPlan.price,
          isProrated: true,
        }
      }
    }

    return {
      amount: selectedPlan.price,
      originalAmount: selectedPlan.price,
      isProrated: false,
    }
  }

  const handleUpgrade = async (planCode: string) => {
    if (!user?.tenantId || !user?.email || !tenantSettings) {
      toast.error("Unable to process upgrade. Please try again.")
      return
    }

    setIsUpgrading(true)
    try {
      const plan = planCode.toUpperCase() as 'STARTER' | 'BUSINESS'
      const selectedPlan = plans.find(p => p.planCode === planCode)
      
      if (!selectedPlan) {
        toast.error("Invalid plan selected")
        return
      }

        // Calculate prorated amount
        const { amount, originalAmount, isProrated } = calculateUpgradeAmount(planCode)

      // Initialize payment with Paystack
      const response = await paymentApi.initializePayment({
        tenantId: user.tenantId,
        customerEmail: user.email,
        customerName: user.fullName || undefined,
        plan: plan,
        billingCycle: 'yearly', // Annual only
        amount: originalAmount, // Send original amount, backend will calculate prorated
        currency: 'NGN',
        callbackUrl: `${window.location.origin}/payment/callback?upgrade=true`,
        currentPlan: isActive && currentPlan ? currentPlan : undefined,
        subscriptionEndsAt: isActive && tenantSettings.subscriptionEndsAt ? tenantSettings.subscriptionEndsAt : undefined,
      })

      // Store upgrade info in sessionStorage
      sessionStorage.setItem('payment_reference', response.reference)
      sessionStorage.setItem('payment_tenant_id', user.tenantId)
      sessionStorage.setItem('payment_plan', plan)
      sessionStorage.setItem('payment_billing_cycle', 'yearly')
      sessionStorage.setItem('upgrade_flow', 'true')

      // Redirect to payment page
      window.location.href = response.authorizationUrl
    } catch (error: any) {
      console.error("Failed to initialize upgrade payment:", error)
      toast.error(error.message || "Failed to initialize payment. Please try again.")
      setIsUpgrading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <RouteProtection resource="profile" requiredPermission="view">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription, view billing history, and update payment methods
          </p>
        </div>

        {/* Current Subscription Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your current subscription details</CardDescription>
              </div>
              <Badge
                variant={isTrial ? "secondary" : isActive ? "default" : "destructive"}
                className="text-sm"
              >
                {subscriptionStatus === 'TRIALING' && 'Trial'}
                {subscriptionStatus === 'ACTIVE' && 'Active'}
                {subscriptionStatus === 'PAST_DUE' && 'Past Due'}
                {subscriptionStatus === 'CANCELED' && 'Canceled'}
                {subscriptionStatus === 'EXPIRED' && 'Expired'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Plan</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {currentPlan ? currentPlan.toLowerCase().replace('_', ' ') : 'Trial (No Plan Selected)'}
                  </p>
                </div>
              </div>
              {isTrial && tenantSettings?.trialEndsAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Trial Ends</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tenantSettings.trialEndsAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {daysRemaining !== null && (
                        <span className="ml-2">
                          ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              {isActive && tenantSettings?.subscriptionEndsAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Renews On</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tenantSettings.subscriptionEndsAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isTrial && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  {daysRemaining !== null && daysRemaining > 0 ? (
                    <>
                      Your trial ends in <strong>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</strong>.
                      Upgrade now to continue using all features without interruption.
                    </>
                  ) : (
                    <>
                      Your trial has ended. Upgrade now to continue using all features and keep your data safe.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-4xl">
            {isLoadingPlans ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : plans.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No pricing plans available. Please contact support.
              </div>
            ) : (
            plans.map((plan) => {
              // For trial accounts, no plan is "current" - they can choose any plan
              const isCurrentPlan = currentPlan ? currentPlan.toUpperCase() === plan.planCode : false
              // Determine if this is an upgrade or downgrade
              // Sort plans by price to determine hierarchy
              const sortedPlans = [...plans].sort((a, b) => a.price - b.price)
              const currentPlanIndex = currentPlan ? sortedPlans.findIndex(p => p.planCode === currentPlan.toUpperCase()) : -1
              const planIndex = sortedPlans.findIndex(p => p.planCode === plan.planCode)
              // Trial users can choose any plan, active users can only upgrade
              const isUpgrade = !isCurrentPlan && (isTrial || (currentPlanIndex >= 0 && planIndex > currentPlanIndex))
              const isDowngrade = !isCurrentPlan && !isTrial && currentPlanIndex >= 0 && planIndex < currentPlanIndex
              const isDisabled = isCurrentPlan || isDowngrade

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden h-full transition-all duration-300 ${
                    isDisabled
                      ? "opacity-60 cursor-not-allowed"
                      : plan.isPopular
                      ? "border-2 border-[#28a2fd] dark:border-[#28a2fd] shadow-xl shadow-[#28a2fd]/20 dark:shadow-[#28a2fd]/20 hover:shadow-2xl hover:shadow-[#28a2fd]/30 scale-105"
                      : "border-border/40 shadow-md hover:shadow-lg hover:border-[#28a2fd]/30"
                  } bg-gradient-to-b from-background to-muted/10 backdrop-blur`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-[#093c93] to-[#28a2fd] dark:from-[#093c93] dark:to-[#28a2fd] text-white px-4 py-1.5 text-xs font-semibold rounded-bl-lg shadow-lg">
                      Most Popular
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="mb-6">
                      <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-muted-foreground mb-6">{plan.description}</p>
                      <div className="pb-4 border-b border-border/40">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold bg-gradient-to-r from-[#093c93] to-[#28a2fd] dark:from-[#28a2fd] dark:to-[#4ab8fd] bg-clip-text text-transparent">
                            ₦{plan.price.toLocaleString('en-NG')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {plan.billingCycle === 'yearly' ? 'per year' : 'per month'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Billed annually • Save with yearly plan
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-3 my-6 flex-grow">
                      {plan.features.map((feature) => (
                        <li key={feature.id} className="flex items-start gap-3">
                          <Check className="mt-0.5 size-5 text-[#28a2fd] dark:text-[#28a2fd] flex-shrink-0" />
                          <span className="text-sm leading-relaxed">{feature.featureText}</span>
                        </li>
                      ))}
                    </ul>
                    {(() => {
                      const { amount, originalAmount, isProrated } = calculateUpgradeAmount(plan.planCode)
                      const showProratedPrice = isProrated && isActive && !isCurrentPlan
                      
                      return (
                        <>
                          {showProratedPrice && (
                            <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Original Price:</span>
                                <span className="line-through text-muted-foreground">
                                  ₦{originalAmount.toLocaleString('en-NG')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-muted-foreground">Prorated Credit:</span>
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  -₦{(originalAmount - amount).toLocaleString('en-NG')}
                                </span>
                              </div>
                              <Separator className="my-2" />
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">Amount to Pay:</span>
                                <span className="text-lg font-bold text-[#28a2fd]">
                                  ₦{amount.toLocaleString('en-NG')}
                                </span>
                              </div>
                            </div>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-full">
                                  <Button
                                    className={`w-full rounded-full transition-all duration-300 mt-auto ${
                                      plan.isPopular
                                        ? "bg-gradient-to-r from-[#093c93] to-[#28a2fd] dark:from-[#093c93] dark:to-[#28a2fd] hover:opacity-90 hover:scale-105 text-white border-0 shadow-lg"
                                        : "hover:bg-[#28a2fd]/5 hover:border-[#28a2fd]/30"
                                    }`}
                                    variant={plan.isPopular ? "default" : "outline"}
                                    size="lg"
                                    disabled={isDisabled || isUpgrading}
                                    onClick={() => handleUpgrade(plan.planCode)}
                                  >
                                    {isCurrentPlan 
                                      ? "Current Plan" 
                                      : isDowngrade 
                                        ? "Downgrade Not Available" 
                                        : isUpgrade 
                                          ? "Upgrade Plan" 
                                          : "Select Plan"}
                                    {!isCurrentPlan && !isDowngrade && <ChevronRight className="ml-2 size-4" />}
                                    {isDowngrade && <Info className="ml-2 size-4" />}
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              {isDowngrade && (
                                <TooltipContent>
                                  <p>Downgrading is not available. Please contact support if you need to change your plan.</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )
                    })()}
                  </CardContent>
                </Card>
              )
            })
            )}
          </div>
        </div>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Your payment methods are securely managed by Paystack</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                {isActive ? (
                  <>
                    Payment methods are securely stored and managed by Paystack during checkout. 
                    Your payment information is encrypted and never stored on our servers.
                  </>
                ) : (
                  <>
                    Payment methods will be securely handled by Paystack when you upgrade to a paid plan. 
                    Your payment information is encrypted and never stored on our servers.
                  </>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View your past payments and transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : paymentHistory.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No payment history found. Payments will appear here after you complete a transaction.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-muted p-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {payment.plan} Plan - {payment.billingCycle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.reference} • {new Date(payment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ₦{payment.amount.toLocaleString('en-NG')}
                      </p>
                      <Badge
                        variant={
                          payment.status === 'success'
                            ? 'default'
                            : payment.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-xs mt-1"
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RouteProtection>
  )
}

