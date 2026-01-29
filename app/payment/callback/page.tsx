"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { paymentApi } from "@/lib/api/payment"
import { authApi } from "@/lib/api/auth"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import Image from "next/image"

function PaymentCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'processing'>('verifying')
  const [error, setError] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<any>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get reference from URL or sessionStorage
        const reference = searchParams.get('reference') || sessionStorage.getItem('payment_reference')
        const tenantId = sessionStorage.getItem('payment_tenant_id')
        const plan = sessionStorage.getItem('payment_plan')
        const billingCycle = sessionStorage.getItem('payment_billing_cycle')

        if (!reference) {
          setStatus('failed')
          setError('Payment reference not found. Please contact support if you completed payment.')
          return
        }

        // Verify payment with backend
        setStatus('verifying')
        const verification = await paymentApi.verifyPayment(reference)

        if (verification.success) {
          setPaymentData(verification.payment)
          setStatus('success')

          // Clear session storage
          sessionStorage.removeItem('payment_reference')
          sessionStorage.removeItem('payment_tenant_id')
          sessionStorage.removeItem('payment_plan')
          sessionStorage.removeItem('payment_billing_cycle')

          // Check if this is an upgrade flow or registration flow
          const isUpgradeFlow = searchParams.get('upgrade') === 'true' || sessionStorage.getItem('upgrade_flow') === 'true'

          if (isUpgradeFlow) {
            // Upgrade flow - just redirect to billing settings
            sessionStorage.removeItem('payment_tenant_id')
            sessionStorage.removeItem('payment_plan')
            sessionStorage.removeItem('payment_billing_cycle')
            sessionStorage.removeItem('upgrade_flow')

            toast.success('Payment successful! Your subscription has been updated.')

            // Redirect to billing settings page
            router.replace('/app/settings/billing')
            return
          }

          // Registration flow - log the user in automatically
          if (verification.auth?.accessToken) {
            setStatus('processing')

            // Token returned directly from payment verification
            const { accessToken, refreshToken, user } = verification.auth;

            // Store token using apiClient to ensure consistency with other auth flows
            // IMPORTANT: apiClient uses specific keys ('abledger_auth_token')
            const apiClientModule = await import('@/lib/api/client');
            const client = apiClientModule.default;

            client.setToken(accessToken);
            if (refreshToken) {
              client.setRefreshToken(refreshToken);
            }

            // Update auth context
            await refreshUser();

            // Clear registration data
            sessionStorage.removeItem('registration_data')
            sessionStorage.removeItem('verification_token')
            sessionStorage.removeItem('payment_tenant_id')

            // UX Improvement: Show success state briefly before redirecting
            // This ensures user sees the success message and feels confident
            setStatus('success');

            // Wait a moment before redirecting
            setTimeout(() => {
              toast.success('Redirecting to dashboard...')
              router.replace('/app/dashboard')
            }, 1500);

            return
          }

          if (tenantId) {
            setStatus('processing')

            // Get registration data from sessionStorage
            const registrationData = sessionStorage.getItem('registration_data')

            if (registrationData) {
              try {
                const data = JSON.parse(registrationData)

                // Log in with the credentials (tenant already created during payment step)
                const loginResponse = await authApi.login({
                  email: data.email,
                  password: data.password,
                  tenantId: tenantId,
                })

                if (loginResponse.accessToken) {
                  // Token is already stored by authApi.login()
                  // Update auth context to refresh user state
                  await refreshUser()

                  // Clear registration data
                  sessionStorage.removeItem('registration_data')
                  sessionStorage.removeItem('verification_token')
                  sessionStorage.removeItem('payment_tenant_id')

                  toast.success('Payment successful! Redirecting to your dashboard...')

                  // Redirect to dashboard immediately (better UX - user just paid)
                  // Use replace to prevent back button from going to callback page
                  router.replace('/app/dashboard')
                  return
                }
              } catch (loginError: any) {
                console.error('Auto-login failed:', loginError)
                // Payment was successful, but auto-login failed
                // This shouldn't happen normally, but if it does, redirect to login
                toast.warning('Payment successful! Please log in with your credentials.')
                setTimeout(() => {
                  router.push('/login')
                }, 2000)
                return
              }
            } else {
              // Payment successful but no registration data - redirect to login
              toast.success('Payment successful! Please log in to continue.')
              setTimeout(() => {
                router.push('/login')
              }, 2000)
              return
            }
          } else {
            // Payment successful but no tenant info - redirect to login
            toast.success('Payment successful! Please log in to continue.')
            setTimeout(() => {
              router.push('/login')
            }, 2000)
          }
        } else {
          setStatus('failed')
          setError('Payment verification failed. Please contact support if you completed payment.')
        }
      } catch (error: any) {
        console.error('Payment verification error:', error)
        setStatus('failed')
        setError(error.message || 'Failed to verify payment. Please contact support.')
      }
    }

    verifyPayment()
  }, [searchParams, router, refreshUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-[#093c93]/5 dark:to-[#093c93]/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-[#093c93]/10 to-[#28a2fd]/10 p-3">
              <Image src="/abledger-logo.png" alt="abLedger" width={48} height={48} className="size-12" />
            </div>
          </div>
          <CardTitle className="text-2xl">Payment Verification</CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Verifying your payment...'}
            {status === 'processing' && 'Completing your registration...'}
            {status === 'success' && 'Payment successful!'}
            {status === 'failed' && 'Payment verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'verifying' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="size-12 animate-spin text-[#28a2fd]" />
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we verify your payment...
              </p>
            </div>
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="size-12 animate-spin text-[#28a2fd]" />
              <p className="text-sm text-muted-foreground text-center">
                Completing your registration...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle2 className="size-12 text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Payment Successful!</h3>
                {paymentData && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Amount: ₦{paymentData.amount.toLocaleString('en-NG')}</p>
                    <p>Reference: {paymentData.reference}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  Redirecting you to your dashboard...
                </p>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className="rounded-full bg-red-500/10 p-4">
                <XCircle className="size-12 text-red-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Payment Verification Failed</h3>
                {error && (
                  <p className="text-sm text-muted-foreground">{error}</p>
                )}
                <div className="pt-4 space-y-2">
                  <Button
                    onClick={() => router.push('/get-started')}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="w-full"
                  >
                    Go to Home
                  </Button>
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <AlertCircle className="size-4" />
                <p>
                  If you're not redirected automatically, you can log in to access your account.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-[#093c93]/5 dark:to-[#093c93]/10 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="size-12 animate-spin text-[#28a2fd]" />
            <p className="text-sm text-muted-foreground mt-4">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  )
}

