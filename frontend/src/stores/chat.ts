import { create } from 'zustand'
import { ChatMessage } from '@/types'

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  currentConversationId: string | null
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setMessages: (messages: ChatMessage[]) => void
  setLoading: (loading: boolean) => void
  clearChat: () => void
  setConversationId: (id: string) => void
}

export const useChat = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  currentConversationId: null,

  addMessage: (message) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...message,
    }

    set((state) => ({
      messages: [...state.messages, newMessage],
    }))
  },

  setMessages: (messages) => {
    set({ messages })
  },

  setLoading: (isLoading) => {
    set({ isLoading })
  },

  clearChat: () => {
    set({
      messages: [],
      currentConversationId: null,
    })
  },

  setConversationId: (currentConversationId) => {
    set({ currentConversationId })
  },
}))