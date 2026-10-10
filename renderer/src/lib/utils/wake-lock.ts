// Wake Lock API utility for keeping screen active during eye tracking
export class WakeLockManager {
  private wakeLock: WakeLockSentinel | null = null
  private isSupported = false

  constructor() {
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      this.isSupported = true
    }
  }

  async request(): Promise<boolean> {
    if (!this.isSupported) {
      console.log("[oLo] Wake Lock API not supported")
      return false
    }

    try {
      this.wakeLock = await navigator.wakeLock.request("screen")
      console.log("[oLo] Wake Lock acquired")

      this.wakeLock.addEventListener("release", () => {
        console.log("[oLo] Wake Lock released")
      })

      return true
    } catch (err) {
      console.error("[oLo] Failed to acquire Wake Lock:", err)
      return false
    }
  }

  async release(): Promise<void> {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release()
        this.wakeLock = null
        console.log("[oLo] Wake Lock manually released")
      } catch (err) {
        console.error("[oLo] Failed to release Wake Lock:", err)
      }
    }
  }

  isActive(): boolean {
    return this.wakeLock !== null && !this.wakeLock.released
  }

  // Re-acquire wake lock when page becomes visible
  async reacquire(): Promise<boolean> {
    if (this.isSupported && !this.isActive()) {
      return await this.request()
    }
    return false
  }
}
