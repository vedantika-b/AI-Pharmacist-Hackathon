import { create } from 'zustand'
import { AuditLog } from '@/types'

interface AuditState {
  logs: AuditLog[] 
  isLoading: boolean
  error: string | null
  filters: {
    action: string
    severity: string
    userId: string | null
    startDate: string | null
    endDate: string | null
  }
  pagination: {
    page: number
    limit: number
    total: number
  }

  // Actions
  setLogs: (logs: AuditLog[]) => void
  addLog: (log: AuditLog) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateFilters: (filters: Partial<AuditState['filters']>) => void
  updatePagination: (pagination: Partial<AuditState['pagination']>) => void
  fetchLogs: () => Promise<void>
  exportLogs: (format: 'csv' | 'json') => Promise<void>
}

export const useAuditLogs = create<AuditState>((set, get) => ({
  logs: [],
  isLoading: false,
  error: null,
  filters: {
    action: 'all',
    severity: 'all',
    userId: null,
    startDate: null,
    endDate: null
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0
  },

  setLogs: (logs) => set({ logs }),

  addLog: (log) => {
    set((state) => ({
      logs: [log, ...state.logs]
    }))
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  updateFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }))
  },

  updatePagination: (newPagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...newPagination }
    }))
  },

  fetchLogs: async () => {
    const { filters, pagination } = get()
    set({ isLoading: true, error: null })
    
    try {
      // Mock API call - replace with actual API
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.action !== 'all' && { action: filters.action }),
        ...(filters.severity !== 'all' && { severity: filters.severity }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })

      const response = await fetch(`/api/audit/logs?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch audit logs')
      
      const data = await response.json()
      set({ 
        logs: data.logs, 
        pagination: { ...pagination, total: data.total },
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        isLoading: false 
      })
    }
  },

  exportLogs: async (format) => {
    const { filters } = get()
    set({ isLoading: true, error: null })
    
    try {
      const queryParams = new URLSearchParams({
        format,
        ...(filters.action !== 'all' && { action: filters.action }),
        ...(filters.severity !== 'all' && { severity: filters.severity }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })

      const response = await fetch(`/api/audit/export?${queryParams}`)
      if (!response.ok) throw new Error('Failed to export audit logs')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        isLoading: false 
      })
    }
  }
}))