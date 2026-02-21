"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from "lucide-react"
import { useState, useEffect } from "react"
import { getCurrentUser } from "@/lib/supabase"
import { 
  getUserProfile, 
  updateUserProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
  getHealthProfile,
  updateHealthProfile
} from "@/lib/api"

interface UserProfile {
  full_name?: string
  email?: string
  phone?: string
  date_of_birth?: string
}

interface NotificationPreferences {
  refill_alerts: boolean
  email_notifications: boolean
  sms_notifications: boolean
  low_stock_alerts: boolean
  controlled_substance_warnings: boolean
}

interface HealthProfile {
  allergies: string[]
  chronic_conditions: string[]
}

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: ""
  })

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    refill_alerts: true,
    email_notifications: true,
    sms_notifications: false,
    low_stock_alerts: true,
    controlled_substance_warnings: true
  })

  // Health profile state
  const [healthProfile, setHealthProfile] = useState<HealthProfile>({
    allergies: [],
    chronic_conditions: []
  })

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const { user } = await getCurrentUser()
        
        if (!user?.id) {
          setError("Unable to load user information")
          setLoading(false)
          return
        }

        setUserId(user.id)
        
        // Fetch all user data in parallel
        const [profileData, notificationsData, healthData] = await Promise.all([
          getUserProfile(user.id).catch(() => null),
          getNotificationPreferences(user.id).catch(() => null),
          getHealthProfile(user.id).catch(() => null)
        ])

        if (profileData) {
          setProfile(profileData)
        }
        if (notificationsData) {
          setNotifications(notificationsData)
        }
        if (healthData) {
          setHealthProfile(healthData)
        }

        setLoading(false)
      } catch (err) {
        setError("Failed to load settings")
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleProfileSave = async () => {
    if (!userId) return
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      await updateUserProfile(userId, { profile })
      setSuccess("Profile updated successfully")
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

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

  const handleHealthProfileSave = async () => {
    if (!userId) return
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      await updateHealthProfile(userId, healthProfile)
      setSuccess("Health profile updated successfully")
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save health profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
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

      <div className="grid gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={profile.full_name || ""} 
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={profile.email || ""} 
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={profile.phone || ""} 
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input 
                id="dob" 
                type="date" 
                value={profile.date_of_birth || ""} 
                onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
              />
            </div>
            <Button onClick={handleProfileSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Health Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Health Profile</CardTitle>
            </div>
            <CardDescription>Manage your allergies and medical conditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies (comma-separated)</Label>
              <Input 
                id="allergies" 
                value={healthProfile.allergies?.join(", ") || ""} 
                onChange={(e) => setHealthProfile({ 
                  ...healthProfile, 
                  allergies: e.target.value.split(",").map(a => a.trim()).filter(a => a)
                })}
                placeholder="e.g., Penicillin, Shellfish"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditions">Chronic Conditions (comma-separated)</Label>
              <Input 
                id="conditions" 
                value={healthProfile.chronic_conditions?.join(", ") || ""} 
                onChange={(e) => setHealthProfile({ 
                  ...healthProfile, 
                  chronic_conditions: e.target.value.split(",").map(c => c.trim()).filter(c => c)
                })}
                placeholder="e.g., Diabetes, Hypertension"
              />
            </div>
            <Button onClick={handleHealthProfileSave} disabled={saving}>
              {saving ? "Saving..." : "Save Health Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Refill Alerts</p>
                <p className="text-sm text-muted-foreground">Receive alerts for medication refills</p>
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
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified about low stock items</p>
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
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Get updates via email</p>
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
                <p className="font-medium">Controlled Substance Warnings</p>
                <p className="text-sm text-muted-foreground">Receive warnings for controlled substances</p>
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
          <CardContent className="space-y-4">
            <Button variant="outline" disabled>Change Password</Button>
            <Button variant="outline" disabled>Two-Factor Authentication</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
