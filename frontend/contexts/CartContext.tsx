"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Medicine } from '@/lib/types'

interface CartItem extends Medicine {
  quantity: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (medicine: Medicine, quantity?: number) => void
  removeFromCart: (medicineId: string) => void
  updateQuantity: (medicineId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('pharmacist-cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error('Failed to load cart:', error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pharmacist-cart', JSON.stringify(cart))
    }
  }, [cart, isLoaded])

  const addToCart = (medicine: Medicine, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === medicine.id)
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevCart.map(item =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        // Add new item
        return [...prevCart, { ...medicine, quantity }]
      }
    })
  }

  const removeFromCart = (medicineId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== medicineId))
  }

  const updateQuantity = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId)
      return
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === medicineId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
