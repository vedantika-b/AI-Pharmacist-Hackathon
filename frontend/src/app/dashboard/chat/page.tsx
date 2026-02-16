'use client'

import { ChatInterface } from '@/components/chat/chat-interface'
import { useI18n } from '@/hooks/useI18n'

export default function ChatPage() {
  const { t } = useI18n()

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {t('chat')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Order medications and get assistance from our AI pharmacist
        </p>
      </div>
      
      <ChatInterface />
    </div>
  )
}