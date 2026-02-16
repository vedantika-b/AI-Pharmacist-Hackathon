'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sun, 
  Moon, 
  Cloud, 
  Sunrise, 
  Sunset,
  Bell,
  Settings,
  User,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

interface WelcomeHeaderProps {
  className?: string
}

export function WelcomeHeader({ className }: WelcomeHeaderProps) {
  const { user } = useAuthStore()
  const { t } = useI18n()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notifications, setNotifications] = useState(3)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    
    if (hour >= 5 && hour < 12) return { text: 'Good Morning', icon: Sunrise }
    if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', icon: Sun }
    if (hour >= 17 && hour < 21) return { text: 'Good Evening', icon: Sunset }
    return { text: 'Good Night', icon: Moon }
  }

  const getWeatherIcon = () => {
    // Simulate weather - in a real app, you'd fetch this from an API
    const weather = ['sunny', 'cloudy', 'partly-cloudy'][Math.floor(Math.random() * 3)]
    
    switch (weather) {
      case 'sunny': return Sun
      case 'cloudy': return Cloud
      default: return Cloud
    }
  }

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-500'
      case 'pharmacist': return 'bg-blue-500'
      case 'customer': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getTodayStats = () => {
    // In a real app, these would come from your data
    return {
      ordersToday: 12,
      pendingCount: 4,
      completedCount: 8
    }
  }

  const greeting = getGreeting()
  const WeatherIcon = getWeatherIcon()
  const stats = getTodayStats()

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const getProgress = () => {
    const total = stats.ordersToday
    const completed = stats.completedCount
    return total > 0 ? (completed / total) * 100 : 0
  }

  return (
    <Card className={cn("mb-6", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left side - Greeting and User Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <greeting.icon className="h-6 w-6 text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold">
                  {greeting.text}
                  {user ? (
                    <span className="ml-2">{user.full_name || user.email.split('@')[0]}!</span>
                  ) : (
                    <span className="ml-2">Welcome!</span>
                  )}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{formatDate(currentTime)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-mono">{formatTime(currentTime)}</span>
                  </div>
                </div>
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <Badge className={getRoleColor(user.role)}>
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Center - Today's Quick Stats */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{stats.ordersToday}</p>
                <p className="text-xs text-muted-foreground">Orders Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">{stats.pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{stats.completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Daily Progress</span>
                <span>{Math.round(getProgress())}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-700"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right side - Actions and Status */}
          <div className="flex items-center gap-3">
            {/* Weather */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <WeatherIcon className="h-5 w-5" />
              <div className="text-sm">
                <div>72°F</div>
                <div className="text-xs">Clear</div>
              </div>
            </div>

            {/* Notifications */}
            <Button variant="outline" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500">
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                Analytics
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Motivational message */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span>
              {stats.ordersToday > 10 ? 
                "Great job! You're having a productive day." :
                stats.ordersToday > 5 ?
                "Good progress so far today!" :
                "Ready to make today great!"
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}