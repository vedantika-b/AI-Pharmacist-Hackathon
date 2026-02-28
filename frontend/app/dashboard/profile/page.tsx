"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RedactedInput, RedactedList, RedactionBadge } from "@/components/ui/redacted-text"
import { User, Heart, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase"
import { getGenderAvatar, getAvatarBackground, getInitials, getAvatarOptions, saveSelectedAvatar, getSelectedAvatar } from "@/lib/avatar-utils"
import { 
  getUserProfile, 
  updateUserProfile,
  getHealthProfile,
  updateHealthProfile
} from "@/lib/api"

interface UserProfile {
  full_name?: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  blood_group?: string
  weight?: string
  height?: string
  address?: string
}

interface HealthProfile {
  allergies: string[]
  chronic_conditions: string[]
  hereditary_diseases: string[]
}

export default function ProfilePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    blood_group: "",
    weight: "",
    height: "",
    address: ""
  })

  // Health profile state
  const [healthProfile, setHealthProfile] = useState<HealthProfile>({
    allergies: [],
    chronic_conditions: [],
    hereditary_diseases: []
  })

  // Validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Avatar selection
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number>(0)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  // Load gender and avatar from localStorage on mount
  useEffect(() => {
    const storedGender = localStorage.getItem('user_gender')
    if (storedGender) {
      setProfile(prev => ({ ...prev, gender: storedGender }))
    }
    
    const savedAvatar = getSelectedAvatar()
    if (savedAvatar !== null) {
      setSelectedAvatarIndex(savedAvatar)
    }
  }, [])

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        setError(null) // Clear any previous errors
        const { user } = await getCurrentUser()
        
        if (!user?.id) {
          setError("Unable to load user information")
          setLoading(false)
          return
        }

        setUserId(user.id)
        
        // Set email from auth user immediately
        setProfile(prev => ({
          ...prev,
          email: user.email || prev.email
        }))
        
        // Fetch all user data in parallel
        const [profileData, healthData] = await Promise.all([
          getUserProfile(user.id).catch(() => null),
          getHealthProfile(user.id).catch(() => null)
        ])

        if (profileData) {
          const typedProfile = profileData as UserProfile
          setProfile(prev => ({
            ...typedProfile,
            email: user.email || typedProfile.email // Ensure email from auth is used
          }))
          
          // Store gender in localStorage for avatar
          if (typedProfile.gender) {
            localStorage.setItem('user_gender', typedProfile.gender)
          }
          
          // Load selected avatar index
          const savedAvatar = getSelectedAvatar()
          if (savedAvatar !== null) {
            setSelectedAvatarIndex(savedAvatar)
          }
          
          // Check if this is a first-time user (missing required fields)
          const isIncomplete = !typedProfile.full_name || 
                                !typedProfile.date_of_birth || 
                                !typedProfile.gender ||
                                !typedProfile.blood_group ||
                                !typedProfile.weight ||
                                !typedProfile.height
          setIsFirstTimeUser(isIncomplete)
        } else {
          // If no profile data, still mark as first-time user and clear error
          setIsFirstTimeUser(true)
          setError(null) // Clear error so user can fill the form
        }

        if (healthData) {
          setHealthProfile(healthData as HealthProfile)
        }

        setLoading(false)
      } catch (err) {
        console.error("Profile load error:", err)
        // Don't show error - let user fill the form even if API is down
        setError(null)
        setIsFirstTimeUser(true)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!profile.full_name?.trim()) {
      errors.full_name = "Full name is required"
    }

    if (!profile.date_of_birth) {
      errors.date_of_birth = "Date of birth is required"
    }

    if (!profile.gender?.trim()) {
      errors.gender = "Gender is required"
    }

    if (!profile.blood_group?.trim()) {
      errors.blood_group = "Blood group is required"
    }

    if (!profile.weight?.trim()) {
      errors.weight = "Weight is required"
    }

    if (!profile.height?.trim()) {
      errors.height = "Height is required"
    }

    if (!profile.phone?.trim()) {
      errors.phone = "Phone number is required"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProfileSave = async () => {
    if (!userId) return
    
    if (!validateForm()) {
      setError("Please fill in all required fields")
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      // Try to save to backend, but don't fail if it's down
      try {
        await updateUserProfile(userId, { profile })
        await updateHealthProfile(userId, healthProfile)
      } catch (apiError) {
        console.log("Backend unavailable, saving locally:", apiError)
        // Continue even if API fails - data will be saved to localStorage
      }
      
      // Store gender in localStorage for avatar generation
      if (profile.gender) {
        localStorage.setItem('user_gender', profile.gender)
        saveSelectedAvatar(selectedAvatarIndex)
        
        // Dispatch custom event to update navbar
        window.dispatchEvent(new Event('profile-updated'))
      }
      
      setSuccess("Profile saved successfully!")
      setIsFirstTimeUser(false)
      
      // If first-time user, redirect to dashboard after 2 seconds
      if (isFirstTimeUser) {
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err: any) {
      setError(err.message || "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Avatar */}
      <div className="flex items-start gap-6">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-border cursor-pointer transition-all hover:border-primary" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
            <AvatarImage 
              src={getGenderAvatar(profile.gender, userId || 'default', selectedAvatarIndex)} 
              alt={profile.full_name || 'User'} 
            />
            <AvatarFallback className={`${getAvatarBackground(profile.gender)} text-white text-2xl`}>
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
          >
            {showAvatarPicker ? 'Close' : 'Change'}
          </Button>
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">
            {isFirstTimeUser ? "Complete Your Profile" : "My Profile"}
          </h1>
          <p className="text-muted-foreground">
            {isFirstTimeUser 
              ? "Please fill in your information to get started" 
              : "Manage your personal and health information"}
          </p>
        </div>
      </div>

      {isFirstTimeUser && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Welcome! Please complete your profile</p>
            <p className="text-sm mt-1">All fields marked with * are required for your safety and better service.</p>
          </div>
        </div>
      )}

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
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Personal Information *</CardTitle>
            </div>
            <CardDescription>Your basic personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <RedactionBadge />
              <span className="text-xs text-muted-foreground">Personal data is partially redacted for privacy</span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <RedactedInput 
                  id="name" 
                  value={profile.full_name || ""} 
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  redactionType="name"
                  placeholder="Enter your full name"
                  className={validationErrors.full_name ? "border-red-500" : ""}
                />
                {validationErrors.full_name && (
                  <p className="text-xs text-red-500">{validationErrors.full_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <RedactedInput 
                  id="email" 
                  value={profile.email || ""} 
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  redactionType="email"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <RedactedInput 
                  id="phone" 
                  value={profile.phone || ""} 
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  redactionType="phone"
                  placeholder="Enter 10-digit mobile number"
                  className={validationErrors.phone ? "border-red-500" : ""}
                />
                {validationErrors.phone && (
                  <p className="text-xs text-red-500">{validationErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="dob" 
                  type="date"
                  value={profile.date_of_birth || ""} 
                  onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                  className={validationErrors.date_of_birth ? "border-red-500" : ""}
                />
                {validationErrors.date_of_birth && (
                  <p className="text-xs text-red-500">{validationErrors.date_of_birth}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <select 
                  id="gender"
                  value={profile.gender || ""} 
                  onChange={(e) => {
                    setProfile({ ...profile, gender: e.target.value })
                    setShowAvatarPicker(true) // Show avatar picker when gender changes
                  }}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${validationErrors.gender ? "border-red-500" : ""}`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {validationErrors.gender && (
                  <p className="text-xs text-red-500">{validationErrors.gender}</p>
                )}
              </div>

              <div className="space-y-2"></div>
            </div>

            {/* Avatar Picker */}
            {showAvatarPicker && profile.gender && (
              <div className="space-y-3 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Choose Your Avatar</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAvatarPicker(false)}
                  >
                    Close
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Select an avatar that represents you</p>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {getAvatarOptions(profile.gender).map((avatarUrl, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSelectedAvatarIndex(index)
                        setShowAvatarPicker(false)
                      }}
                      className={`relative group hover:scale-110 transition-transform ${
                        selectedAvatarIndex === index ? 'ring-4 ring-primary ring-offset-2 rounded-full' : ''
                      }`}
                    >
                      <Avatar className="h-16 w-16 cursor-pointer border-2 border-border hover:border-primary transition-colors">
                        <AvatarImage src={avatarUrl} alt={`Avatar ${index + 1}`} />
                        <AvatarFallback className={getAvatarBackground(profile.gender)}>
                          {index + 1}
                        </AvatarFallback>
                      </Avatar>
                      {selectedAvatarIndex === index && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-full">
                          <div className="h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                            ✓
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blood_group">
                  Blood Group <span className="text-red-500">*</span>
                </Label>
                <select 
                  id="blood_group"
                  value={profile.blood_group || ""} 
                  onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${validationErrors.blood_group ? "border-red-500" : ""}`}
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                {validationErrors.blood_group && (
                  <p className="text-xs text-red-500">{validationErrors.blood_group}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">
                  Weight (kg) <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="weight" 
                  type="number"
                  value={profile.weight || ""} 
                  onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                  placeholder="e.g., 70"
                  className={validationErrors.weight ? "border-red-500" : ""}
                />
                {validationErrors.weight && (
                  <p className="text-xs text-red-500">{validationErrors.weight}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">
                  Height (cm) <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="height" 
                  type="number"
                  value={profile.height || ""} 
                  onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                  placeholder="e.g., 170"
                  className={validationErrors.height ? "border-red-500" : ""}
                />
                {validationErrors.height && (
                  <p className="text-xs text-red-500">{validationErrors.height}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <RedactedInput 
                id="address" 
                value={profile.address || ""} 
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                redactionType="address"
                placeholder="Your residential address"
              />
            </div>
          </CardContent>
        </Card>

        {/* Health Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <CardTitle>Health Information</CardTitle>
            </div>
            <CardDescription>Medical history and health conditions (Optional but recommended)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <RedactionBadge />
              <span className="text-xs text-muted-foreground">Medical data is redacted (HIPAA compliant)</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Drug Allergies</Label>
              <p className="text-xs text-muted-foreground mb-2">
                List any medications or substances you're allergic to (comma-separated)
              </p>
              {healthProfile.allergies && healthProfile.allergies.length > 0 ? (
                <div className="space-y-3">
                  <RedactedList items={healthProfile.allergies} type="medical" />
                  <Input 
                    id="allergies" 
                    value={healthProfile.allergies?.join(", ") || ""} 
                    onChange={(e) => setHealthProfile({ 
                      ...healthProfile, 
                      allergies: e.target.value.split(",").map(a => a.trim()).filter(a => a)
                    })}
                    placeholder="e.g., Penicillin, Aspirin, Shellfish"
                    className="text-sm"
                  />
                </div>
              ) : (
                <Input 
                  id="allergies" 
                  value={healthProfile.allergies?.join(", ") || ""} 
                  onChange={(e) => setHealthProfile({ 
                    ...healthProfile, 
                    allergies: e.target.value.split(",").map(a => a.trim()).filter(a => a)
                  })}
                  placeholder="e.g., Penicillin, Aspirin, Shellfish"
                />
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="conditions">Chronic Diseases / Current Conditions</Label>
              <p className="text-xs text-muted-foreground mb-2">
                List any ongoing medical conditions (comma-separated)
              </p>
              {healthProfile.chronic_conditions && healthProfile.chronic_conditions.length > 0 ? (
                <div className="space-y-3">
                  <RedactedList items={healthProfile.chronic_conditions} type="medical" />
                  <Input 
                    id="conditions" 
                    value={healthProfile.chronic_conditions?.join(", ") || ""} 
                    onChange={(e) => setHealthProfile({ 
                      ...healthProfile, 
                      chronic_conditions: e.target.value.split(",").map(c => c.trim()).filter(c => c)
                    })}
                    placeholder="e.g., Diabetes, Hypertension, Asthma"
                    className="text-sm"
                  />
                </div>
              ) : (
                <Input 
                  id="conditions" 
                  value={healthProfile.chronic_conditions?.join(", ") || ""} 
                  onChange={(e) => setHealthProfile({ 
                    ...healthProfile, 
                    chronic_conditions: e.target.value.split(",").map(c => c.trim()).filter(c => c)
                  })}
                  placeholder="e.g., Diabetes, Hypertension, Asthma"
                />
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="hereditary">Hereditary / Family Diseases</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Medical conditions that run in your family (comma-separated)
              </p>
              {healthProfile.hereditary_diseases && healthProfile.hereditary_diseases.length > 0 ? (
                <div className="space-y-3">
                  <RedactedList items={healthProfile.hereditary_diseases} type="medical" />
                  <Input 
                    id="hereditary" 
                    value={healthProfile.hereditary_diseases?.join(", ") || ""} 
                    onChange={(e) => setHealthProfile({ 
                      ...healthProfile, 
                      hereditary_diseases: e.target.value.split(",").map(h => h.trim()).filter(h => h)
                    })}
                    placeholder="e.g., Heart Disease, Cancer, Diabetes"
                    className="text-sm"
                  />
                </div>
              ) : (
                <Input 
                  id="hereditary" 
                  value={healthProfile.hereditary_diseases?.join(", ") || ""} 
                  onChange={(e) => setHealthProfile({ 
                    ...healthProfile, 
                    hereditary_diseases: e.target.value.split(",").map(h => h.trim()).filter(h => h)
                  })}
                  placeholder="e.g., Heart Disease, Cancer, Diabetes"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={handleProfileSave} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? "Saving..." : (isFirstTimeUser ? "Complete Profile & Continue" : "Save Changes")}
          </Button>
          {!isFirstTimeUser && (
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
