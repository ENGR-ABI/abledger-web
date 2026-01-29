"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Loader2, CreditCard, Sparkles, Shield } from "lucide-react"
import { paymentApi } from "@/lib/api/payment"
import { pricingApi, type PricingPlan } from "@/lib/api/pricing"
import { toast } from "sonner"

interface PaymentStepProps {
  tenantId: string
  customerEmail: string
  customerName: string
  onPaymentInitiated: (paymentData: { reference: string; authorizationUrl: string }) => void
  onSkip: () => void
}

export function PaymentStep({ tenantId, customerEmail, customerName, onPaymentInitiated, onSkip }: PaymentStepProps) {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoadingPlans(true)
        const allPlans = await pricingApi.getActivePlans()
        // Filter out trial plans and only show paid plans
        const paidPlans = allPlans.filter(plan => !plan.isTrial && plan.billingCycle === 'yearly')
        setPlans(paidPlans)
        // Set first plan as default selection
        if (paidPlans.length > 0 && !selectedPlan) {
          setSelectedPlan(paidPlans[0].planCode)
        }
      } catch (error) {
        console.error("Failed to fetch pricing plans:", error)
        toast.error("Failed to load pricing plans. Please refresh the page.")
      } finally {
        setIsLoadingPlans(false)
      }
    }
    fetchPlans()
  }, [])

  const selectedPlanData = plans.find(p => p.planCode === selectedPlan) || plans[0]

  // Only annual billing
  const billingCycle = 'yearly' as const

  // Calculate price (annual only)
  const calculatePrice = () => {
    return selectedPlanData.price
  }

  const handleProceedToPayment = async () => {
    if (!selectedPlan || !selectedPlanData) {
      toast.error("Please select a plan")
      return
    }

    setIsProcessing(true)
    try {
      const amount = calculatePrice()

      const response = await paymentApi.initializePayment({
        tenantId,
        customerEmail,
        customerName,
        plan: selectedPlan as 'STARTER' | 'BUSINESS',
        billingCycle: 'yearly', // Annual only
        amount,
        currency: 'NGN',
        callbackUrl: `${window.location.origin}/payment/callback`,
      })

      // Store payment reference in sessionStorage for callback page
      sessionStorage.setItem('payment_reference', response.reference)
      sessionStorage.setItem('payment_tenant_id', tenantId)
      sessionStorage.setItem('payment_plan', selectedPlan)
      sessionStorage.setItem('payment_billing_cycle', 'yearly')

      // Redirect to payment page
      window.location.href = response.authorizationUrl
    } catch (error: any) {
      console.error('Payment initialization failed:', error)
      toast.error(error.message || 'Failed to initialize payment. Please try again.')
      setIsProcessing(false)
    }
  }

  if (isLoadingPlans) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          <p className="text-muted-foreground">
            Loading available plans...
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          <p className="text-muted-foreground">
            No plans available. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pt-2">
      {/* Plan Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.planCode
          const price = plan.price // Annual only

          return (
            <div key={plan.id} className="relative group">
              {/* Selection Indicator Background */}
              <div
                className={`absolute inset-0 rounded-xl transition-all duration-300 ${isSelected
                  ? "bg-gradient-to-b from-[#28a2fd]/20 to-transparent blur-sm -inset-0.5"
                  : "opacity-0 group-hover:opacity-100 bg-[#28a2fd]/5 blur-sm"
                  }`}
              />

              <Card
                className={`relative h-full cursor-pointer transition-all duration-300 border-2 overflow-visible ${isSelected
                  ? "border-[#28a2fd] bg-card shadow-xl scale-[1.02] z-10"
                  : "border-border/50 hover:border-[#28a2fd]/30 hover:shadow-lg bg-card/50"
                  }`}
                onClick={() => setSelectedPlan(plan.planCode)}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                    <span className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="size-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className={`text-xl font-bold mb-2 ${isSelected ? "text-[#28a2fd]" : "text-foreground"}`}>
                        {plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed min-h-[40px]">
                        {plan.description || "Perfect for growing businesses"}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="rounded-full bg-[#28a2fd] p-1.5 shadow-sm ring-2 ring-[#28a2fd]/20">
                        <Check className="size-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="mb-6 pb-6 border-b border-border/50">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold tracking-tight">
                        ₦{price.toLocaleString('en-NG')}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        /year
                      </span>
                    </div>
                    {/* Savings pill if applicable could go here */}
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature.id} className="flex items-start gap-3 text-sm group/item">
                        <div className={`mt-0.5 rounded-full p-0.5 ${isSelected ? "bg-[#28a2fd]/10 text-[#28a2fd]" : "bg-muted text-muted-foreground group-hover/item:text-[#28a2fd]"}`}>
                          <Check className="size-3" />
                        </div>
                        <span className="text-foreground/90">{feature.featureText}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${isSelected
                      ? "bg-[#28a2fd]/10 text-[#28a2fd]"
                      : "bg-muted/50 text-muted-foreground group-hover:text-foreground"
                      }`}
                  >
                    {isSelected ? "Selected" : "Select Plan"}
                  </button>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button
          variant="outline"
          onClick={onSkip}
          className="flex-1 h-12 text-base border-border/60 hover:bg-muted/50"
          disabled={isProcessing}
        >
          Start Free Trial Instead
        </Button>
        <Button
          onClick={handleProceedToPayment}
          disabled={isProcessing}
          className="flex-1 h-12 text-base bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:shadow-lg hover:shadow-[#28a2fd]/20 hover:-translate-y-0.5 transition-all duration-300"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 size-5" />
              Proceed to Payment
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5 opacity-80">
        <Shield className="size-3" />
        Secure payment powered by Paystack. Encrypted & Cancel anytime.
      </p>
    </div>
  )
}

