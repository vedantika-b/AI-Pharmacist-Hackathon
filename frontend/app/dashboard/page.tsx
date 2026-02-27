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
  const { language } = useLanguage()
  const { user } = useAuth()

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">{t('loading', language)}</span>
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
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
              <Activity className="h-5 w-5 text-primary" />
              {t('recentOrders', language) || "Recent Orders"}
            </CardTitle>
            <CardDescription>
              {t('latestOrders', language)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <Pill className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {t('noRecentOrders', language) || "No recent orders"}
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
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all duration-300 border border-transparent hover:border-primary/20 hover:shadow-md cursor-pointer"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-semibold">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{order.item_count} {order.item_count !== 1 ? t('items', language) : t('item', language)}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {order.status}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{formatCurrency(order.total_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
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
                      {insight.type === 'alert' && <AlertTriangle className="h-5 w-5 mt-0.5 text-blue-500 flex-shrink-0" />}
                      {insight.type === 'suggestion' && <TrendingUp className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />}
                      {insight.type === 'warning' && <Bell className="h-5 w-5 mt-0.5 text-yellow-500 flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-1">
                          {insight.category}
                        </p>
                        <p className="text-xs opacity-90 leading-relaxed">
                          {insight.message}
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
