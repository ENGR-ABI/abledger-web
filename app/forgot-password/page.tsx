"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Mail, Loader2 } from "lucide-react"
import { authApi } from "@/lib/api/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await authApi.forgotPassword(email)
      setIsSuccess(true)
      toast.success('Password reset code sent to your email')
    } catch (error: any) {
      console.error('Failed to send reset code:', error)
      let errorMessage = 'Failed to send password reset code. Please try again.';
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-[#093c93]/5 dark:to-[#093c93]/10 p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_50%,rgba(40,162,253,0.03),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_50%,rgba(40,162,253,0.05),transparent_50%)]" />
      
      <div className="w-full max-w-md relative z-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#28a2fd] mb-8 transition-colors group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Back to login
        </Link>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Image src="/abledger-logo.png" alt="abLedger" width={48} height={48} className="size-12" />
            </div>
            <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
            <CardDescription>
              {isSuccess 
                ? "Check your email for a password reset code"
                : "Enter your email address and we'll send you a code to reset your password"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    We've sent a 6-digit code to <strong>{email}</strong>. Please check your inbox and use the code to reset your password.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
                    className="w-full bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
                  >
                    Enter Reset Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsSuccess(false)}
                    className="w-full"
                  >
                    Use Different Email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoFocus
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Code
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

