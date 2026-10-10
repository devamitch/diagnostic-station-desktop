import { create } from "zustand"
import { dataManager } from "./data-manager"

export interface EyeMetrics {
  timestamp: number
  blinkRate: number
  eyeClosure: number
  attention: number
  strain: number
  tiredness: number
  eyeAge: number
  faceAge: number
  aspectRatio: number
  pupilDilation: number
  squintIntensity: number
  dryness: number
  redness: number
  wrinkles: number
  distance: number
}

export interface CompressedMetrics {
  t: number // timestamp
  b: number // blinkRate
  c: number // eyeClosure
  a: number // attention
  s: number // strain
  ti: number // tiredness
}

export interface MetricsState {
  // Current real-time metrics (updated frequently)
  currentMetrics: EyeMetrics | null

  // In-memory cache (last 1000 points for quick access)
  metricsCache: CompressedMetrics[]

  // UI state
  isTracking: boolean
  isCameraActive: boolean
  isBackgroundMode: boolean
  wakeLockActive: boolean
  serviceWorkerReady: boolean

  // Settings
  performanceMode: "quality" | "balanced" | "performance"
  maxCacheSize: number
  updateInterval: number

  // Actions
  setCurrentMetrics: (metrics: EyeMetrics | null) => void
  addMetricsPoint: (metrics: CompressedMetrics) => Promise<void>
  getMetricsHistory: (limit?: number) => Promise<CompressedMetrics[]>
  setTracking: (isTracking: boolean) => void
  setCameraActive: (isActive: boolean) => void
  setBackgroundMode: (isBackground: boolean) => void
  setWakeLockActive: (isActive: boolean) => void
  setServiceWorkerReady: (isReady: boolean) => void
  setPerformanceMode: (mode: "quality" | "balanced" | "performance") => void
  clearAllMetrics: () => Promise<void>
  pruneOldData: (maxAge: number) => Promise<void>
}

export const compressMetrics = (metrics: EyeMetrics | null): CompressedMetrics | null => {
  if (!metrics) return null

  return {
    t: metrics.timestamp || Date.now(),
    b: Math.round((metrics.blinkRate || 0) * 10) / 10,
    c: Math.round((metrics.eyeClosure || 0) * 100) / 100,
    a: Math.round((metrics.attention || 0) * 100) / 100,
    s: Math.round((metrics.strain || 0) * 10) / 10,
    ti: Math.round((metrics.tiredness || 0) * 10) / 10,
  }
}

export const decompressMetrics = (compressed: CompressedMetrics | null): Partial<EyeMetrics> | null => {
  if (!compressed) return null

  return {
    timestamp: compressed.t || Date.now(),
    blinkRate: compressed.b || 0,
    eyeClosure: compressed.c || 0,
    attention: compressed.a || 0,
    strain: compressed.s || 0,
    tiredness: compressed.ti || 0,
  }
}

export const useMetricsStore = create<MetricsState>((set, get) => ({
  // Initial state
  currentMetrics: null,
  metricsCache: [],
  isTracking: false,
  isCameraActive: false,
  isBackgroundMode: false,
  wakeLockActive: false,
  serviceWorkerReady: false,
  performanceMode: "balanced",
  maxCacheSize: 1000,
  updateInterval: 1000,

  // Actions
  setCurrentMetrics: (metrics) => {
    set({ currentMetrics: metrics })
  },

  addMetricsPoint: async (metrics) => {
    if (!metrics) return

    // Add to cache
    set((state) => {
      const newCache = [...state.metricsCache, metrics]
      if (newCache.length > state.maxCacheSize) {
        return { metricsCache: newCache.slice(-state.maxCacheSize) }
      }
      return { metricsCache: newCache }
    })

    // Save to IndexedDB asynchronously
    try {
      await dataManager.saveMetrics(metrics)
    } catch (error) {
      console.error("[oLo Metrics] Failed to save to IndexedDB:", error)
    }
  },

  getMetricsHistory: async (limit = 1000) => {
    try {
      const dbMetrics = await dataManager.getRecentMetrics(limit)
      return Array.isArray(dbMetrics) && dbMetrics.length > 0 ? dbMetrics : get().metricsCache
    } catch (error) {
      console.error("[oLo Metrics] Failed to load from IndexedDB:", error)
      return get().metricsCache || []
    }
  },

  setTracking: (isTracking) => set({ isTracking }),
  setCameraActive: (isActive) => set({ isCameraActive: isActive }),
  setBackgroundMode: (isBackground) => set({ isBackgroundMode: isBackground }),
  setWakeLockActive: (isActive) => set({ wakeLockActive: isActive }),
  setServiceWorkerReady: (isReady) => set({ serviceWorkerReady: isReady }),
  setPerformanceMode: (mode) => set({ performanceMode: mode }),

  clearAllMetrics: async () => {
    set({ metricsCache: [], currentMetrics: null })
    try {
      await dataManager.clearAllData()
    } catch (error) {
      console.error("[oLo Metrics] Failed to clear IndexedDB:", error)
    }
  },

  pruneOldData: async (maxAge) => {
    const cutoff = Date.now() - maxAge

    // Prune cache
    set((state) => ({
      metricsCache: (state.metricsCache || []).filter((m) => (m?.t || 0) > cutoff),
    }))

    // Prune IndexedDB
    try {
      const allMetrics = await dataManager.getRecentMetrics(100000)
      const oldMetrics = (allMetrics || []).filter((m) => (m?.t || 0) <= cutoff)
      console.log(`[oLo Metrics] Pruned ${oldMetrics.length} old records`)
    } catch (error) {
      console.error("[oLo Metrics] Failed to prune IndexedDB:", error)
    }
  },
}))
