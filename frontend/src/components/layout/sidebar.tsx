'use client'

import { useState } from 'react'
import { useAuth } from '@/stores/auth'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Package, 
  FileText, 
  Settings,
  LogOut,
  Pill,
  Menu,
  X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

const navigation = [
  {
    name: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['customer', 'pharmacist', 'admin']
  },
  {
    name: 'chat',
    href: '/dashboard/chat',
    icon: MessageSquare,
    roles: ['customer', 'pharmacist', 'admin']
  },
  {
    name: 'inventory',
    href: '/dashboard/inventory',
    icon: Package,
    roles: ['pharmacist', 'admin']
  },
  {
    name: 'auditLogs',
    href: '/dashboard/audit-logs',
    icon: FileText,
    roles: ['admin']
  },
]

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const pathname = usePathname()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  )

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center px-4 py-4">
        <div className="flex items-center">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Pill className="h-6 w-6 text-primary" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              AI Pharmacist
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {user?.role} Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-4">
        <div className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  )}
                />
                {t(item.name)}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          {t('signOut')}
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <div
          className={cn(
            'fixed inset-0 z-50 bg-black/20 backdrop-blur-sm transition-opacity',
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 transform transition-transform',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="relative h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <SidebarContent />
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <div className="relative flex-1">
            <SidebarContent />
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white dark:bg-gray-900 px-4 py-4 shadow-sm lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100">
          AI Pharmacist
        </div>
      </div>
    </>
  )
}