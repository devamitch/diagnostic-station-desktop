/**
 * Unified store interface for backward compatibility
 * Combines auth and metrics stores into a single interface
 */

import { useAuthStore } from "./auth-store"
import { useMetricsStore, compressMetrics as compress, decompressMetrics as decompress } from "./metrics-store"

// Re-export types
export type { User } from "./auth-store"
export type { EyeMetrics, CompressedMetrics } from "./metrics-store"

// Re-export utility functions
export const compressMetrics = compress
export const decompressMetrics = decompress

/**
 * Unified store hook that combines auth and metrics
 * This maintains backward compatibility with existing code
 */
export function useStore() {
  const auth = useAuthStore()
  const metrics = useMetricsStore()

  return {
    // Auth state
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signOut: auth.signOut,
    setUser: auth.setUser,

    // Metrics state
    currentMetrics: metrics.currentMetrics,
    metricsHistory: metrics.metricsCache, // Map metricsCache to metricsHistory for backward compatibility
    setCurrentMetrics: metrics.setCurrentMetrics,
    addHistoryPoint: metrics.addMetricsPoint, // Map addMetricsPoint to addHistoryPoint
    clearHistory: metrics.clearAllMetrics, // Map clearAllMetrics to clearHistory
    pruneOldData: metrics.pruneOldData,
    getMetricsHistory: metrics.getMetricsHistory, // Add missing method

    // UI state
    isTracking: metrics.isTracking,
    isCameraActive: metrics.isCameraActive,
    isBackgroundMode: metrics.isBackgroundMode,
    wakeLockActive: metrics.wakeLockActive,
    serviceWorkerReady: metrics.serviceWorkerReady,
    setTracking: metrics.setTracking,
    setCameraActive: metrics.setCameraActive,
    setBackgroundMode: metrics.setBackgroundMode,
    setWakeLockActive: metrics.setWakeLockActive,
    setServiceWorkerReady: metrics.setServiceWorkerReady,

    // Settings
    performanceMode: metrics.performanceMode,
    setPerformanceMode: metrics.setPerformanceMode,
    maxHistorySize: metrics.maxCacheSize, // Map maxCacheSize to maxHistorySize
    updateInterval: metrics.updateInterval,
  }
}

// Selector-based hook for better performance
export function useStoreSelector<T>(selector: (state: ReturnType<typeof useStore>) => T): T {
  const store = useStore()
  return selector(store)
}
