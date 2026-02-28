"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pill, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Phone, Shield } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [showQrCode, setShowQrCode] = useState(false)
  const [signupComplete, setSignupComplete] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [demoOtp, setDemoOtp] = useState<string | null>(null)
  const router = useRouter()
  const { signUp, user, loading } = useAuth()

  // Redirect if already logged in (but not during active signup with QR code)
  useEffect(() => {
    if (!loading && user && !showQrCode && !signupComplete && !otpSent) {
      router.push("/dashboard")
    }
  }, [user, loading, router, showQrCode, signupComplete, otpSent])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("=== SIGNUP FORM SUBMITTED ===")
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const fullName = formData.get('fullName') as string
    const phone = formData.get('phoneNumber') as string
    
    console.log("Form data:", { email, fullName, phone, passwordLength: password?.length })
    
    // Validate passwords match
    if (password !== confirmPassword) {
      console.log("ERROR: Passwords don't match")
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }
    
    // Validate password length
    if (password.length < 6) {
      console.log("ERROR: Password too short")
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }
    
    // Set this BEFORE calling signUp to prevent redirect race condition
    setSignupComplete(true)
    if (phone) setPhoneNumber(phone)
    
    try {
      console.log("Calling signUp API...")
      const result = await signUp(email, password, fullName, phone)
      console.log("SignUp result:", result)
      setSuccess(true)
      setIsLoading(false)
      
      // Save QR code but don't show it yet (OTP verification comes first)
      if (result.qr_code) {
        console.log("QR Code received! Length:", result.qr_code.length)
        setQrCode(result.qr_code)
      }
      
      // Check if OTP was sent - show OTP screen first
      if (result.otp_sent && result.otp_code_demo) {
        console.log("OTP sent to phone!")
        setOtpSent(true)
        setDemoOtp(result.otp_code_demo)  // For demo only - shows OTP
        // Don't show QR code yet - wait for OTP verification
      } else if (result.qr_code) {
        // No OTP but has QR code - show QR directly
        setShowQrCode(true)
      } else {
        console.log("No QR code or OTP in result, redirecting...")
        // Redirect after 2 seconds if no 2FA
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    } catch (err: any) {
      console.log("SignUp Error:", err)
      setError(err.message || 'Failed to create account. Please try again.')
      setIsLoading(false)
      setSignupComplete(false)
    }
  }

  const handleContinue = () => {
    router.push("/dashboard")
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

        {/* OTP Verification Screen */}
        {otpSent && !showQrCode ? (
          <Card className="border-2">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <Phone className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-bold">Verify Phone Number</CardTitle>
              </div>
              <CardDescription>
                Enter the OTP sent to {phoneNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                {/* Demo OTP Display - Remove in Production */}
                {demoOtp && (
                  <div className="w-full p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                      <span className="font-semibold">Demo Mode:</span> Your OTP is{" "}
                      <span className="font-mono font-bold text-lg">{demoOtp}</span>
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center mt-1">
                      (In production, this would be sent via SMS)
                    </p>
                  </div>
                )}
                
                <div className="w-full space-y-2">
                  <Label htmlFor="otpCode">Enter 6-digit OTP</Label>
                  <Input
                    id="otpCode"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
                
                <p className="text-sm text-muted-foreground">
                  OTP valid for 5 minutes
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  if (otpCode === demoOtp) {
                    setOtpSent(false)
                    if (qrCode) {
                      setShowQrCode(true)
                    } else {
                      router.push("/dashboard")
                    }
                  } else {
                    setError("Invalid OTP code")
                  }
                }}
                className="w-full"
                size="lg"
                disabled={otpCode.length !== 6}
              >
                <Shield className="mr-2 h-4 w-4" />
                Verify OTP
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setOtpSent(false)
                  if (qrCode) setShowQrCode(true)
                }}
                className="w-full"
              >
                Skip for now
              </Button>
            </CardFooter>
          </Card>
        ) : showQrCode && qrCode ? (
          <Card className="border-2">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Setup 2FA Authentication</CardTitle>
              <CardDescription>
                Scan this QR code with Google Authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-semibold text-lg">Setup Instructions:</p>
                  <ol className="text-sm text-left space-y-1 list-decimal list-inside">
                    <li>Install Google Authenticator on your phone</li>
                    <li>Open the app and tap the + button</li>
                    <li>Scan this QR code with your camera</li>
                    <li>Save the 6-digit code for future logins</li>
                  </ol>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleContinue}
                className="w-full"
                size="lg"
              >
                Continue to Dashboard
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="border-2">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
              <CardDescription>
                Enter your information to get started with AI Pharmacist
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
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-300 border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">Account created successfully! Redirecting...</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                />
              </div>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (for OTP verification)</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+91 9876543210"
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground">Optional: Add phone number for SMS OTP security</p>
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
                    minLength={6}
                    autoComplete="new-password"
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="terms"
                  type="checkbox"
                  className="rounded border-gray-300"
                  required
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                  I agree to the{" "}
                  <Link href="#" className="text-primary hover:underline">
                    Terms and Conditions
                  </Link>
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
        )}

        <p className="text-center text-sm text-muted-foreground mt-8">
          By signing up, you agree to our{" "}
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
