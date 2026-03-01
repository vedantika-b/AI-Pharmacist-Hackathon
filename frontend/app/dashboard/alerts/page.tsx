"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bell, AlertTriangle, CheckCircle, Clock, Pill, Calendar, Loader2, Package, TrendingDown, Info, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getRefillPredictions, getAlertDetail, sendAlertNotification } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { t } from "@/lib/translations"

const getStatusConfig = (lang: string) => ({
  critical: {
    color: "from-red-500 to-orange-500",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    textColor: "text-red-700 dark:text-red-300",
    icon: AlertTriangle,
    label: t('critical', lang as any),
    variant: "destructive" as const
  },
  low: {
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    textColor: "text-yellow-700 dark:text-yellow-300",
    icon: Bell,
    label: t('low', lang as any),
    variant: "secondary" as const
  },
  safe: {
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-700 dark:text-green-300",
    icon: CheckCircle,
    label: t('safe', lang as any),
    variant: "outline" as const
  }
})

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
  const { language } = useLanguage()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [notifyingId, setNotifyingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const statusConfig = getStatusConfig(language)

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  useEffect(() => {
    fetchAlerts()
  }, [filter])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const data = await getRefillPredictions().catch(err => {
        console.error('Refill predictions API failed:', err)
        throw err
      }) as any
      setAlerts(data || [])
      // Clear any previous error notifications on success
      if (notification?.type === 'error') {
        setNotification(null)
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setNotification({ 
        type: 'error', 
        message: `${t('alertsLoadError', language)}: ${errorMessage}` 
      })
      // Set empty array on error so UI doesn't break
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewAlert = async (alert: any) => {
    try {
      setLoadingDetail(true)
      setDetailDialogOpen(true)
      const detail = await getAlertDetail(alert.id).catch(err => {
        console.error('Alert detail API failed:', err)
        throw err
      }) as any
      setSelectedAlert(detail)
    } catch (error) {
      console.error('Failed to fetch alert detail:', error)
      // Fallback to basic alert data
      setSelectedAlert({
        id: alert.id,
        medicine: {
          name: alert.medicine_name,
          generic_name: alert.generic_name || '',
          category: alert.category || 'General',
          form: alert.form || '',
          strength: alert.strength || '',
          price: alert.price || 0
        },
        stock_info: {
          current_stock: alert.current_stock,
          min_stock_level: alert.min_stock_level,
          reorder_level: alert.reorder_level,
          daily_consumption: alert.daily_consumption,
          days_remaining: alert.days_remaining
        },
        alert_info: {
          status: alert.status,
          predicted_refill_date: alert.predicted_refill_date,
          notification_sent: alert.notification_sent,
          recommendation: getRecommendation(alert)
        }
      })
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleNotify = async (alertId: string) => {
    try {
      setNotifyingId(alertId)
      await sendAlertNotification(alertId, 'email')
      setNotification({ type: 'success', message: t('notificationSentSuccess', language) })
      // Update local state to reflect notification sent
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, notification_sent: true } : a
      ))
    } catch (error) {
      console.error('Failed to send notification:', error)
      setNotification({ type: 'error', message: t('notificationSentError', language) })
    } finally {
      setNotifyingId(null)
    }
  }

  const getRecommendation = (alert: any) => {
    if (alert.status === 'critical') {
      return `URGENT: Stock is critically low (${alert.current_stock} units). Place an order immediately.`
    } else if (alert.status === 'low') {
      return `Stock is running low with ${alert.days_remaining} days remaining. Consider placing an order soon.`
    }
    return `Stock levels are healthy with ${alert.days_remaining} days of supply.`
  }

  const filteredAlerts = filter 
    ? alerts.filter(a => a.status === filter)
    : alerts

  const criticalCount = alerts.filter(a => a.status === "critical").length
  const lowCount = alerts.filter(a => a.status === "low").length
  const safeCount = alerts.filter(a => a.status === "safe").length

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2",
            notification.type === 'success' && "bg-green-500 text-white",
            notification.type === 'error' && "bg-red-500 text-white"
          )}
        >
          {notification.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {notification.message}
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      <div>
        <h1 className="text-4xl font-bold mb-2">{t('refillAlerts', language)}</h1>
        <p className="text-muted-foreground">
          {t('monitorRefillStatus', language)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>{t('critical', language)}</CardDescription>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">{criticalCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('requiresImmediateAttention', language)}</p>
            {criticalCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => setFilter(filter === 'critical' ? null : 'critical')}
              >
                {filter === 'critical' ? t('showAll', language) : t('showCriticalOnly', language)}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>{t('low', language)}</CardDescription>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Bell className="h-5 w-5 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">{lowCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('monitorClosely', language)}</p>
            {lowCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => setFilter(filter === 'low' ? null : 'low')}
              >
                {filter === 'low' ? t('showAll', language) : t('showLowOnly', language)}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>{t('safe', language)}</CardDescription>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">{safeCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('wellStocked', language)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">{t('loadingAlerts', language)}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAlerts.length === 0 && (
        <Card>
          <CardContent className="py-20 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noAlertsFound', language)}</h3>
            <p className="text-muted-foreground">
              {filter ? t('noAlertsInCategory', language) : t('allPrescriptionsUpToDate', language)}
            </p>
            {filter && (
              <Button 
                variant="outline" 
                onClick={() => setFilter(null)}
                className="mt-4"
              >
                {t('clearFilter', language)}
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
                              <h3 className="font-semibold text-lg">{alert.medicine_name || t('unknownMedicine', language)}</h3>
                              <p className="text-sm text-muted-foreground">
                                {t('refillPredictedFor', language)} {new Date(alert.predicted_refill_date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={config.variant} className="shrink-0">
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {config.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t('daysRemaining', language)}</p>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className={cn(
                                  "font-semibold text-lg",
                                  alert.days_remaining <= 5 ? "text-red-600 dark:text-red-400" :
                                  alert.days_remaining <= 14 ? "text-yellow-600 dark:text-yellow-400" :
                                  "text-green-600 dark:text-green-400"
                                )}>
                                  {alert.days_remaining} {t('days', language)}
                                </span>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t('confidence', language)}</p>
                              <p className="font-medium">
                                {alert.confidence_score 
                                  ? `${Math.round(alert.confidence_score * 100)}%`
                                  : 'N/A'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t('lastOrder', language)}</p>
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
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => handleViewAlert(alert)}
                              >
                                <Info className="h-3 w-3 mr-1" />
                                {t('view', language)}
                              </Button>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                disabled={alert.notification_sent || notifyingId === alert.id}
                                onClick={() => handleNotify(alert.id)}
                              >
                                {notifyingId === alert.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3 mr-1" />
                                )}
                                {alert.notification_sent ? t('notified', language) : t('notify', language)}
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

      {/* Alert Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Alert Details
            </DialogTitle>
            <DialogDescription>
              Stock alert information and recommendations
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetail ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedAlert ? (
            <div className="space-y-6">
              {/* Medicine Info */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold text-lg mb-2">
                  {selectedAlert.medicine?.name || 'Unknown Medicine'}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Generic Name:</span>
                    <p className="font-medium">{selectedAlert.medicine?.generic_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{selectedAlert.medicine?.category || 'General'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Form:</span>
                    <p className="font-medium">{selectedAlert.medicine?.form || 'N/A'} {selectedAlert.medicine?.strength || ''}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <p className="font-medium">₹{selectedAlert.medicine?.price?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              {/* Stock Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Package className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-xs text-muted-foreground">Current Stock</p>
                    <p className="text-2xl font-bold">{selectedAlert.stock_info?.current_stock || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingDown className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-xs text-muted-foreground">Min Level</p>
                    <p className="text-2xl font-bold">{selectedAlert.stock_info?.min_stock_level || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <p className="text-xs text-muted-foreground">Days Left</p>
                    <p className="text-2xl font-bold">{selectedAlert.stock_info?.days_remaining || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Pill className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-xs text-muted-foreground">Daily Use</p>
                    <p className="text-2xl font-bold">{selectedAlert.stock_info?.daily_consumption?.toFixed(1) || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Status & Recommendation */}
              <div className={cn(
                "p-4 rounded-lg border",
                selectedAlert.alert_info?.status === 'critical' && "bg-red-50 dark:bg-red-950/30 border-red-200",
                selectedAlert.alert_info?.status === 'low' && "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200",
                selectedAlert.alert_info?.status === 'safe' && "bg-green-50 dark:bg-green-950/30 border-green-200"
              )}>
                <div className="flex items-start gap-3">
                  {selectedAlert.alert_info?.status === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
                  {selectedAlert.alert_info?.status === 'low' && <Bell className="h-5 w-5 text-yellow-500 mt-0.5" />}
                  {selectedAlert.alert_info?.status === 'safe' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                  <div>
                    <h4 className="font-semibold capitalize">{selectedAlert.alert_info?.status || 'Unknown'} Status</h4>
                    <p className="text-sm mt-1">{selectedAlert.alert_info?.recommendation || 'No recommendation available.'}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Predicted refill date: {selectedAlert.alert_info?.predicted_refill_date 
                        ? new Date(selectedAlert.alert_info.predicted_refill_date).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
                <Button 
                  disabled={selectedAlert.alert_info?.notification_sent}
                  onClick={() => {
                    handleNotify(selectedAlert.id)
                    setDetailDialogOpen(false)
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {selectedAlert.alert_info?.notification_sent ? 'Already Notified' : 'Send Notification'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No alert data available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
