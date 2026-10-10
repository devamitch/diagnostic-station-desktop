/**
 * Background Processor
 *
 * Manages continuous eye tracking even when tab is hidden/minimized
 * Uses Service Worker push notifications trick to keep processing alive
 */

export class BackgroundProcessor {
  private intervalId: NodeJS.Timeout | null = null
  private pushIntervalId: NodeJS.Timeout | null = null
  private isProcessing = false
  private registration: ServiceWorkerRegistration | null = null
  private readonly PUSH_INTERVAL = 5000 // Push notification every 5 seconds
  private readonly PROCESS_INTERVAL = 33 // ~30 FPS

  constructor() {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      this.initServiceWorker()
    }
  }

  private async initServiceWorker() {
    try {
      this.registration = await navigator.serviceWorker.ready

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "BACKGROUND_PROCESS_TRIGGER" || event.data.type === "CONTINUE_TRACKING") {
          console.log("[oLo] Background process trigger received from SW")
          // This keeps the processing alive
        }
      })

      console.log("[oLo] Background processor initialized with Service Worker")
    } catch (error) {
      console.error("[oLo] Failed to initialize background processor:", error)
    }
  }

  async start(processCallback: () => void) {
    if (this.isProcessing) {
      console.log("[oLo] Background processor already running")
      return
    }

    this.isProcessing = true
    console.log("[oLo] Starting background processor")

    // Start main processing loop
    this.intervalId = setInterval(() => {
      if (this.isProcessing) {
        processCallback()
      }
    }, this.PROCESS_INTERVAL)

    // Start push notification loop to keep processing alive in background
    if (this.registration) {
      this.pushIntervalId = setInterval(async () => {
        try {
          // Send a dummy push to service worker to trigger background activity
          await this.sendDummyPush()
        } catch (error) {
          console.error("[oLo] Failed to send dummy push:", error)
        }
      }, this.PUSH_INTERVAL)

      // Register periodic background sync if supported
      if ("periodicSync" in this.registration) {
        try {
          await (this.registration as any).periodicSync.register("eye-tracking-sync", {
            minInterval: 60 * 1000, // Minimum 1 minute
          })
          console.log("[oLo] Periodic background sync registered")
        } catch (error) {
          console.log("[oLo] Periodic sync not available:", error)
        }
      }
    }
  }

  stop() {
    console.log("[oLo] Stopping background processor")
    this.isProcessing = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    if (this.pushIntervalId) {
      clearInterval(this.pushIntervalId)
      this.pushIntervalId = null
    }

    // Unregister periodic sync
    if (this.registration && "periodicSync" in this.registration) {
      ;(this.registration as any).periodicSync
        .unregister("eye-tracking-sync")
        .catch((err: Error) => console.error("[oLo] Failed to unregister periodic sync:", err))
    }
  }

  private async sendDummyPush() {
    if (!this.registration || !this.registration.active) {
      return
    }

    // Send message to service worker to trigger push event handling
    this.registration.active.postMessage({
      type: "KEEP_ALIVE",
      timestamp: Date.now(),
    })
  }

  isRunning(): boolean {
    return this.isProcessing
  }
}
