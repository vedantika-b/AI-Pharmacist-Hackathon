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
    { icon: FileText, label: t('prescriptionOCR', language), href: "/dashboard/ocr" },
    { icon: Bell, label: t('alerts', language), href: "/dashboard/alerts" },
    { icon: Settings, label: t('settings', language), href: "/dashboard/settings" },
  ]

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative border-r-2 bg-[#EEF5F2] dark:bg-[#162420]"
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 border-b-2 border-border flex items-center justify-between px-4">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">AI Pharmacist</span>
            </motion.div>
          )}
          {collapsed && (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto shadow-lg">
              <Pill className="h-6 w-6 text-white" />
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
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-all duration-300 rounded-xl h-12",
                    collapsed ? "px-0 justify-center" : "px-4",
                    isActive && "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90",
                    !isActive && "hover:bg-muted hover:shadow-md"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t-2 border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full hover:bg-muted transition-colors duration-300 rounded-xl h-10"
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
