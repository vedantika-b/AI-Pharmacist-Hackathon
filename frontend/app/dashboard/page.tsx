"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, Pill, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Active Orders",
    value: "24",
    description: "+12% from last month",
    icon: Activity,
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Total Patients",
    value: "1,234",
    description: "+18% from last month",
    icon: Users,
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Medicines Stock",
    value: "892",
    description: "23 low stock items",
    icon: Pill,
    color: "from-orange-500 to-red-500"
  },
  {
    title: "Revenue",
    value: "$12.4k",
    description: "+20% from last month",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500"
  }
]

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
        {stats.map((stat, index) => (
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
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Order #{1000 + i}</p>
                    <p className="text-xs text-muted-foreground">Patient Name {i}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${(Math.random() * 100 + 50).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{i} hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Smart recommendations for your pharmacy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Stock Alert
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  5 medicines running low. Consider restocking soon.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Trending
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Demand for cold medicine increased by 30% this week.
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  AI Suggestion
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Schedule refill reminders for 12 patients today.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
