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
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: t('totalCustomers', language) || "Total Customers", 
      value: stats.total_customers?.value || 0,
      description: `${stats.total_customers?.change || ''} ${stats.total_customers?.description || ''}`,
      icon: Users,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: t('medicinesStock', language) || "Medicines Stock",
      value: stats.medicines_stock?.value || 0,
      description: stats.medicines_stock?.description || 'No stock info',
      icon: Pill,
      color: "from-orange-500 to-red-500"
    },
    {
      title: t('revenue', language) || "Revenue",
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
        <span className="ml-2 text-muted-foreground">{t('loading', language)}</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl -z-10" />
        <div className="p-6">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {language === 'hi' ? `स्वागत है, ${user?.name || 'उपयोगकर्ता'}!` : 
             language === 'mr' ? `स्वागत आहे, ${user?.name || 'वापरकर्ता'}!` :
             `Welcome, ${user?.name || 'User'}!`}
          </h1>
          <p className="text-muted-foreground text-lg">
            {language === 'hi' ? 'आपकी फार्मेसी डैशबोर्ड पर आपको स्वागत है' : 
             language === 'mr' ? 'आपल्या फार्मसी डॅशबोर्डवर आपले स्वागत आहे' :
             'Welcome to your pharmacy dashboard'}
          </p>
        </div>
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
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {stat.title}
                </CardTitle>
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {t('recentOrders', language) || "Recent Orders"}
            </CardTitle>
            <CardDescription>
              {language === 'hi' ? "नवीनतम दवा ऑर्डर और प्रिस्क्रिप्शन" : 
               language === 'mr' ? "नवीनतम औषध ऑर्डर आणि प्रिस्क्रिप्शन" : 
               "Latest medication orders and prescriptions"}
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
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <motion.div 
                    key={order.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border-b last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.item_count} item{order.item_count !== 1 ? 's' : ''} • 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {order.status}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(order.total_amount)}</p>
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

        <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
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
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }} 
                    className={`p-4 rounded-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer ${getInsightColor(insight.color)}`}
                  >
                    <div className="flex items-start gap-3">
                      {insight.type === 'alert' && <AlertTriangle className="h-4 w-4 mt-0.5 text-blue-500" />}
                      {insight.type === 'suggestion' && <TrendingUp className="h-4 w-4 mt-0.5 text-green-500" />}
                      {insight.type === 'warning' && <Bell className="h-4 w-4 mt-0.5 text-yellow-500" />}
                      <div>
                        <p className="text-sm font-semibold mb-1">
                          {insight.category}
                        </p>
                        <p className="text-xs opacity-90">
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
