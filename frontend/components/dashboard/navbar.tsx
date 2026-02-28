"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RedactedText } from "@/components/ui/redacted-text"
import { User, Settings, LogOut, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { LanguageSelector } from "@/components/LanguageSelector"
import { useAuth } from "@/contexts/AuthContext"
import { ThemeToggle } from "@/components/ThemeToggle"
import { getGenderAvatar, getAvatarBackground, getInitials, getSelectedAvatar } from "@/lib/avatar-utils"
import { useState, useEffect } from "react"

export default function Navbar() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [gender, setGender] = useState<string | undefined>(undefined)
  const [avatarIndex, setAvatarIndex] = useState<number>(0)

  // Load gender and avatar index from localStorage
  useEffect(() => {
    const loadUserData = () => {
      const storedGender = localStorage.getItem('user_gender')
      if (storedGender) {
        setGender(storedGender)
      }
      
      const savedAvatar = getSelectedAvatar()
      if (savedAvatar !== null) {
        setAvatarIndex(savedAvatar)
      }
    }
    
    // Load initial data
    loadUserData()
    
    // Listen for localStorage changes (when profile is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_gender' || e.key === 'selected_avatar_index') {
        loadUserData()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom event (for same-tab updates)
    const handleProfileUpdate = () => {
      loadUserData()
    }
    
    window.addEventListener('profile-updated', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profile-updated', handleProfileUpdate)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <header className="h-16 border-b-2 border-border bg-white dark:bg-[#0F1A17] px-6 flex items-center justify-between shadow-sm">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medicines, orders..."
            className="pl-10 rounded-xl border-2 focus:border-primary transition-colors duration-300 bg-background/50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <LanguageSelector />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage 
                  src={getGenderAvatar(gender, user?.email || 'default', avatarIndex)} 
                  alt={user?.name} 
                />
                <AvatarFallback className={`${getAvatarBackground(gender)} text-white`}>
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground mr-1">Name:</span>
                  <RedactedText 
                    text={user?.name || 'User'} 
                    type="name"
                    ariaLabel="User name"
                    className="text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground mr-1">Email:</span>
                  <RedactedText 
                    text={user?.email || ''} 
                    type="email"
                    ariaLabel="User email"
                    className="text-xs"
                  />
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
