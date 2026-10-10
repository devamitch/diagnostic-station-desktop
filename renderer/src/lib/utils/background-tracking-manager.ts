/**
 * Background Tracking Manager
 * Ensures eye tracking continues even when browser is minimized
 * Uses PiP mode, Service Worker, and Page Visibility API
 */

import { PictureInPictureManager } from "./pip-manager"
import { ServiceWorkerManager } from "./service-worker-manager"
import { getNotificationManager } from "./notification-manager"

export class BackgroundTrackingManager {
  private pipManager: PictureInPictureManager
  private swManager: ServiceWorkerManager
  private notificationManager = getNotificationManager()
  private isTracking = false
  private videoElement: HTMLVideoElement | null = null
  private onTrackingCallback: (() => void) | null = null
  private visibilityCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.pipManager = new PictureInPictureManager()
    this.swManager = new ServiceWorkerManager()
  }

  /**
   * Initialize background tracking
   */
  async init(videoElement: HTMLVideoElement, onTracking?: () => void): Promise<void> {
    this.videoElement = videoElement
    this.onTrackingCallback = onTracking || null

    // Register service worker
    await this.swManager.register()

    // Request notification permission
    await this.notificationManager.requestPermission()

    // Setup visibility change listener
    this.setupVisibilityListener()

    console.log("[Background Tracking] Initialized")
  }

  /**
   * Start background tracking
   */
  async start(): Promise<void> {
    if (this.isTracking) return

    this.isTracking = true

    // Start periodic check for background mode
    this.visibilityCheckInterval = setInterval(() => {
      if (document.visibilityState === "hidden" && this.videoElement) {
        this.ensurePiPMode()
      }
    }, 5000) // Check every 5 seconds

    console.log("[Background Tracking] Started")
  }

  /**
   * Stop background tracking
   */
  async stop(): Promise<void> {
    this.isTracking = false

    if (this.visibilityCheckInterval) {
      clearInterval(this.visibilityCheckInterval)
      this.visibilityCheckInterval = null
    }

    await this.pipManager.exit()

    console.log("[Background Tracking] Stopped")
  }

  /**
   * Setup visibility change listener
   */
  private setupVisibilityListener(): void {
    if (typeof document === "undefined") return

    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "hidden") {
        console.log("[Background Tracking] Tab hidden - enabling background mode")
        await this.ensurePiPMode()
        this.onTrackingCallback?.()
      } else {
        console.log("[Background Tracking] Tab visible - normal mode")
      }
    })
  }

  /**
   * Ensure PiP mode is active
   */
  private async ensurePiPMode(): Promise<void> {
    if (!this.videoElement || !this.isTracking) return

    if (!this.pipManager.isActive() && this.pipManager.isAvailable()) {
      const success = await this.pipManager.enter(this.videoElement)
      if (success) {
        console.log("[Background Tracking] PiP mode activated for background tracking")

        // Send notification
        this.notificationManager.notify({
          title: "oLo Eye Tracking",
          body: "Background tracking active - Monitoring your eye health",
          icon: "/icon-192.png",
        })
      }
    }
  }

  /**
   * Check if background tracking is active
   */
  isActive(): boolean {
    return this.isTracking
  }

  /**
   * Check if PiP is active
   */
  isPiPActive(): boolean {
    return this.pipManager.isActive()
  }

  /**
   * Check if service worker is ready
   */
  isServiceWorkerReady(): boolean {
    return this.swManager.getRegistration() !== null
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop()
    this.pipManager.destroy()
  }
}
