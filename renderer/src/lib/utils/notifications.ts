// Notification system for eye tracking alerts

export type NotificationType = "info" | "warning" | "error" | "success"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  duration?: number
}

class NotificationManager {
  private listeners: Set<(notification: Notification) => void> = new Set()
  private notifications: Notification[] = []

  subscribe(callback: (notification: Notification) => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notify(type: NotificationType, title: string, message: string, duration = 5000) {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      duration,
    }

    this.notifications.push(notification)
    this.listeners.forEach((listener) => listener(notification))

    // Request browser notification permission if not granted
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      })
    }

    return notification.id
  }

  info(title: string, message: string) {
    return this.notify("info", title, message)
  }

  warning(title: string, message: string) {
    return this.notify("warning", title, message)
  }

  error(title: string, message: string) {
    return this.notify("error", title, message, 8000)
  }

  success(title: string, message: string) {
    return this.notify("success", title, message)
  }

  async requestPermission() {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }
    return false
  }

  getNotifications() {
    return this.notifications
  }

  clear() {
    this.notifications = []
  }
}

export const notificationManager = new NotificationManager()
