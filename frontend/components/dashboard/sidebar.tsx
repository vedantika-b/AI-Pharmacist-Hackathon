"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, 
  MessageSquare, 
  Pill, 
  Bell, 
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/LanguageContext"
import { t } from "@/lib/translations"

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { language } = useLanguage()

  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard', language), href: "/dashboard" },
    { icon: MessageSquare, label: t('chat', language), href: "/dashboard/chat" },
    { icon: Pill, label: t('medicines', language), href: "/dashboard/medicines" },
    { icon: FileText, label: "Prescription OCR", href: "/dashboard/ocr" },
    { icon: Bell, label: t('alerts', language), href: "/dashboard/alerts" },
    { icon: Settings, label: t('settings', language), href: "/dashboard/settings" },
  ]

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative border-r bg-card"
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 border-b flex items-center justify-between px-4">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Pill className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">AI Pharmacist</span>
            </motion.div>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto">
              <Pill className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    collapsed ? "px-0 justify-center" : "px-4"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </motion.aside>
  )
}
