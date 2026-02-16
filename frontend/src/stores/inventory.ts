import { create } from 'zustand'
import { Product } from '@/types'

interface InventoryState {
  products: Product[]
  isLoading: boolean
  error: string | null
  filters: {
    category: string
    stockLevel: 'all' | 'low' | 'out' | 'normal'
    searchTerm: string
  }

  // Actions
  setProducts: (products: Product[]) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  addProduct: (product: Product) => void
  removeProduct: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateFilters: (filters: Partial<InventoryState['filters']>) => void
  fetchProducts: () => Promise<void>
}

export const useInventory = create<InventoryState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  filters: {
    category: 'all',
    stockLevel: 'all',
    searchTerm: ''
  },

  setProducts: (products) => set({ products }),

  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map(product =>
        product.id === id ? { ...product, ...updates } : product
      )
    }))
  },

  addProduct: (product) => {
    set((state) => ({
      products: [...state.products, product]
    }))
  },

  removeProduct: (id) => {
    set((state) => ({
      products: state.products.filter(product => product.id !== id)
    }))
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  updateFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }))
  },

  fetchProducts: async () => {
    set({ isLoading: true, error: null })
    try {
      // Mock API call - replace with actual API
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      const products = await response.json()
      set({ products, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        isLoading: false 
      })
    }
  }
}))