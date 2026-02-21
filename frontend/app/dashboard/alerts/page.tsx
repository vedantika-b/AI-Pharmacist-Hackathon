"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, AlertTriangle, CheckCircle, Clock, Pill, Calendar, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getRefillPredictions } from "@/lib/api"
import type { RefillPrediction } from "@/lib/types"

const statusConfig = {
  critical: {
    color: "from-red-500 to-orange-500",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    textColor: "text-red-700 dark:text-red-300",
    icon: AlertTriangle,
    label: "Critical",
    variant: "destructive" as const
  },
  low: {
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    textColor: "text-yellow-700 dark:text-yellow-300",
    icon: Bell,
    label: "Low",
    variant: "secondary" as const
  },
  safe: {
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-700 dark:text-green-300",
    icon: CheckCircle,
    label: "Safe",
    variant: "outline" as const
  }
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [filter])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const data = await getRefillPredictions() as any
      setAlerts(data)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAlerts = filter 
    ? alerts.filter(a => a.status === filter)
    : alerts

  const criticalCount = alerts.filter(a => a.status === "critical").length
  const lowCount = alerts.filter(a => a.status === "low").length
  const safeCount = alerts.filter(a => a.status === "safe").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Refill Alerts</h1>
        <p className="text-muted-foreground">
          Monitor medication refill status and send timely reminders to patients
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Critical</CardDescription>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">{criticalCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Requires immediate attention</p>
            {criticalCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => setFilter(filter === 'critical' ? null : 'critical')}
              >
                {filter === 'critical' ? 'Show All' : 'Show Critical Only'}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Low</CardDescription>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Bell className="h-5 w-5 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">{lowCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Monitor closely</p>
            {lowCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => setFilter(filter === 'low' ? null : 'low')}
              >
                {filter === 'low' ? 'Show All' : 'Show Low Only'}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Safe</CardDescription>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">{safeCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Well stocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading alerts...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAlerts.length === 0 && (
        <Card>
          <CardContent className="py-20 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
            <p className="text-muted-foreground">
              {filter ? 'No alerts in this category' : 'All prescriptions are up to date'}
            </p>
            {filter && (
              <Button 
                variant="outline" 
                onClick={() => setFilter(null)}
                className="mt-4"
              >
                Clear Filter
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      {!loading && filteredAlerts.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {filteredAlerts.map((alert) => {
            const config = statusConfig[alert.status as keyof typeof statusConfig]
            const StatusIcon = config.icon

            return (
              <motion.div key={alert.id} variants={item}>
                <Card className={cn(
                  "hover:shadow-lg transition-shadow",
                  alert.status === "critical" && "border-red-200 dark:border-red-900"
                )}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center shrink-0`}>
                          <Pill className="h-6 w-6 text-white" />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg">{alert.medicine_name || 'Unknown Medicine'}</h3>
                              <p className="text-sm text-muted-foreground">
                                Refill predicted for {new Date(alert.predicted_refill_date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={config.variant} className="shrink-0">
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {config.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Days Remaining</p>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className={cn(
                                  "font-semibold text-lg",
                                  alert.days_remaining <= 5 ? "text-red-600 dark:text-red-400" :
                                  alert.days_remaining <= 14 ? "text-yellow-600 dark:text-yellow-400" :
                                  "text-green-600 dark:text-green-400"
                                )}>
                                  {alert.days_remaining} days
                                </span>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                              <p className="font-medium">
                                {alert.confidence_score 
                                  ? `${Math.round(alert.confidence_score * 100)}%`
                                  : 'N/A'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Last Order</p>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                  {alert.last_order_date 
                                    ? new Date(alert.last_order_date).toLocaleDateString()
                                    : 'Unknown'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-end gap-2">
                              <Button size="sm" variant="outline" className="flex-1">
                                View
                              </Button>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                disabled={alert.notification_sent}
                              >
                                {alert.notification_sent ? 'Notified' : 'Notify'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
