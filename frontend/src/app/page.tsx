'use client'

import { useAuth } from '@/stores/auth'
import { Loader2 } from 'lucide-react'
import { AuthPage } from '@/components/auth/auth-page'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      redirect('/dashboard')
    }
  }, [isAuthenticated, user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return null
}