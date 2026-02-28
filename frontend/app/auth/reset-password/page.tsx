"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) return
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError("Invalid or expired reset link. Please request a new one.")
      }
    }
    
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Validate passwords
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      if (!supabase) {
        throw new Error("Authentication not available")
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw updateError
      }

      setSuccess("Password updated successfully! Redirecting to login...")
      
      // Sign out and redirect to login after 2 seconds
      setTimeout(async () => {
        if (supabase) {
          await supabase.auth.signOut()
        }
        router.push('/auth/login')
      }, 2000)

    } catch (err: any) {
      console.error("Password reset error:", err)
      setError(err.message || 'Failed to reset password')
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
            <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
            <CardDescription>
              Enter your new password below.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300 border border-red-200 dark:border-red-900">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-300 border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">{success}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Password must:</p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li className={newPassword.length >= 6 ? "text-green-600 dark:text-green-400" : ""}>
                    Be at least 6 characters long
                  </li>
                  <li className={newPassword === confirmPassword && newPassword.length > 0 ? "text-green-600 dark:text-green-400" : ""}>
                    Match in both fields
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? 'Updating password...' : 'Update password'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Back to login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
