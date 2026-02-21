"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, Pill, TrendingUp, Loader2, AlertTriangle, TrendingDown } from "lucide-react"
import { getDashboardStats, getRecentOrders, getDashboardInsights } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, ordersData, insightsData] = await Promise.all([
        getDashboardStats(),
        getRecentOrders(4),
        getDashboardInsights()
      ])
      setStats(statsData as any)
      setRecentOrders(ordersData as any[])
      setInsights(insightsData as any[])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsConfig = stats ? [
    {
      title: "Active Orders",
      value: stats.active_orders?.value || 0,
      description: `${stats.active_orders?.change || ''} ${stats.active_orders?.description || ''}`,
      icon: Activity,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Total Customers",
      value: stats.total_customers?.value || 0,
      description: `${stats.total_customers?.change || ''} ${stats.total_customers?.description || ''}`,
      icon: Users,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Medicines Stock",
      value: stats.medicines_stock?.value || 0,
      description: stats.medicines_stock?.description || 'No stock info',
      icon: Pill,
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.revenue?.value || 0),
      description: `${stats.revenue?.change || ''} ${stats.revenue?.description || ''}`,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500"
    }
  ] : []

  const getInsightColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100",
      green: "bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100",
      purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-100",
      red: "bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100",
      yellow: "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-100"
    }
    return colorMap[color] || colorMap.blue
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your pharmacy today.
        </p>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {statsConfig.map((stat, index) => (
          <motion.div key={index} variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest medication orders and prescriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent orders
              </p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.item_count} item{order.item_count !== 1 ? 's' : ''} • {order.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(order.total_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Smart recommendations for your pharmacy</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No insights available
              </p>
            ) : (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg ${getInsightColor(insight.color)}`}
                  >
                    <p className="text-sm font-medium">
                      {insight.category}
                    </p>
                    <p className="text-xs mt-1 opacity-90">
                      {insight.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
