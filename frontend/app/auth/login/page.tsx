"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pill, Eye, EyeOff, AlertCircle, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

// Demo credentials for easy login
const DEMO_CREDENTIALS = {
  name: "Vedantika Bhoyar",
  email: "vedantikabhoyar135@gmail.com",
  password: "admin123"
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requires2FA, setRequires2FA] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const router = useRouter()
  const { signIn, user, loading } = useAuth()
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const emailValue = formData.get('email') as string
    const passwordValue = formData.get('password') as string
    
    // Store email and password for 2FA retry
    setEmail(emailValue)
    setPassword(passwordValue)
    
    try {
      const result = await signIn(emailValue, passwordValue)
      
      // Check if 2FA is required
      if (result.requires_2fa) {
        setRequires2FA(true)
        setIsLoading(false)
        return
      }
      
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.')
      setIsLoading(false)
    }
  }

  const handle2FASubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await signIn(email, password, totpCode)
      
      if (result.requires_2fa) {
        setError("Invalid 2FA code. Please try again.")
        setIsLoading(false)
        return
      }
      
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code. Please try again.')
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    if (emailRef.current) emailRef.current.value = DEMO_CREDENTIALS.email
    if (passwordRef.current) passwordRef.current.value = DEMO_CREDENTIALS.password
  }

  const handleDemoLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || 'Demo login failed. Please ensure the demo account exists.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Pill className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Pharmacist
            </span>
          </Link>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              {requires2FA && <Shield className="h-6 w-6 text-green-600" />}
              <CardTitle className="text-2xl font-bold">
                {requires2FA ? "Two-Factor Authentication" : "Welcome back"}
              </CardTitle>
            </div>
            <CardDescription>
              {requires2FA 
                ? "Enter the 6-digit code from Google Authenticator" 
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          
          {requires2FA ? (
            <form onSubmit={handle2FASubmit}>
              <CardContent className="space-y-4">
                {/* 2FA Security Indicator */}
                <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200 text-center font-semibold flex items-center justify-center gap-2">
                    <Shield className="h-4 w-4" />
                    🔒 Your account is protected with 2FA
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300 border border-red-200 dark:border-red-900">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="totpCode">Authentication Code</Label>
                  <Input
                    id="totpCode"
                    name="totpCode"
                    type="text"
                    placeholder="000000"
                    required
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono"
                    autoComplete="off"
                    autoFocus
                  />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground text-center">
                      Open <span className="font-semibold">Google Authenticator</span> and enter the 6-digit code
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      Code changes every 30 seconds
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading || totpCode.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Verify & Login
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setRequires2FA(false)
                    setTotpCode("")
                    setError(null)
                  }}
                  size="sm"
                >
                  ← Back to Login
                </Button>
              </CardFooter>
            </form>
          ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300 border border-red-200 dark:border-red-900">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">{error}</p>
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
                  ref={emailRef}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    ref={passwordRef}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <Link href="/auth/forgot" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              
              {/* Demo Login Section */}
              <div className="w-full space-y-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or try demo</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                  Demo Login (Vedantika Bhoyar)
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Email: vedantikabhoyar135@gmail.com | Password: admin123
                </p>
              </div>
              
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
          )}
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-8">
          By continuing, you agree to our{" "}
          <Link href="#" className="hover:text-primary underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="hover:text-primary underline">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
