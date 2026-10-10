/**
 * Media Buffer Manager
 * Handles media stream buffering and optimization
 */

export interface BufferStats {
  bufferedFrames: number
  droppedFrames: number
  bufferHealth: "good" | "warning" | "critical"
  averageFrameTime: number
}

export class MediaBufferManager {
  private frameBuffer: ImageData[] = []
  private maxBufferSize = 30 // ~1 second at 30fps
  private droppedFrames = 0
  private frameTimestamps: number[] = []
  private lastProcessedTime = 0

  constructor(maxBufferSize = 30) {
    this.maxBufferSize = maxBufferSize
  }

  /**
   * Add frame to buffer
   */
  public addFrame(imageData: ImageData): boolean {
    const now = performance.now()

    // Drop frame if buffer is full
    if (this.frameBuffer.length >= this.maxBufferSize) {
      this.droppedFrames++
      this.frameBuffer.shift() // Remove oldest frame
      console.warn("[Buffer] Frame dropped - buffer full")
    }

    this.frameBuffer.push(imageData)
    this.frameTimestamps.push(now)

    // Keep only recent timestamps for average calculation
    if (this.frameTimestamps.length > 60) {
      this.frameTimestamps.shift()
    }

    return true
  }

  /**
   * Get next frame from buffer
   */
  public getNextFrame(): ImageData | null {
    if (this.frameBuffer.length === 0) return null

    this.lastProcessedTime = performance.now()
    this.frameTimestamps.shift()
    return this.frameBuffer.shift() || null
  }

  /**
   * Get buffer statistics
   */
  public getStats(): BufferStats {
    const bufferedFrames = this.frameBuffer.length
    const bufferHealth =
      bufferedFrames > this.maxBufferSize * 0.8
        ? "critical"
        : bufferedFrames > this.maxBufferSize * 0.5
          ? "warning"
          : "good"

    const averageFrameTime = this.calculateAverageFrameTime()

    return {
      bufferedFrames,
      droppedFrames: this.droppedFrames,
      bufferHealth,
      averageFrameTime,
    }
  }

  /**
   * Calculate average frame processing time
   */
  private calculateAverageFrameTime(): number {
    if (this.frameTimestamps.length < 2) return 0

    const times: number[] = []
    for (let i = 1; i < this.frameTimestamps.length; i++) {
      times.push(this.frameTimestamps[i] - this.frameTimestamps[i - 1])
    }

    return times.reduce((a, b) => a + b, 0) / times.length
  }

  /**
   * Clear buffer
   */
  public clear(): void {
    this.frameBuffer = []
    this.frameTimestamps = []
    this.droppedFrames = 0
  }

  /**
   * Get buffer size
   */
  public getBufferSize(): number {
    return this.frameBuffer.length
  }

  /**
   * Check if buffer is healthy
   */
  public isHealthy(): boolean {
    return this.getStats().bufferHealth !== "critical"
  }

  /**
   * Reset dropped frames counter
   */
  public resetDroppedFrames(): void {
    this.droppedFrames = 0
  }
}
