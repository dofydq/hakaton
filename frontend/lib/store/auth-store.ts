import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'admin' | 'psychologist' | 'pending'
export type UserStatus = 'pending' | 'active' | 'blocked'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  specialization?: string
  bio?: string
  avatar?: string
  access_until: string | null
  created_at: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  isSubscriptionActive: () => boolean
  isPending: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        set({ token })
        if (typeof window !== 'undefined') {
          if (token) {
            document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`
          } else {
            document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }
        }
      },
      login: (user, token) => {
        set({ user, token, isAuthenticated: true, isLoading: false, isInitialized: true })
        if (typeof window !== 'undefined') {
          document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true })
        if (typeof window !== 'undefined') {
          localStorage.removeItem('profdnk-auth')
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      },
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),

      isSubscriptionActive: () => {
        const { user } = get()
        if (!user) return false
        if (user.role === 'admin') return true
        if (!user.access_until) return false
        return new Date(user.access_until) > new Date()
      },

      isPending: () => {
        const { user } = get()
        return user?.status === 'pending' || user?.role === 'pending'
      },
    }),
    {
      name: 'profdnk-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setInitialized(true)
      },
    },
  ),
)
