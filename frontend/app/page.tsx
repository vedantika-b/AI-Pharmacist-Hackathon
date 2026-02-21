"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BotMessageSquare, 
  Pill, 
  Bell, 
  Calendar, 
  Shield, 
  Sparkles,
  Moon,
  Sun
} from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"

const features = [
  {
    icon: BotMessageSquare,
    title: "AI-Powered Chat",
    description: "Get instant answers about medications, dosages, and health queries from our intelligent AI assistant."
  },
  {
    icon: Pill,
    title: "Smart Medicine Search",
    description: "Quickly find medicines with detailed information, alternatives, and availability in real-time."
  },
  {
    icon: Bell,
    title: "Refill Alerts",
    description: "Never run out of medications with automatic refill reminders and low-stock notifications."
  },
  {
    icon: Calendar,
    title: "Medication Tracking",
    description: "Track your medication schedule and maintain a comprehensive health history."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your health data is encrypted and protected with enterprise-grade security."
  },
  {
    icon: Sparkles,
    title: "Personalized Insights",
    description: "Receive AI-driven recommendations tailored to your unique health profile."
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

export default function LandingPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <Pill className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Pharmacist
            </span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-3xl opacity-30 dark:opacity-20" />
                <h1 className="relative text-6xl md:text-8xl font-bold">
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                    AI Pharmacist 💊
                  </span>
                </h1>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto"
            >
              Your intelligent healthcare companion for smart medication management, 
              AI-powered health insights, and personalized care.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 h-14 group">
                  Get Started Free
                  <Sparkles className="ml-2 h-5 w-5 group-hover:animate-pulse" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                  Sign In
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Shield className="h-4 w-4" />
              <span>Trusted by 10,000+ users worldwide</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need for better health
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make medication management effortless and intelligent.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={item}>
                <Card className="h-full border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-2 bg-gradient-to-br from-purple-500 to-pink-500 text-white border-white/20">
              <CardHeader className="text-center space-y-4 pb-8 pt-12">
                <CardTitle className="text-4xl md:text-5xl font-bold text-white">
                  Ready to transform your healthcare?
                </CardTitle>
                <CardDescription className="text-xl text-white/90">
                  Join thousands of users managing their health smarter with AI
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 justify-center pb-12">
                <Link href="/auth/signup">
                  <Button size="lg" variant="secondary" className="text-lg px-8 h-14">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 h-14 bg-white/10 text-white border-white/30 hover:bg-white/20"
                  >
                    View Demo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <Pill className="h-6 w-6 text-primary" />
              <span className="font-semibold">AI Pharmacist</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 AI Pharmacist. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
