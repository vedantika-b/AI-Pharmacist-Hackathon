"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Loader2, Info } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    try {
      await resetPassword(email)
      setSuccess('If that email exists, a password reset link was sent. Check your inbox.')
    } catch (err: any) {
      console.error('Reset password error:', err)
      
      // Handle rate limit error specifically
      if (err.message?.toLowerCase().includes('rate limit') || 
          err.message?.toLowerCase().includes('email rate')) {
        setError('Too many reset requests. Please try again in a few minutes, or contact support for immediate help.')
      } else if (err.message?.toLowerCase().includes('email')) {
        setError('Unable to send reset email. Please verify your email address and try again.')
      } else {
        setError('Unable to send reset email. Please try again later or contact support.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
            <CardDescription>
              Enter your account email and we'll send password reset instructions. 
              <br />
              <span className="text-xs mt-1 inline-block">
                Already logged in? Change password from{' '}
                <Link href="/dashboard/settings" className="text-primary hover:underline font-medium">
                  Settings → Security
                </Link>
              </span>
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Info box about rate limits */}
              {!error && !success && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-medium">Alternative: Change password from Settings</p>
                    <p className="text-blue-800 dark:text-blue-400">
                      If you can still log in, change your password from Dashboard → Settings → Security
                    </p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="flex flex-col gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300 border border-red-200 dark:border-red-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                  {error.toLowerCase().includes('rate limit') && (
                    <div className="ml-6 text-xs space-y-2 text-red-800 dark:text-red-400">
                      <p>Alternative options:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Wait 5-10 minutes and try again</li>
                        <li>If you remember your password, <Link href="/auth/login" className="underline font-medium">try logging in</Link></li>
                        <li>Once logged in, change password from Settings → Security</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {success && (
                <div className="flex flex-col gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-300 border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <p className="text-sm font-medium">{success}</p>
                  </div>
                  <p className="text-xs text-green-800 dark:text-green-400 ml-6">
                    Click the link in the email to set your new password. The link expires in 1 hour.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
                <p className="text-xs text-muted-foreground">
                  We'll send a password reset link to this email address
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Remembered your password?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
