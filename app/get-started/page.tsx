"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Eye, EyeOff, Loader2, Building2, User, Mail, Lock, Shield, Package, UserCircle, FileText, BarChart, Users as UsersIcon, CheckCircle2, ArrowRight } from "lucide-react"
import { authApi } from "@/lib/api/auth"
import { tenantApi } from "@/lib/api/tenant"
import { VerificationCodeInput } from "@/components/auth/verification-code-input"
import { PaymentStep } from "@/components/auth/payment-step"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

type RegistrationStep = 'form' | 'verification' | 'payment' | 'complete';

export default function GetStartedPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [step, setStep] = useState<RegistrationStep>('form');

  // Form data
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Verification
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState("")
  const [isResendingCode, setIsResendingCode] = useState(false)

  // Tenant and payment
  const [tenantId, setTenantId] = useState<string | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCreatingTenant, setIsCreatingTenant] = useState(false)

  // Show loading state while checking authentication
  // This prevents the flash of the registration page before redirect
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-[#093c93]/5 dark:to-[#093c93]/10">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a2fd] mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If authenticated, don't render the registration form
  // The redirect will happen via useEffect in auth context
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-[#093c93]/5 dark:to-[#093c93]/10">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#28a2fd] mx-auto"></div>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  const passwordStrength = () => {
    if (!password) return { strength: 0, label: "", color: "" }
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++

    if (strength <= 1) return { strength, label: "Weak", color: "text-red-500" }
    if (strength === 2) return { strength, label: "Fair", color: "text-yellow-500" }
    if (strength === 3) return { strength, label: "Good", color: "text-blue-500" }
    return { strength, label: "Strong", color: "text-green-500" }
  }

  const passwordInfo = passwordStrength()

  // Helper function to validate and generate slug
  const generateSlug = (companyName: string): string => {
    let slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure slug meets validation requirements
    if (!slug || slug.length < 2) {
      // Fallback: use email prefix or timestamp
      const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
      slug = emailPrefix.length >= 2 ? emailPrefix : `tenant-${Date.now().toString().slice(-8)}`;
    }

    // Ensure slug doesn't exceed max length (100)
    if (slug.length > 100) {
      slug = slug.substring(0, 100).replace(/-+$/, '');
    }

    // Final validation: ensure it matches the pattern
    if (!/^[a-z0-9-]+$/.test(slug)) {
      slug = `tenant-${Date.now().toString().slice(-8)}`;
    }

    return slug;
  }

  // Step 1: Submit form and send verification code
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setVerificationError("")

    // Validate company name (must be at least 2 characters, max 100 for backend validation)
    const trimmedCompanyName = companyName.trim()
    if (!trimmedCompanyName || trimmedCompanyName.length < 2) {
      toast.error('Company name must be at least 2 characters long.')
      setIsLoading(false)
      return
    }

    if (trimmedCompanyName.length > 100) {
      toast.error('Company name must be 100 characters or less.')
      setIsLoading(false)
      return
    }

    // Validate that company name can generate a valid slug
    const testSlug = generateSlug(trimmedCompanyName)
    if (!testSlug || testSlug.length < 2) {
      toast.error('Company name must contain at least 2 alphanumeric characters.')
      setIsLoading(false)
      return
    }

    try {
      await authApi.sendVerificationCode({
        email,
        fullName,
        companyName,
      })

      setStep('verification')
      toast.success('Verification code sent! Please check your email.')
    } catch (error: any) {
      console.error('Failed to send verification code:', error)
      toast.error(error?.message || 'Failed to send verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify email code
  const handleVerifyCode = async (code: string) => {
    setIsVerifying(true)
    setVerificationError("")

    try {
      const response = await authApi.verifyEmail({
        email,
        code,
      })

      if (response.verified && response.token) {
        setVerificationToken(response.token)
        // Store registration data for later use
        sessionStorage.setItem('verification_token', response.token)
        sessionStorage.setItem('registration_data', JSON.stringify({
          email,
          password,
          fullName,
          companyName,
        }))

        // Create tenant first (with trial), then show payment step
        await createTenantForPayment(response.token)
      }
    } catch (error: any) {
      console.error('Verification failed:', error)
      setVerificationError(error?.message || 'Invalid verification code. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Create tenant for payment step
  const createTenantForPayment = async (token: string) => {
    setIsCreatingTenant(true)
    try {
      // Generate slug
      const slug = generateSlug(companyName)

      // Create tenant (this will create tenant with trial status)
      const tenant = await tenantApi.createTenant({
        name: companyName,
        slug,
        ownerEmail: email,
        ownerPassword: password,
        verificationToken: token,
      })

      setTenantId(tenant.id)
      setStep('payment')
    } catch (error: any) {
      console.error('Failed to create tenant:', error)
      toast.error(error?.message || 'Failed to create account. Please try again.')
      // If tenant creation fails, still allow user to complete registration
      // by going directly to complete step
      await handleCompleteRegistration(token)
    } finally {
      setIsCreatingTenant(false)
    }
  }

  // Resend verification code
  const handleResendCode = async () => {
    setIsResendingCode(true)
    setVerificationError("")

    try {
      await authApi.sendVerificationCode({
        email,
        fullName,
        companyName,
      })
      toast.success('Verification code resent! Please check your email.')
    } catch (error: any) {
      console.error('Failed to resend code:', error)
      toast.error(error?.message || 'Failed to resend verification code.')
    } finally {
      setIsResendingCode(false)
    }
  }

  // Step 3: Complete registration (skip payment for now)
  const handleCompleteRegistration = async (token: string) => {
    setIsLoading(true)

    try {
      const response = await authApi.completeRegistration({
        email,
        password,
        fullName,
        companyName,
        verificationToken: token,
      })

      // Store token and redirect
      if (response.accessToken && response.tenantId) {
        // Send welcome email for trial (asynchronously, don't wait)
        tenantApi.sendWelcomeEmail(response.tenantId).catch((error) => {
          console.error('Failed to send welcome email:', error)
        })

        toast.success('Registration successful! Redirecting...')
        router.push('/app/dashboard')
      }
    } catch (error: any) {
      console.error('Registration failed:', error)

      // Extract error message - handle both ApiError format and raw errors
      let errorMessage = 'Registration failed. Please try again.';

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Show detailed error message
      toast.error(errorMessage, {
        duration: 5000, // Show for 5 seconds
      })
      setIsLoading(false)
    }
  }

  // Payment step handlers
  const handlePaymentInitiated = (paymentData: { reference: string; authorizationUrl: string }) => {
    // Payment will redirect to Paystack, then to callback page
    // The callback page will handle completion
  }

  const handlePaymentSkip = async () => {
    if (verificationToken && tenantId) {
      // User skipped payment - tenant already exists, just log in
      setIsLoading(true)

      try {
        // Send welcome email for trial (asynchronously, don't wait)
        tenantApi.sendWelcomeEmail(tenantId).catch((error) => {
          console.error('Failed to send welcome email:', error)
        })

        // Log in with credentials
        const loginResponse = await authApi.login({
          email,
          password,
          tenantId: tenantId,
        })

        if (loginResponse.accessToken) {
          toast.success('Welcome! Starting your free trial...')
          router.push('/app/dashboard')
        }
      } catch (error: any) {
        console.error('Login failed:', error)
        toast.error(error?.message || 'Failed to complete registration. Please try logging in.')
        setIsLoading(false)
      }
    } else if (verificationToken) {
      // Fallback if tenantId not available - create tenant and complete registration
      await handleCompleteRegistration(verificationToken)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-[#093c93]/5 dark:to-[#093c93]/10 p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_50%,rgba(40,162,253,0.03),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_50%,rgba(40,162,253,0.05),transparent_50%)]" />

      <div className="w-full max-w-6xl relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#28a2fd] mb-8 transition-colors group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left side - Benefits */}
          <div className="hidden lg:block space-y-8 lg:sticky lg:top-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                Everything your business needs in one platform
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                abLedger unifies inventory, customers, sales, and analytics into a single, powerful workspace. Manage your entire operation from one dashboard.
              </p>
            </div>

            <div className="space-y-5 pt-4">
              {[
                {
                  icon: Package,
                  title: "Smart Inventory Management",
                  description: "Track stock levels in real-time, manage products across locations, and get automated alerts when items run low.",
                },
                {
                  icon: UserCircle,
                  title: "Unified Customer Hub",
                  description: "Centralize all customer interactions, purchase history, and communication in one comprehensive CRM system.",
                },
                {
                  icon: FileText,
                  title: "Streamlined Sales & Invoicing",
                  description: "Create professional invoices instantly, track payments, and manage your sales pipeline with powerful automation.",
                },
                {
                  icon: BarChart,
                  title: "Real-Time Business Insights",
                  description: "Make data-driven decisions with live dashboards, customizable reports, and comprehensive analytics.",
                },
                {
                  icon: UsersIcon,
                  title: "Secure Team Collaboration",
                  description: "Work together seamlessly with role-based access control, ensuring the right people see the right information.",
                },
                {
                  icon: Shield,
                  title: "Enterprise-Grade Security",
                  description: "Bank-level encryption and strict data isolation protect your business information around the clock.",
                },
              ].map((feature, i) => {
                const Icon = feature.icon
                return (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="rounded-lg bg-gradient-to-br from-[#093c93]/10 to-[#28a2fd]/10 p-2.5 group-hover:scale-110 transition-transform flex-shrink-0">
                      <Icon className="size-5 text-[#28a2fd]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right side - Multi-step Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <Card className="border-border/40 shadow-xl bg-background/95 backdrop-blur-sm">
              <CardHeader className="space-y-3 text-center pb-6">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-gradient-to-br from-[#093c93]/10 to-[#28a2fd]/10 p-2">
                    <Image src="/abledger-logo.png" alt="abLedger" width={48} height={48} className="size-12" />
                  </div>
                </div>

                {/* Step indicator */}
                {/* Step indicator */}
                {/* <div className="flex items-center justify-center gap-2 mb-4">
                <div className={`flex items-center gap-2 ${
                  step === 'form' ? 'text-[#28a2fd]' : 
                  step === 'verification' || step === 'payment' || step === 'complete' ? 'text-green-500' : 
                  'text-muted-foreground'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step === 'form' ? 'border-[#28a2fd] bg-[#28a2fd]/10' : 
                    step === 'verification' || step === 'payment' || step === 'complete' ? 'border-green-500 bg-green-500/10' : 
                    'border-muted-foreground'
                  }`}>
                    {step === 'verification' || step === 'payment' || step === 'complete' ? <CheckCircle2 className="size-4" /> : '1'}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline">Account</span>
                </div>
                <div className={`h-0.5 w-12 ${
                  step === 'verification' || step === 'payment' || step === 'complete' ? 'bg-green-500' : 
                  'bg-muted-foreground'
                }`} />
                <div className={`flex items-center gap-2 ${
                  step === 'verification' ? 'text-[#28a2fd]' : 
                  step === 'payment' || step === 'complete' ? 'text-green-500' : 
                  'text-muted-foreground'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step === 'verification' ? 'border-[#28a2fd] bg-[#28a2fd]/10' : 
                    step === 'payment' || step === 'complete' ? 'border-green-500 bg-green-500/10' : 
                    'border-muted-foreground'
                  }`}>
                    {step === 'payment' || step === 'complete' ? <CheckCircle2 className="size-4" /> : '2'}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline">Verify</span>
                </div>
                <div className={`h-0.5 w-12 ${
                  step === 'payment' || step === 'complete' ? 'bg-green-500' : 
                  'bg-muted-foreground'
                }`} />
                <div className={`flex items-center gap-2 ${
                  step === 'payment' ? 'text-[#28a2fd]' : 
                  step === 'complete' ? 'text-green-500' : 
                  'text-muted-foreground'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step === 'payment' ? 'border-[#28a2fd] bg-[#28a2fd]/10' : 
                    step === 'complete' ? 'border-green-500 bg-green-500/10' : 
                    'border-muted-foreground'
                  }`}>
                    {step === 'complete' ? <CheckCircle2 className="size-4" /> : '3'}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline">Payment</span>
                </div>
              </div> */}

                <CardTitle className="text-2xl md:text-3xl font-bold">
                  {step === 'form' && 'Create your account'}
                  {step === 'verification' && 'Verify your email'}
                  {step === 'payment' && 'Choose your plan'}
                  {step === 'complete' && 'Welcome to abLedger!'}
                </CardTitle>
                <CardDescription className="text-base">
                  {step === 'form' && 'Get started with abLedger in under 2 minutes. No credit card required.'}
                  {step === 'verification' && `We've sent a verification code to ${email}`}
                  {step === 'payment' && 'Choose your plan and pay the subscription fee or start a free trial.'}
                  {step === 'complete' && 'Your account has been created successfully!'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Step 1: Registration Form */}
                {step === 'form' && (
                  <form onSubmit={handleFormSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2">
                        <User className="size-3.5 text-muted-foreground" />
                        Full name
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        placeholder="Yusuf Aadam"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-11"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="size-3.5 text-muted-foreground" />
                        Your email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="abba@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        We'll send you a verification code to confirm your email
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="size-3.5 text-muted-foreground" />
                        Company name
                      </Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        type="text"
                        autoComplete="organization"
                        placeholder="ABiFoody Enterprise."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="h-11"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                        <Lock className="size-3.5 text-muted-foreground" />
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Create a strong password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-11 pr-10"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" aria-hidden="true" />
                          ) : (
                            <Eye className="size-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      {password && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Password strength:</span>
                            <span className={`font-medium ${passwordInfo.color}`}>{passwordInfo.label}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${passwordInfo.strength <= 1 ? 'bg-red-500' :
                                passwordInfo.strength === 2 ? 'bg-yellow-500' :
                                  passwordInfo.strength === 3 ? 'bg-blue-500' : 'bg-green-500'
                                }`}
                              style={{ width: `${(passwordInfo.strength / 4) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Use at least 8 characters with a mix of letters, numbers, and symbols
                      </p>
                    </div>

                    <div className="flex items-start space-x-3 pt-2">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                        required
                        disabled={isLoading}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm leading-relaxed cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the{" "}
                        <Link href="/terms" className="text-[#28a2fd] hover:underline font-medium">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-[#28a2fd] hover:underline font-medium">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full rounded-full bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90 text-white border-0 h-11 text-base font-medium shadow-lg shadow-[#28a2fd]/20 mt-6"
                      disabled={isLoading || !agreedToTerms}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Sending verification code...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="ml-2 size-4" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Step 2: Email Verification */}
                {step === 'verification' && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#093c93]/10 to-[#28a2fd]/10 flex items-center justify-center mb-4">
                        <Mail className="size-8 text-[#28a2fd]" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code we sent to <span className="font-medium text-foreground">{email}</span>
                      </p>
                    </div>

                    <VerificationCodeInput
                      length={6}
                      onComplete={handleVerifyCode}
                      disabled={isVerifying}
                      error={verificationError}
                    />

                    <div className="text-center space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Didn't receive the code?{" "}
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={isResendingCode}
                          className="text-[#28a2fd] hover:underline font-medium disabled:opacity-50"
                        >
                          {isResendingCode ? 'Sending...' : 'Resend code'}
                        </button>
                      </p>

                      <Button
                        variant="ghost"
                        onClick={() => setStep('form')}
                        className="text-sm text-muted-foreground"
                      >
                        <ArrowLeft className="mr-2 size-4" />
                        Change email address
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Payment */}
                {step === 'payment' && tenantId && (
                  <PaymentStep
                    tenantId={tenantId}
                    customerEmail={email}
                    customerName={fullName}
                    onPaymentInitiated={handlePaymentInitiated}
                    onSkip={handlePaymentSkip}
                  />
                )}

                {/* Loading state while creating tenant */}
                {step === 'payment' && !tenantId && isCreatingTenant && (
                  <div className="space-y-6 text-center py-8">
                    <Loader2 className="size-8 animate-spin text-[#28a2fd] mx-auto" />
                    <p className="text-muted-foreground">Setting up your account...</p>
                  </div>
                )}

                {/* Step 4: Complete */}
                {step === 'complete' && (
                  <div className="text-center space-y-6 py-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#093c93]/10 to-[#28a2fd]/10 flex items-center justify-center">
                      <CheckCircle2 className="size-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Account created successfully!</h3>
                      <p className="text-muted-foreground">
                        Redirecting you to your dashboard...
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>

              {step === 'form' && (
                <CardFooter className="flex flex-col space-y-4 pt-6">
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-3 text-muted-foreground text-xs font-medium">Already have an account?</span>
                    </div>
                  </div>

                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="w-full rounded-full h-11 border-[#28a2fd]/20 hover:bg-[#28a2fd]/5 hover:border-[#28a2fd]/30 text-[#28a2fd]"
                    >
                      Sign in instead
                    </Button>
                  </Link>
                </CardFooter>
              )}
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
