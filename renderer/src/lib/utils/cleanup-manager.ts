/**
 * Centralized cleanup manager for the oLo application
 * Ensures all resources are properly released and no memory leaks occur
 */

export class CleanupManager {
  private intervals: Set<NodeJS.Timeout> = new Set()
  private timeouts: Set<NodeJS.Timeout> = new Set()
  private animationFrames: Set<number> = new Set()
  private eventListeners: Map<EventTarget, Map<string, EventListener>> = new Map()
  private mediaStreams: Set<MediaStream> = new Set()
  private dbConnections: Set<IDBDatabase> = new Set()

  /**
   * Register an interval for cleanup
   */
  registerInterval(interval: NodeJS.Timeout): NodeJS.Timeout {
    this.intervals.add(interval)
    return interval
  }

  /**
   * Register a timeout for cleanup
   */
  registerTimeout(timeout: NodeJS.Timeout): NodeJS.Timeout {
    this.timeouts.add(timeout)
    return timeout
  }

  /**
   * Register an animation frame for cleanup
   */
  registerAnimationFrame(frame: number): number {
    this.animationFrames.add(frame)
    return frame
  }

  /**
   * Register an event listener for cleanup
   */
  registerEventListener(target: EventTarget, event: string, listener: EventListener): void {
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, new Map())
    }
    this.eventListeners.get(target)!.set(event, listener)
    target.addEventListener(event, listener)
  }

  /**
   * Register a media stream for cleanup
   */
  registerMediaStream(stream: MediaStream): MediaStream {
    this.mediaStreams.add(stream)
    return stream
  }

  /**
   * Register a database connection for cleanup
   */
  registerDBConnection(db: IDBDatabase): IDBDatabase {
    this.dbConnections.add(db)
    return db
  }

  /**
   * Clear a specific interval
   */
  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval)
    this.intervals.delete(interval)
  }

  /**
   * Clear a specific timeout
   */
  clearTimeout(timeout: NodeJS.Timeout): void {
    clearTimeout(timeout)
    this.timeouts.delete(timeout)
  }

  /**
   * Cancel a specific animation frame
   */
  cancelAnimationFrame(frame: number): void {
    cancelAnimationFrame(frame)
    this.animationFrames.delete(frame)
  }

  /**
   * Remove a specific event listener
   */
  removeEventListener(target: EventTarget, event: string): void {
    const listeners = this.eventListeners.get(target)
    if (listeners) {
      const listener = listeners.get(event)
      if (listener) {
        target.removeEventListener(event, listener)
        listeners.delete(event)
      }
      if (listeners.size === 0) {
        this.eventListeners.delete(target)
      }
    }
  }

  /**
   * Stop a specific media stream
   */
  stopMediaStream(stream: MediaStream): void {
    stream.getTracks().forEach((track) => track.stop())
    this.mediaStreams.delete(stream)
  }

  /**
   * Close a specific database connection
   */
  closeDBConnection(db: IDBDatabase): void {
    db.close()
    this.dbConnections.delete(db)
  }

  /**
   * Clean up all registered resources
   */
  cleanupAll(): void {
    // Clear all intervals
    this.intervals.forEach((interval) => clearInterval(interval))
    this.intervals.clear()

    // Clear all timeouts
    this.timeouts.forEach((timeout) => clearTimeout(timeout))
    this.timeouts.clear()

    // Cancel all animation frames
    this.animationFrames.forEach((frame) => cancelAnimationFrame(frame))
    this.animationFrames.clear()

    // Remove all event listeners
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, event) => {
        target.removeEventListener(event, listener)
      })
    })
    this.eventListeners.clear()

    // Stop all media streams
    this.mediaStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop())
    })
    this.mediaStreams.clear()

    // Close all database connections
    this.dbConnections.forEach((db) => db.close())
    this.dbConnections.clear()

    console.log("[oLo] All resources cleaned up successfully")
  }

  /**
   * Get cleanup statistics
   */
  getStats() {
    return {
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      animationFrames: this.animationFrames.size,
      eventListeners: Array.from(this.eventListeners.values()).reduce((sum, listeners) => sum + listeners.size, 0),
      mediaStreams: this.mediaStreams.size,
      dbConnections: this.dbConnections.size,
    }
  }
}

// Global cleanup manager instance
let globalCleanupManager: CleanupManager | null = null

export function getCleanupManager(): CleanupManager {
  if (!globalCleanupManager) {
    globalCleanupManager = new CleanupManager()
  }
  return globalCleanupManager
}

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (globalCleanupManager) {
      globalCleanupManager.cleanupAll()
    }
  })
}
