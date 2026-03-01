"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  MessageSquare, 
  Pill, 
  Bell, 
  Settings,
  FileText,
  MessageCircle,
  Sun,
  Moon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { t } from "@/lib/translations"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export default function TopNav() {
  const pathname = usePathname()
  const { language } = useLanguage()
  const { theme, setTheme } = useTheme()

  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard', language), href: "/dashboard" },
    { icon: MessageSquare, label: t('chat', language), href: "/dashboard/chat" },
    { icon: Pill, label: t('medicines', language), href: "/dashboard/medicines" },
    { icon: FileText, label: t('prescriptionOCR', language), href: "/dashboard/ocr" },
    { icon: MessageCircle, label: t('feedback', language), href: "/dashboard/feedback" },
    { icon: Bell, label: t('alerts', language), href: "/dashboard/alerts" },
    { icon: Settings, label: t('settings', language), href: "/dashboard/settings" },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] dark:border-[#1E293B] bg-[#E6F4EF] dark:bg-[#064E3B] backdrop-blur-xl shadow-lg transition-colors duration-300">
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0F5C4B] to-[#065F46] dark:from-[#10B981] dark:to-[#059669] flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-[#0F5C4B] dark:text-[#10B981]">
              MedFlow
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300",
                      isActive 
                        ? "bg-[#0F5C4B] dark:bg-[#065F46] text-white shadow-md" 
                        : "text-[#1F2937] dark:text-[#F1F5F9] hover:bg-[#0F5C4B]/10 dark:hover:bg-[#065F46]/20"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm font-medium hidden lg:inline">{item.label}</span>
                  </div>
                </Link>
              )
            })}
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="ml-2 h-10 w-10 rounded-xl hover:bg-[#0F5C4B]/10 dark:hover:bg-[#065F46]/20 transition-all duration-300"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0 text-[#0F5C4B]" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100 text-[#10B981]" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
