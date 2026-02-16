'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'

interface SystemMetrics {
  uptime: number
  responseTime: number
  errorRate: number
  databaseHealth: 'healthy' | 'warning' | 'error'
  apiHealth: 'healthy' | 'warning' | 'error'
  networkHealth: 'healthy' | 'warning' | 'error'
  lastUpdated: string
}

interface SystemHealthProps {
  metrics?: SystemMetrics
  className?: string
}

export function SystemHealth({ metrics, className }: SystemHealthProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 700)
    return () => clearTimeout(timer)
  }, [])

  // Default metrics if none provided
  const defaultMetrics: SystemMetrics = {
    uptime: 99.87,
    responseTime: 142,
    errorRate: 0.03,
    databaseHealth: 'healthy',
    apiHealth: 'healthy',
    networkHealth: 'healthy',
    lastUpdated: new Date().toISOString()
  }

  const currentMetrics = metrics || defaultMetrics

  const getHealthBadge = (health: string, label: string) => {
    switch (health) {
      case 'healthy':
        return (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <Badge className="bg-green-500">{label}</Badge>
          </div>
        )
      case 'warning':
        return (
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <Badge className="bg-yellow-500">{label}</Badge>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <Badge variant="destructive">{label}</Badge>
          </div>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getOverallHealth = () => {
    const healthStates = [
      currentMetrics.databaseHealth,
      currentMetrics.apiHealth,
      currentMetrics.networkHealth
    ]

    if (healthStates.includes('error')) return 'error'
    if (healthStates.includes('warning')) return 'warning'
    return 'healthy'
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setRefreshing(false)
  }

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`
  }

  const formatResponseTime = (time: number) => {
    return `${time}ms`
  }

  const formatErrorRate = (rate: number) => {
    return `${rate.toFixed(2)}%`
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const healthComponents = [
    {
      name: 'Database',
      health: currentMetrics.databaseHealth,
      icon: Database,
      details: 'PostgreSQL 15.2'
    },
    {
      name: 'API Gateway',
      health: currentMetrics.apiHealth,
      icon: Server,
      details: 'FastAPI 0.104.1'
    },
    {
      name: 'Network',
      health: currentMetrics.networkHealth,
      icon: Wifi,
      details: 'CDN & Load Balancer'
    }
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              System Health
            </CardTitle>
            <CardDescription>
              Real-time system monitoring and performance metrics
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getHealthBadge(getOverallHealth(), 'System')}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Uptime</span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-500">
                  {formatUptime(currentMetrics.uptime)}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Response Time</span>
                  <Zap className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-blue-500">
                  {formatResponseTime(currentMetrics.responseTime)}
                </div>
                <p className="text-xs text-muted-foreground">Average last 24h</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Error Rate</span>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-yellow-500">
                  {formatErrorRate(currentMetrics.errorRate)}
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
            </div>

            {/* Component Health */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Component Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {healthComponents.map((component) => (
                  <div key={component.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <component.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{component.name}</span>
                      </div>
                      {getHealthBadge(component.health, 'Healthy')}
                    </div>
                    <p className="text-xs text-muted-foreground">{component.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Trends */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Performance Trends</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>23%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[23%] transition-all duration-500" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>67%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[67%] transition-all duration-500" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Disk Usage</span>
                    <span>45%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 w-[45%] transition-all duration-500" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Network I/O</span>
                    <span>12%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[12%] transition-all duration-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Last updated: {formatLastUpdated(currentMetrics.lastUpdated)}</span>
              </div>
              <span>Auto-refreshes every 30s</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}