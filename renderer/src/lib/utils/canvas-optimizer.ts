/**
 * Canvas Optimizer
 * Optimizes canvas rendering for better performance
 */

export class CanvasOptimizer {
  private offscreenCanvas: OffscreenCanvas | null = null
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null
  private isOffscreenSupported = false

  constructor() {
    if (typeof window !== "undefined") {
      this.isOffscreenSupported = typeof OffscreenCanvas !== "undefined"
    }
  }

  /**
   * Initialize offscreen canvas for better performance
   */
  public initOffscreen(width: number, height: number): boolean {
    if (!this.isOffscreenSupported) {
      console.warn("[Canvas] OffscreenCanvas not supported, using regular canvas")
      return false
    }

    try {
      this.offscreenCanvas = new OffscreenCanvas(width, height)
      this.offscreenCtx = this.offscreenCanvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
      }) as OffscreenCanvasRenderingContext2D

      console.log("[Canvas] Offscreen canvas initialized")
      return true
    } catch (error) {
      console.error("[Canvas] Failed to initialize offscreen canvas:", error)
      return false
    }
  }

  /**
   * Get optimized canvas context
   */
  public getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    return canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    })
  }

  /**
   * Transfer offscreen canvas to main canvas
   */
  public transferToCanvas(targetCanvas: HTMLCanvasElement): void {
    if (!this.offscreenCanvas) return

    const ctx = targetCanvas.getContext("2d")
    if (!ctx) return

    try {
      const bitmap = this.offscreenCanvas.transferToImageBitmap()
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
    } catch (error) {
      console.error("[Canvas] Failed to transfer offscreen canvas:", error)
    }
  }

  /**
   * Resize canvas with proper scaling
   */
  public resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number, devicePixelRatio = 1): void {
    const scaledWidth = width * devicePixelRatio
    const scaledHeight = height * devicePixelRatio

    if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
      canvas.width = scaledWidth
      canvas.height = scaledHeight
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.scale(devicePixelRatio, devicePixelRatio)
      }
    }
  }

  /**
   * Clear canvas efficiently
   */
  public clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height)
  }

  /**
   * Batch draw operations for better performance
   */
  public batchDraw(ctx: CanvasRenderingContext2D, operations: Array<() => void>): void {
    ctx.save()
    operations.forEach((op) => op())
    ctx.restore()
  }

  /**
   * Get offscreen context for drawing
   */
  public getOffscreenContext(): OffscreenCanvasRenderingContext2D | null {
    return this.offscreenCtx
  }

  /**
   * Check if offscreen canvas is supported
   */
  public isOffscreenAvailable(): boolean {
    return this.isOffscreenSupported && this.offscreenCanvas !== null
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.offscreenCanvas = null
    this.offscreenCtx = null
  }
}
