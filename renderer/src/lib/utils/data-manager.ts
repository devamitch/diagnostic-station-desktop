import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { CompressedMetrics } from "./metrics-store"

interface OLoDBSchema extends DBSchema {
  metrics: {
    key: number
    value: CompressedMetrics
    indexes: { "by-timestamp": number }
  }
  sessions: {
    key: number
    value: {
      id: number
      startTime: number
      endTime: number
      totalBlinks: number
      avgAttention: number
    }
  }
}

class DataManager {
  private db: IDBPDatabase<OLoDBSchema> | null = null
  private readonly DB_NAME = "olo-eye-tracking"
  private readonly DB_VERSION = 1
  private readonly MAX_RECORDS = 50000 // Maximum records in IndexedDB

  async init() {
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      return
    }

    try {
      this.db = await openDB<OLoDBSchema>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Create metrics store
          if (!db.objectStoreNames.contains("metrics")) {
            const metricsStore = db.createObjectStore("metrics", {
              keyPath: "t",
            })
            metricsStore.createIndex("by-timestamp", "t")
          }

          // Create sessions store
          if (!db.objectStoreNames.contains("sessions")) {
            db.createObjectStore("sessions", {
              keyPath: "id",
              autoIncrement: true,
            })
          }
        },
      })
      console.log("[oLo] IndexedDB initialized")
    } catch (error) {
      console.error("[oLo] Failed to initialize IndexedDB:", error)
    }
  }

  async saveMetrics(metrics: CompressedMetrics) {
    if (!this.db) return

    try {
      await this.db.add("metrics", metrics)

      // Prune old data if exceeding max records
      const count = await this.db.count("metrics")
      if (count > this.MAX_RECORDS) {
        await this.pruneOldRecords(count - this.MAX_RECORDS)
      }
    } catch (error) {
      // Ignore duplicate key errors
      if (!(error instanceof Error && error.name === "ConstraintError")) {
        console.error("[oLo] Failed to save metrics:", error)
      }
    }
  }

  async getMetrics(startTime: number, endTime: number): Promise<CompressedMetrics[]> {
    if (!this.db) return []

    try {
      const tx = this.db.transaction("metrics", "readonly")
      const index = tx.store.index("by-timestamp")
      const range = IDBKeyRange.bound(startTime, endTime)
      return await index.getAll(range)
    } catch (error) {
      console.error("[oLo] Failed to get metrics:", error)
      return []
    }
  }

  async getRecentMetrics(count: number): Promise<CompressedMetrics[]> {
    if (!this.db) return []

    try {
      const tx = this.db.transaction("metrics", "readonly")
      const index = tx.store.index("by-timestamp")
      const cursor = await index.openCursor(null, "prev")
      const results: CompressedMetrics[] = []

      let current = cursor
      while (current && results.length < count) {
        results.push(current.value)
        current = await current.continue()
      }

      return results.reverse()
    } catch (error) {
      console.error("[oLo] Failed to get recent metrics:", error)
      return []
    }
  }

  private async pruneOldRecords(deleteCount: number) {
    if (!this.db) return

    try {
      const tx = this.db.transaction("metrics", "readwrite")
      const index = tx.store.index("by-timestamp")
      const cursor = await index.openCursor()

      let deleted = 0
      let current = cursor
      while (current && deleted < deleteCount) {
        await current.delete()
        deleted++
        current = await current.continue()
      }

      console.log(`[oLo] Pruned ${deleted} old records`)
    } catch (error) {
      console.error("[oLo] Failed to prune records:", error)
    }
  }

  async clearAllData() {
    if (!this.db) return

    try {
      await this.db.clear("metrics")
      await this.db.clear("sessions")
      console.log("[oLo] All data cleared")
    } catch (error) {
      console.error("[oLo] Failed to clear data:", error)
    }
  }

  async getStorageSize(): Promise<{ records: number; estimatedMB: number }> {
    if (!this.db) return { records: 0, estimatedMB: 0 }

    try {
      const count = await this.db.count("metrics")
      // Estimate: each compressed metric is ~50 bytes
      const estimatedMB = (count * 50) / (1024 * 1024)
      return { records: count, estimatedMB }
    } catch (error) {
      console.error("[oLo] Failed to get storage size:", error)
      return { records: 0, estimatedMB: 0 }
    }
  }
}

export const dataManager = new DataManager()
