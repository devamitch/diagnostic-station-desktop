"use client"

/**
 * Notification Manager
 *
 * Handles browser notifications for eye strain alerts
 * Integrates with Service Worker for background notifications
 */

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  data?: any
}

export class NotificationManager {
  private permission: NotificationPermission = "default"
  private lastNotificationTime = 0
  private readonly MIN_NOTIFICATION_INTERVAL = 300000 // 5 minutes between notifications
  private notificationQueue: NotificationOptions[] = []

  constructor() {
    if (typeof window !== "undefined" && "Notification" in window) {
      this.permission = Notification.permission
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("[Notification] Notifications not supported")
      return false
    }

    if (this.permission === "granted") {
      return true
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === "granted"
    } catch (error) {
      console.error("[Notification] Failed to request permission:", error)
      return false
    }
  }

  async notify(options: NotificationOptions): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false
    }

    // Check if enough time has passed since last notification
    const now = Date.now()
    if (now - this.lastNotificationTime < this.MIN_NOTIFICATION_INTERVAL) {
      console.log("[Notification] Throttled - too soon since last notification")
      return false
    }

    // Request permission if not granted
    if (this.permission !== "granted") {
      const granted = await this.requestPermission()
      if (!granted) {
        console.warn("[Notification] Permission not granted")
        return false
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/icon-192.png",
        badge: options.badge || "/icon-192.png",
        tag: options.tag || "olo-eye-strain",
        requireInteraction: options.requireInteraction ?? true,
        silent: options.silent ?? false,
        data: options.data,
      })

      this.lastNotificationTime = now

      // Auto-close after 10 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 10000)
      }

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        notification.close()
        if (options.data?.url) {
          window.location.href = options.data.url
        }
      }

      console.log("[Notification] Notification sent:", options.title)
      return true
    } catch (error) {
      console.error("[Notification] Failed to create notification:", error)
      return false
    }
  }

  async notifyEyeStrain(
    strainLevel: string,
    metrics: {
      blinkRate: number
      eyeClosure: number
      tiredness: string
    },
  ): Promise<boolean> {
    const messages = {
      High: {
        title: "High Eye Strain Detected",
        body: `Take a break! Blink rate: ${metrics.blinkRate.toFixed(1)}/min. Consider the 20-20-20 rule.`,
      },
      "Very High": {
        title: "Very High Eye Strain!",
        body: `Immediate break recommended! Your eyes need rest. Blink rate: ${metrics.blinkRate.toFixed(1)}/min.`,
      },
      Moderate: {
        title: "⚡ Moderate Eye Strain",
        body: `Your eyes are getting tired. Take a short break soon. Blink rate: ${metrics.blinkRate.toFixed(1)}/min.`,
      },
    }

    const message = messages[strainLevel as keyof typeof messages]
    if (!message) return false

    return this.notify({
      ...message,
      tag: `eye-strain-${strainLevel.toLowerCase()}`,
      requireInteraction: strainLevel === "Very High",
      data: {
        strainLevel,
        metrics,
        timestamp: Date.now(),
      },
    })
  }

  async notifyTiredness(tirednessLevel: string): Promise<boolean> {
    if (tirednessLevel !== "High" && tirednessLevel !== "Very High") {
      return false
    }

    return this.notify({
      title: "High Tiredness Detected",
      body: "You seem tired. Consider taking a longer break or getting some rest.",
      tag: "tiredness-alert",
      requireInteraction: false,
      data: {
        tirednessLevel,
        timestamp: Date.now(),
      },
    })
  }

  async notifyLowBlinkRate(blinkRate: number): Promise<boolean> {
    if (blinkRate >= 10) return false // Normal blink rate is 15-20/min

    return this.notify({
      title: "Low Blink Rate Alert",
      body: `Your blink rate is ${blinkRate.toFixed(1)}/min. Remember to blink more often!`,
      tag: "low-blink-rate",
      requireInteraction: false,
      data: {
        blinkRate,
        timestamp: Date.now(),
      },
    })
  }

  getPermission(): NotificationPermission {
    return this.permission
  }

  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window
  }
}

// Singleton instance
let notificationManager: NotificationManager | null = null

export function getNotificationManager(): NotificationManager {
  if (!notificationManager) {
    notificationManager = new NotificationManager()
  }
  return notificationManager
}
