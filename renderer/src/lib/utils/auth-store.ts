import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface User {
  id: string
  email: string
  name: string
  createdAt: number
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, name: string) => Promise<boolean>
  signOut: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      signIn: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          if (!email?.trim() || !password?.trim()) {
            throw new Error("Email and password are required")
          }

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Mock user data
          const user: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: email.trim(),
            name: email.split("@")[0] || "User",
            createdAt: Date.now(),
          }

          set({ user, isAuthenticated: true, isLoading: false })

          // Set auth cookie
          if (typeof document !== "undefined") {
            document.cookie = `auth-token=${user.id}; path=/; max-age=2592000; SameSite=Lax`
          }

          return true
        } catch (error) {
          const message = error instanceof Error ? error.message : "Sign in failed"
          set({ error: message, isLoading: false })
          console.error("[oLo Auth] Sign in error:", error)
          return false
        }
      },

      signUp: async (email, password, name) => {
        set({ isLoading: true, error: null })
        try {
          if (!email?.trim() || !password?.trim() || !name?.trim()) {
            throw new Error("All fields are required")
          }

          if (password.length < 6) {
            throw new Error("Password must be at least 6 characters")
          }

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Mock user data
          const user: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: email.trim(),
            name: name.trim(),
            createdAt: Date.now(),
          }

          set({ user, isAuthenticated: true, isLoading: false })

          // Set auth cookie
          if (typeof document !== "undefined") {
            document.cookie = `auth-token=${user.id}; path=/; max-age=2592000; SameSite=Lax`
          }

          return true
        } catch (error) {
          const message = error instanceof Error ? error.message : "Sign up failed"
          set({ error: message, isLoading: false })
          console.error("[oLo Auth] Sign up error:", error)
          return false
        }
      },

      signOut: () => {
        set({ user: null, isAuthenticated: false, error: null })

        // Clear auth cookie
        if (typeof document !== "undefined") {
          document.cookie = "auth-token=; path=/; max-age=0"
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "olo-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
