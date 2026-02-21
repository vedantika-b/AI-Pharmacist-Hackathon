"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, AlertTriangle, CheckCircle, Clock, Pill, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface RefillAlert {
  id: string
  patientName: string
  medicineName: string
  daysRemaining: number
  quantity: string
  lastRefilled: string
  status: "critical" | "low" | "safe"
}

const mockAlerts: RefillAlert[] = [
  {
    id: "1",
    patientName: "John Smith",
    medicineName: "Metformin 850mg",
    daysRemaining: 2,
    quantity: "30 tablets",
    lastRefilled: "2024-01-15",
    status: "critical"
  },
  {
    id: "2",
    patientName: "Sarah Johnson",
    medicineName: "Lisinopril 10mg",
    daysRemaining: 5,
    quantity: "60 tablets",
    lastRefilled: "2024-01-10",
    status: "critical"
  },
  {
    id: "3",
    patientName: "Michael Brown",
    medicineName: "Atorvastatin 20mg",
    daysRemaining: 8,
    quantity: "30 tablets",
    lastRefilled: "2024-01-08",
    status: "low"
  },
  {
    id: "4",
    patientName: "Emily Davis",
    medicineName: "Omeprazole 20mg",
    daysRemaining: 12,
    quantity: "90 tablets",
    lastRefilled: "2024-01-05",
    status: "low"
  },
  {
    id: "5",
    patientName: "David Wilson",
    medicineName: "Levothyroxine 50mcg",
    daysRemaining: 20,
    quantity: "60 tablets",
    lastRefilled: "2023-12-28",
    status: "safe"
  },
  {
    id: "6",
    patientName: "Jennifer Lee",
    medicineName: "Amlodipine 5mg",
    daysRemaining: 25,
    quantity: "90 tablets",
    lastRefilled: "2023-12-23",
    status: "safe"
  }
]

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
  const criticalCount = mockAlerts.filter(a => a.status === "critical").length
  const lowCount = mockAlerts.filter(a => a.status === "low").length
  const safeCount = mockAlerts.filter(a => a.status === "safe").length

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
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Low Stock</CardDescription>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Bell className="h-5 w-5 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">{lowCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Action needed soon</p>
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

      {/* Alerts List */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {mockAlerts.map((alert) => {
          const config = statusConfig[alert.status]
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
                            <h3 className="font-semibold text-lg">{alert.patientName}</h3>
                            <p className="text-sm text-muted-foreground">{alert.medicineName}</p>
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
                                alert.daysRemaining <= 5 ? "text-red-600 dark:text-red-400" :
                                alert.daysRemaining <= 10 ? "text-yellow-600 dark:text-yellow-400" :
                                "text-green-600 dark:text-green-400"
                              )}>
                                {alert.daysRemaining} days
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                            <p className="font-medium">{alert.quantity}</p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Last Refilled</p>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <p className="text-sm font-medium">
                                {new Date(alert.lastRefilled).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-end gap-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              View
                            </Button>
                            <Button size="sm" className="flex-1">
                              Notify
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
    </div>
  )
}
