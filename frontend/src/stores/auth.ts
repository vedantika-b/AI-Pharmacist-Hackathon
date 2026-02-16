import { create } from 'zustand'
import { User } from '@/types'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      if (!supabase) {
        set({ user: null, isAuthenticated: false, isLoading: false })
        return
      }
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          set({
            user: {
              id: profile.id,
              email: session.user.email!,
              full_name: profile.full_name,
              role: profile.role,
              phone: profile.phone || undefined,
            },
            isAuthenticated: true,
            isLoading: false,
          })
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured')
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        set({
          user: {
            id: profile.id,
            email: data.user.email!,
            full_name: profile.full_name,
            role: profile.role,
            phone: profile.phone || undefined,
          },
          isAuthenticated: true,
        })
      }
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured')
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    if (data.user) {
      // Create user profile
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        full_name: fullName,
        role: 'customer',
      })
    }
  },

  signOut: async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured')
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    set({
      user: null,
      isAuthenticated: false,
    })
  },

  updateProfile: async (updates: Partial<User>) => {
    const { user } = get()
    if (!user) throw new Error('No authenticated user')
    if (!supabase) throw new Error('Supabase is not configured')

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error

    set({
      user: { ...user, ...updates },
    })
  },
}))

// Initialize auth when store is created
if (typeof window !== 'undefined') {
  useAuth.getState().initialize()
}