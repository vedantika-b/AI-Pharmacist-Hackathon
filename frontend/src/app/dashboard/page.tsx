'use client'

import { useAuth } from '@/stores/auth'
import { useI18n } from '@/hooks/useI18n'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { RefillPredictionCard } from '@/components/dashboard/refill-prediction-card'
import { LowStockAlert } from '@/components/dashboard/low-stock-alert'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { SystemHealth } from '@/components/dashboard/system-health'
import { WelcomeHeader } from '@/components/dashboard/welcome-header'

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useI18n()

  if (!user) return null

  return (
    <div className="space-y-8">
      <WelcomeHeader />
      
      <DashboardOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentOrders />
          {user.role === 'admin' && <SystemHealth />}
        </div>
        
        <div className="space-y-6">
          <RefillPredictionCard />
          {(user.role === 'admin' || user.role === 'pharmacist') && <LowStockAlert />}
        </div>
      </div>
    </div>
  )
}