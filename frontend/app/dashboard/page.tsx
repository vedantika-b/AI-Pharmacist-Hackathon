"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, Pill, TrendingUp, Loader2, AlertTriangle, TrendingDown, Sparkles, Bell } from "lucide-react"
import { getDashboardStats, getRecentOrders, getDashboardInsights } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { useAuth } from "@/contexts/AuthContext"
import { t } from "@/lib/translations"

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
  const [error, setError] = useState<string | null>(null)
  const { language } = useLanguage()
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch data with proper error handling
      const [statsData, ordersData, insightsData] = await Promise.all([
        getDashboardStats().catch(err => {
          console.error('Stats API failed:', err)
          return null
        }),
        getRecentOrders(4).catch(err => {
          console.error('Orders API failed:', err)
          return []
        }),
        getDashboardInsights().catch(err => {
          console.error('Insights API failed:', err)
          return []
        })
      ])
      
      // Check if any data was fetched
      if (!statsData && ordersData.length === 0 && insightsData.length === 0) {
        throw new Error('All API requests failed. Backend may not be running.')
      }
      
      setStats(statsData as any)
      setRecentOrders(ordersData as any[])
      setInsights(insightsData as any[])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(
        `Unable to connect to the API server. ` +
        `Please ensure the backend is running on http://localhost:8000. ` +
        `Error: ${errorMessage}`
      )
    } finally {
      setLoading(false)
    }
  }

  const statsConfig = stats ? [
    {
      title: t('activeOrders', language) || "Active Orders",
      value: stats.active_orders?.value || 0,
      description: `${stats.active_orders?.change || ''} ${stats.active_orders?.description || ''}`,
      icon: Activity,
      color: "from-emerald-400 to-teal-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20"
    },
    {
      title: t('totalCustomers', language) || "Total Customers", 
      value: stats.total_customers?.value || 0,
      description: `${stats.total_customers?.change || ''} ${stats.total_customers?.description || ''}`,
      icon: Users,
      color: "from-blue-400 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: t('medicinesStock', language) || "Medicines Stock",
      value: stats.medicines_stock?.value || 0,
      description: stats.medicines_stock?.description || 'No stock info',
      icon: Pill,
      color: "from-purple-400 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      title: t('revenue', language) || "Revenue",
      value: formatCurrency(stats.revenue?.value || 0),
      description: `${stats.revenue?.change || ''} ${stats.revenue?.description || ''}`,
      icon: TrendingUp,
      color: "from-green-400 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    }
  ] : []

  const getInsightColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-900/50",
      green: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-900/50",
      purple: "bg-purple-50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-900/50",
      red: "bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 border-red-200 dark:border-red-900/50",
      yellow: "bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-900/50"
    }
    return colorMap[color] || colorMap.blue
  }

  const translateInsightCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'Stock Alert': 'Stock Alert',
      'Refill Predictions': 'Refill Predictions',
      'High Demand': 'High Demand',
    }
    return categoryMap[category] || category
  }

  const translateInsightMessage = (message: string): string => {
    // Try to translate common insight message patterns
    if (message.includes('medicines running low')) {
      const match = message.match(/(\d+)\s+medicines running low/)
      if (match) {
        return `${match[1]} medicines running low`
      }
    }
    if (message.includes('patients need refills')) {
      const match = message.match(/(\d+)\s+patients need refills/)
      if (match) {
        return `${match[1]} patients need refills`
      }
    }
    if (message.includes('showing') && message.includes('increase')) {
      const match = message.match(/(\w+)\s+showing\s+(\d+)%\s+increase/)
      if (match) {
        return message
      }
    }
    return message
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">{t('loading', language)}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="max-w-md w-full border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <CardTitle>Connection Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-semibold mb-2">To start the backend:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Open a terminal in the backend folder</li>
                <li>Run: <code className="bg-background px-1 py-0.5 rounded">python -m uvicorn main:app --reload</code></li>
                <li>Wait for the server to start on port 8000</li>
              </ol>
            </div>
            <button
              onClick={() => fetchDashboardData()}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry Connection
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-2 border-primary/10">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {language === 'hi' ? `स्वागत है, ${user?.name || 'उपयोगकर्ता'}!` : 
             language === 'mr' ? `स्वागत आहे, ${user?.name || 'वापरकर्ता'}!` :
             `Welcome, ${user?.name || 'User'}!`}
          </h1>
          <p className="text-muted-foreground">
            {t('welcomeTo', language)}
          </p>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl z-0" />
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {statsConfig.map((stat, index) => (
          <motion.div key={index} variants={item}>
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 rounded-2xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  {stat.title}
                </CardTitle>
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-1">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-5 w-5 text-primary" />
              Recent Updates
            </CardTitle>
            <CardDescription>
              Latest activities in your pharmacy
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <Pill className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No recent activity
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order, index) => (
                  <motion.div 
                    key={order.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-xl hover:bg-muted/50 transition-all duration-300 border border-transparent hover:border-primary/20 hover:shadow-md cursor-pointer"
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      order.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      order.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' :
                      'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <Activity className={`h-5 w-5 ${
                        order.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' :
                        order.status === 'pending' ? 'text-amber-600 dark:text-amber-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            {order.status === 'completed' ? 'Order Completed' :
                             order.status === 'pending' ? 'New Order Received' :
                             'Order Processing'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Order #{order.id} • {order.item_count} {order.item_count !== 1 ? 'items' : 'item'}
                          </p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>•</span>
                        <span>{new Date(order.created_at).toLocaleString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('aiInsights', language) || "AI Insights"}
            </CardTitle>
            <CardDescription>{t('smartRecommendations', language) || "Smart recommendations for your pharmacy"}</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {t('noInsights', language) || "No insights available"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }} 
                    className={`p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 ${getInsightColor(insight.color)}`}
                  >
                    <div className="flex items-start gap-3">
                      {insight.type === 'alert' && <AlertTriangle className="h-5 w-5 mt-0.5 text-blue-500 shrink-0" />}
                      {insight.type === 'suggestion' && <TrendingUp className="h-5 w-5 mt-0.5 text-green-500 shrink-0" />}
                      {insight.type === 'warning' && <Bell className="h-5 w-5 mt-0.5 text-yellow-500 shrink-0" />}
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-1">
                          {translateInsightCategory(insight.category)}
                        </p>
                        <p className="text-xs opacity-90 leading-relaxed">
                          {translateInsightMessage(insight.message)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}