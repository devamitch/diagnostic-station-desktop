"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAuthStore, type AuthState } from "./auth-store"
import { useMetricsStore, type MetricsState } from "./metrics-store"
import { dataManager } from "./data-manager"

interface AuthContextValue {
  auth: AuthState
}

interface MetricsContextValue {
  metrics: MetricsState
  dbReady: boolean
  dbError: string | null
  storageInfo: {
    records: number
    estimatedMB: number
  }
  refreshStorageInfo: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const MetricsContext = createContext<MetricsContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore()

  const value: AuthContextValue = {
    auth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function MetricsProvider({ children }: { children: ReactNode }) {
  const metrics = useMetricsStore()
  const [dbReady, setDbReady] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [storageInfo, setStorageInfo] = useState({ records: 0, estimatedMB: 0 })

  // Initialize IndexedDB on mount
  useEffect(() => {
    let isMounted = true

    const initDB = async () => {
      try {
        await dataManager.init()
        if (!isMounted) return

        setDbReady(true)
        setDbError(null)
        console.log("[oLo] IndexedDB initialized for metrics")

        // Load initial storage info
        const info = await dataManager.getStorageSize()
        if (!isMounted) return
        setStorageInfo(info)
      } catch (error) {
        if (!isMounted) return

        const message = error instanceof Error ? error.message : "Unknown error"
        setDbError(message)
        console.warn("[oLo] IndexedDB not available - metrics will use memory only:", error)
        setDbReady(false)
      }
    }

    initDB()

    return () => {
      isMounted = false
    }
  }, [])

  // Refresh storage info periodically
  useEffect(() => {
    if (!dbReady) return

    const interval = setInterval(async () => {
      try {
        const info = await dataManager.getStorageSize()
        setStorageInfo(info)
      } catch (err) {
        console.warn("[oLo] Failed to refresh storage info:", err)
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [dbReady])

  const refreshStorageInfo = async () => {
    if (!dbReady) return
    try {
      const info = await dataManager.getStorageSize()
      setStorageInfo(info)
    } catch (err) {
      console.warn("[oLo] Failed to refresh storage info:", err)
    }
  }

  const value: MetricsContextValue = {
    metrics,
    dbReady,
    dbError,
    storageInfo,
    refreshStorageInfo,
  }

  return <MetricsContext.Provider value={value}>{children}</MetricsContext.Provider>
}

// Combined provider for convenience
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MetricsProvider>{children}</MetricsProvider>
    </AuthProvider>
  )
}

// Custom hooks
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context.auth
}

export function useMetrics() {
  const context = useContext(MetricsContext)
  if (!context) {
    throw new Error("useMetrics must be used within MetricsProvider")
  }
  return context
}
