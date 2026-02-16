'use client'

import { InventoryManagement } from '@/components/inventory/inventory-management'
import { useAuth } from '@/stores/auth'
import { useI18n } from '@/hooks/useI18n'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function InventoryPage() {
  const { user } = useAuth()
  const { t } = useI18n()

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'pharmacist') {
      redirect('/dashboard')
    }
  }, [user])

  if (!user || (user.role !== 'admin' && user.role !== 'pharmacist')) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {t('inventory')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage medication inventory and stock levels
        </p>
      </div>
      
      <InventoryManagement />
    </div>
  )
}