/**
 * Metrics Throttle Manager
 *
 * Optimizes metric updates - only blink rate updates frequently,
 * other metrics are throttled to reduce processing load
 */

export interface ThrottledMetrics {
  // High frequency (every frame)
  blinkRate: number
  eyeClosure: number

  // Medium frequency (every 500ms)
  attention: number
  strain: number
  tiredness: number

  // Low frequency (every 2 seconds)
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

export class MetricsThrottle {
  private lastMediumUpdate = 0
  private lastLowUpdate = 0
  private readonly MEDIUM_INTERVAL = 500 // 500ms
  private readonly LOW_INTERVAL = 2000 // 2 seconds

  private cachedMediumMetrics: Partial<ThrottledMetrics> = {}
  private cachedLowMetrics: Partial<ThrottledMetrics> = {}

  shouldUpdateMedium(now: number): boolean {
    if (now - this.lastMediumUpdate >= this.MEDIUM_INTERVAL) {
      this.lastMediumUpdate = now
      return true
    }
    return false
  }

  shouldUpdateLow(now: number): boolean {
    if (now - this.lastLowUpdate >= this.LOW_INTERVAL) {
      this.lastLowUpdate = now
      return true
    }
    return false
  }

  updateMediumMetrics(metrics: Partial<ThrottledMetrics>) {
    this.cachedMediumMetrics = { ...this.cachedMediumMetrics, ...metrics }
  }

  updateLowMetrics(metrics: Partial<ThrottledMetrics>) {
    this.cachedLowMetrics = { ...this.cachedLowMetrics, ...metrics }
  }

  getMediumMetrics(): Partial<ThrottledMetrics> {
    return this.cachedMediumMetrics
  }

  getLowMetrics(): Partial<ThrottledMetrics> {
    return this.cachedLowMetrics
  }

  reset() {
    this.lastMediumUpdate = 0
    this.lastLowUpdate = 0
    this.cachedMediumMetrics = {}
    this.cachedLowMetrics = {}
  }
}
