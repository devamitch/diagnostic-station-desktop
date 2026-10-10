// Service Worker registration and management with graceful fallback
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private isSupported = false

  constructor() {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      this.isSupported = true
    }
  }

  async register(): Promise<boolean> {
    if (!this.isSupported) {
      console.log("[oLo] Service Worker not supported - continuing without it")
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      console.log("[oLo] Service Worker registered:", this.registration.scope)

      // Handle updates
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration?.installing
        console.log("[oLo] Service Worker update found")

        newWorker?.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("[oLo] New Service Worker available")
          }
        })
      })

      return true
    } catch (err) {
      console.warn("[oLo] Service Worker registration failed - app will work without it:", err)
      return false
    }
  }

  async unregister(): Promise<boolean> {
    if (this.registration) {
      try {
        return await this.registration.unregister()
      } catch (err) {
        console.warn("[oLo] Service Worker unregister failed:", err)
        return false
      }
    }
    return false
  }

  async sync(tag: string): Promise<void> {
    if (this.registration && "sync" in this.registration) {
      try {
        await (this.registration as any).sync.register(tag)
        console.log("[oLo] Background sync registered:", tag)
      } catch (err) {
        console.warn("[oLo] Background sync not available:", err)
      }
    }
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration
  }

  isServiceWorkerSupported(): boolean {
    return this.isSupported
  }
}
