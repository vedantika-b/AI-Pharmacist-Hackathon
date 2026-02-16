'use client'

import React from 'react'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/hooks/useI18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

export interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  lowStockItems: number
  totalUsers: number
  systemHealth: 'healthy' | 'warning' | 'error'
}

interface DashboardOverviewProps {
  stats?: DashboardStats
}

export function DashboardOverview({ stats }: DashboardOverviewProps) {
  const { user } = useAuthStore()
  const { t } = useI18n()

  // Default stats if none provided
  const defaultStats: DashboardStats = {
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockItems: 0,
    totalUsers: 0,
    systemHealth: 'healthy'
  }

  const currentStats = stats || defaultStats

  const cards = [
    {
      title: t('totalOrders'),
      value: currentStats.totalOrders.toString(),
      icon: ShoppingCart,
      description: t('ordersThisMonth'),
      trend: '+12%',
      trendUp: true
    },
    {
      title: t('pendingOrders'),
      value: currentStats.pendingOrders.toString(),
      icon: Clock,
      description: t('awaitingProcessing'),
      trend: '-3%',
      trendUp: false
    },
    {
      title: t('totalProducts'),
      value: currentStats.totalProducts.toString(),
      icon: Package,
      description: t('inInventory'),
      trend: '+5%',
      trendUp: true
    },
    {
      title: t('activeUsers'),
      value: currentStats.totalUsers.toString(),
      icon: Users,
      description: t('registeredCustomers'),
      trend: '+8%',
      trendUp: true
    }
  ]

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" />Healthy</Badge>
      case 'warning':
        return <Badge variant="secondary"><AlertTriangle className="w-4 h-4 mr-1" />Warning</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-4 h-4 mr-1" />Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (!user) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className={`mr-1 h-3 w-3 ${card.trendUp ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
                <span className={card.trendUp ? 'text-green-500' : 'text-red-500'}>
                  {card.trend}
                </span>
                <span className="ml-1">{card.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('systemHealth')}
              </CardTitle>
              <CardDescription>
                Overall system status and performance
              </CardDescription>
            </div>
            {getHealthBadge(currentStats.systemHealth)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">API Response Time</p>
              <p className="text-2xl font-bold">142ms</p>
              <p className="text-xs text-muted-foreground">Average last 24h</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Database Performance</p>
              <p className="text-2xl font-bold">98.7%</p>
              <p className="text-xs text-muted-foreground">Uptime this month</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Error Rate</p>
              <p className="text-2xl font-bold">0.03%</p>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}