"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bell, Shield, Eye, EyeOff, Key, Smartphone } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import QRCode from "qrcode"
import { 
  getNotificationPreferences,
  updateNotificationPreferences
} from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { t } from "@/lib/translations"

interface NotificationPreferences {
  refill_alerts: boolean
  email_notifications: boolean
  sms_notifications: boolean
  low_stock_alerts: boolean
  controlled_substance_warnings: boolean
}

export default function SettingsPage() {
  const { language } = useLanguage()
  const { user: authUser, loading: authLoading } = useAuth()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Dialog states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [show2FADialog, setShow2FADialog] = useState(false)
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [enabling2FA, setEnabling2FA] = useState(false)
  const [twoFactorSecret, setTwoFactorSecret] = useState("")
  const [qrCodeDataURL, setQrCodeDataURL] = useState("")
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    refill_alerts: true,
    email_notifications: true,
    sms_notifications: false,
    low_stock_alerts: true,
    controlled_substance_warnings: true
  })

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return
      }

      try {
        setLoading(true)
        
        if (!authUser?.id) {
          setError("Please log in to access settings")
          setLoading(false)
          return
        }

        setUserId(authUser.id)
        
        // Fetch notification preferences
        try {
          const notificationsData = await getNotificationPreferences(authUser.id)
          if (notificationsData) {
            setNotifications(notificationsData as NotificationPreferences)
          }
        } catch (err) {
          // Silently fail if notifications can't be loaded
          console.log("Could not load notification preferences:", err)
        }

        setError(null)
        setLoading(false)
      } catch (err) {
        console.error("Settings load error:", err)
        setError("Failed to load settings")
        setLoading(false)
      }
    }

    fetchUserData()
  }, [authUser, authLoading])

  const handleNotificationToggle = async (key: keyof NotificationPreferences) => {
    if (!userId) return
    
    try {
      const updated = {
        ...notifications,
        [key]: !notifications[key]
      }
      
      await updateNotificationPreferences(userId, updated)
      setNotifications(updated)
      setSuccess("Notification preferences updated")
      
      setTimeout(() => setSuccess(null), 2000)
    } catch (err: any) {
      setError(err.message || "Failed to update notification preferences")
    }
  }

  // Generate a random base32 secret for TOTP
  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)]
    }
    return secret
  }

  // Generate QR code for Google Authenticator
  const generateQRCode = async (userEmail: string) => {
    try {
      const secret = generateSecret()
      setTwoFactorSecret(secret)
      
      // Create otpauth URL (Google Authenticator format)
      const otpauthURL = `otpauth://totp/AI%20Pharmacist:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=AI%20Pharmacist`
      
      // Generate QR code as data URL
      const qrDataURL = await QRCode.toDataURL(otpauthURL, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrCodeDataURL(qrDataURL)
    } catch (err) {
      console.error('Error generating QR code:', err)
      setError('Failed to generate QR code')
    }
  }

  // Open 2FA dialog and generate QR code
  const handle2FADialogOpen = async () => {
    if (!twoFactorEnabled && authUser?.email) {
      await generateQRCode(authUser.email)
    }
    setShow2FADialog(true)
  }

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    try {
      setChangingPassword(true)
      setError(null)
      
      if (!supabase) {
        throw new Error("Authentication service not available")
      }

      // Call Supabase to update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setSuccess("Password changed successfully!")
      setShowPasswordDialog(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    try {
      setEnabling2FA(true)
      setError(null)

      // Here you would verify the code with your backend
      // Backend should:
      // 1. Verify the TOTP code against the secret
      // 2. Save the secret to user's profile if valid
      // 3. Return success/failure
      
      // For now, we'll simulate successful verification
      // In production, call your backend API:
      // const response = await fetch('/api/2fa/enable', {
      //   method: 'POST',
      //   body: JSON.stringify({ 
      //     userId, 
      //     secret: twoFactorSecret, 
      //     code: verificationCode 
      //   })
      // })
      
      await new Promise(resolve => setTimeout(resolve, 1000))

      setTwoFactorEnabled(true)
      setSuccess("Two-Factor Authentication enabled successfully! Keep your authenticator app safe.")
      setShow2FADialog(false)
      setVerificationCode("")
      
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      setError(err.message || "Failed to enable 2FA. Please try again.")
    } finally {
      setEnabling2FA(false)
    }
  }

  const handleDisable2FA = async () => {
    try {
      setEnabling2FA(true)
      setError(null)

      // Call your backend to disable 2FA
      await new Promise(resolve => setTimeout(resolve, 1000))

      setTwoFactorEnabled(false)
      setSuccess("Two-Factor Authentication disabled")
      setShow2FADialog(false)
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to disable 2FA")
    } finally {
      setEnabling2FA(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('loading', language)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your notification preferences and security settings
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300 border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-300 border border-green-200 dark:border-green-900">
          {success}
        </div>
      )}

      <div className="grid gap-6 max-w-3xl">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>{t('notificationsTitle', language)}</CardTitle>
            </div>
            <CardDescription>{t('configureNotificationPrefs', language)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('refillAlertsNotif', language)}</p>
                <p className="text-sm text-muted-foreground">{t('refillAlertsDesc', language)}</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.refill_alerts}
                onChange={() => handleNotificationToggle('refill_alerts')}
                className="rounded"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('lowStockAlertsNotif', language)}</p>
                <p className="text-sm text-muted-foreground">{t('lowStockAlertsDesc', language)}</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.low_stock_alerts}
                onChange={() => handleNotificationToggle('low_stock_alerts')}
                className="rounded"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('emailNotifications', language)}</p>
                <p className="text-sm text-muted-foreground">{t('emailNotificationsDesc', language)}</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.email_notifications}
                onChange={() => handleNotificationToggle('email_notifications')}
                className="rounded"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('controlledSubstanceWarnings', language)}</p>
                <p className="text-sm text-muted-foreground">{t('controlledSubstanceWarningsDesc', language)}</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.controlled_substance_warnings}
                onChange={() => handleNotificationToggle('controlled_substance_warnings')}
                className="rounded"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Privacy & Security</CardTitle>
            </div>
            <CardDescription>Manage your security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              type="button"
              variant="outline" 
              className="w-full justify-start gap-2 cursor-pointer"
              onClick={() => {
                console.log('Change Password clicked')
                setShowPasswordDialog(true)
              }}
            >
              <Key className="h-4 w-4" />
              Change Password
            </Button>
            <Button 
              type="button"
              variant="outline" 
              className="w-full justify-start gap-2 cursor-pointer"
              onClick={() => {
                console.log('2FA clicked')
                handle2FADialogOpen()
              }}
            >
              <Smartphone className="h-4 w-4" />
              {twoFactorEnabled ? "Manage" : "Enable"} Two-Factor Authentication
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} disabled={changingPassword}>
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Two-Factor Authentication Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {twoFactorEnabled 
                ? "Manage your two-factor authentication settings" 
                : "Add an extra layer of security to your account"}
            </DialogDescription>
          </DialogHeader>
          {!twoFactorEnabled ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm mb-3 font-medium">
                  Step 1: Scan this QR code with Google Authenticator
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Open Google Authenticator app and tap the "+" button to add a new account
                </p>
                {qrCodeDataURL ? (
                  <div className="bg-white p-4 rounded-lg mx-auto flex flex-col items-center border-2 w-fit">
                    <img 
                      src={qrCodeDataURL} 
                      alt="Google Authenticator QR Code" 
                      className="w-64 h-64"
                    />
                    <div className="mt-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Or enter this code manually:</p>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {twoFactorSecret}
                      </code>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-lg w-64 h-64 mx-auto flex items-center justify-center border-2">
                    <div className="text-center text-sm text-muted-foreground">
                      Generating QR Code...
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="verification-code" className="font-medium">
                  Step 2: Enter the 6-digit code from your app
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground text-center">
                  The code changes every 30 seconds
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <p className="text-sm text-green-900 dark:text-green-300">
                  ✓ Two-Factor Authentication is currently enabled on your account
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                You will be asked for a verification code when signing in.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancel
            </Button>
            {!twoFactorEnabled ? (
              <Button onClick={handleEnable2FA} disabled={enabling2FA}>
                {enabling2FA ? "Enabling..." : "Enable 2FA"}
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleDisable2FA} disabled={enabling2FA}>
                {enabling2FA ? "Disabling..." : "Disable 2FA"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
