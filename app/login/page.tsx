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
import { ArrowLeft, Eye, EyeOff, Loader2, Package, UserCircle, FileText, BarChart, Mail } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { authApi } from "@/lib/api/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { VerificationCodeInput } from "@/components/auth/verification-code-input"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showOtpStep, setShowOtpStep] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  const { isLoading: authLoading, isAuthenticated, refreshUser } = useAuth()
  const router = useRouter()

  // Show loading state while checking authentication
  // This prevents the flash of the login page before redirect
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

  // If authenticated, don't render the login form
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Step 1: Verify credentials and send OTP
      await authApi.initiateLogin({ email, password, rememberMe })
      toast.success('Login code sent to your email')
      setOtpError("")
      setShowOtpStep(true)
    } catch (error: any) {
      console.error('Login failed:', error)
      // Extract error message - handle both string and array formats
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error?.message) {
        if (Array.isArray(error.message)) {
          errorMessage = error.message.join(', ');
        } else if (typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (code: string) => {
    setIsVerifyingOtp(true)
    setOtpError("")
    
    try {
      // Step 2: Verify OTP and complete login
      const response = await authApi.verifyLoginOtp({ 
        email, 
        code,
        rememberMe 
      })
      
      // Refresh user data in auth context
      await refreshUser()
      
      toast.success('Login successful')
      
      // Redirect based on role
      if (response.user.role === 'PLATFORM_ADMIN') {
        router.replace('/admin/tenants')
      } else {
        router.replace('/app/dashboard')
      }
    } catch (error: any) {
      console.error('OTP verification failed:', error)
      let errorMessage = 'Invalid code. Please try again.';
      if (error?.message) {
        if (Array.isArray(error.message)) {
          errorMessage = error.message.join(', ');
        } else if (typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }
      setOtpError(errorMessage)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    setIsLoading(true)
    setOtpError("")
    try {
      await authApi.initiateLogin({ email, password, rememberMe })
      toast.success('New code sent to your email')
    } catch (error: any) {
      console.error('Failed to resend code:', error)
      toast.error('Failed to resend code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToCredentials = () => {
    setShowOtpStep(false)
    setOtpError("")
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
          {/* Left side - Feature highlights */}
          <div className="hidden lg:block space-y-8 lg:sticky lg:top-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                abLedger
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Continue managing your inventory, customers, and sales from your centralized dashboard. Everything you need is just a click away.
              </p>
            </div>

            <div className="space-y-5 pt-4">
              {[
                {
                  icon: Package,
                  title: "Inventory at your fingertips",
                  description: "Monitor stock levels, track products, and manage inventory across all locations in real-time.",
                },
                {
                  icon: UserCircle,
                  title: "Complete customer view",
                  description: "Access customer history, orders, and interactions from your unified CRM dashboard.",
                },
                {
                  icon: FileText,
                  title: "Sales & invoicing made simple",
                  description: "Generate invoices, track payments, and manage your sales pipeline effortlessly.",
                },
                {
                  icon: BarChart,
                  title: "Insights that drive growth",
                  description: "View real-time analytics and comprehensive reports to make informed business decisions.",
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

          {/* Right side - Login form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <Card className="border-border/40 shadow-xl bg-background/95 backdrop-blur-sm">
              <CardHeader className="space-y-3 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-gradient-to-br from-[#093c93]/10 to-[#28a2fd]/10 p-2">
              <Image src="/abledger-logo.png" alt="abLedger" width={48} height={48} className="size-12" />
              </div>
            </div>
                <CardTitle className="text-2xl md:text-3xl font-bold">Welcome back</CardTitle>
                <CardDescription className="text-base">
                  Sign in to your abLedger account to manage your business operations
                </CardDescription>
          </CardHeader>

          <CardContent>
            {!showOtpStep ? (
              <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email address
                    </Label>
                <Input
                  id="email"
                      name="email"
                  type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                      className="h-11"
                      disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      <Link
                        href="/forgot-password" 
                        className="text-xs text-[#28a2fd] hover:underline font-medium transition-colors"
                      >
                    Forgot password?
                  </Link>
                </div>
                    <div className="relative">
                <Input
                  id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                  placeholder="Enter your password"
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
              </div>

              <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      disabled={isLoading}
                    />
                <label
                  htmlFor="remember"
                      className="text-sm font-medium leading-none cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me for 30 days
                </label>
              </div>

                  <Button 
                    type="submit" 
                    className="w-full rounded-full bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90 text-white border-0 h-11 text-base font-medium shadow-lg shadow-[#28a2fd]/20"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
              </Button>
            </form>
            ) : (
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
                  onComplete={handleVerifyOtp}
                  disabled={isVerifyingOtp}
                  error={otpError}
                />

                <div className="flex items-center justify-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-[#28a2fd] hover:underline font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Resend code'}
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </CardContent>

              {!showOtpStep && (
                <CardFooter className="flex flex-col space-y-4 pt-6">
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-3 text-muted-foreground text-xs font-medium">Or continue with</span>
                    </div>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                        <Link href="/get-started" className="text-[#28a2fd] font-semibold hover:underline transition-colors">
                          Create one now
                    </Link>
                  </p>
                </CardFooter>
              )}
        </Card>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By signing in, you agree to our{" "}
          <Link href="/terms" className="text-[#28a2fd] hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#28a2fd] hover:underline">
            Privacy Policy
          </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}