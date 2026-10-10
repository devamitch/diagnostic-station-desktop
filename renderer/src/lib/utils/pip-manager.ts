/**
 * Picture-in-Picture Manager
 * Handles PiP mode to keep video tracking active when tab is minimized
 */

export class PictureInPictureManager {
  private video: HTMLVideoElement | null = null
  private pipWindow: PictureInPictureWindow | null = null
  private isSupported = false

  constructor() {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      this.isSupported = "pictureInPictureEnabled" in document
    }
  }

  /**
   * Check if PiP is supported
   */
  public isAvailable(): boolean {
    return this.isSupported
  }

  /**
   * Enter Picture-in-Picture mode
   */
  public async enter(videoElement: HTMLVideoElement): Promise<boolean> {
    if (!this.isSupported || !videoElement) {
      console.warn("[PiP] Picture-in-Picture not supported or video element not provided")
      return false
    }

    try {
      // Check if already in PiP
      if (document.pictureInPictureElement) {
        console.log("[PiP] Already in Picture-in-Picture mode")
        return true
      }

      this.video = videoElement
      this.pipWindow = await videoElement.requestPictureInPicture()

      console.log("[PiP] Entered Picture-in-Picture mode")

      // Listen for PiP window close
      this.pipWindow.addEventListener("resize", this.handleResize)
      videoElement.addEventListener("leavepictureinpicture", this.handleLeave)

      return true
    } catch (error) {
      console.error("[PiP] Failed to enter Picture-in-Picture:", error)
      return false
    }
  }

  /**
   * Exit Picture-in-Picture mode
   */
  public async exit(): Promise<void> {
    if (!document.pictureInPictureElement) {
      return
    }

    try {
      await document.exitPictureInPicture()
      console.log("[PiP] Exited Picture-in-Picture mode")
    } catch (error) {
      console.error("[PiP] Failed to exit Picture-in-Picture:", error)
    }
  }

  /**
   * Toggle Picture-in-Picture mode
   */
  public async toggle(videoElement: HTMLVideoElement): Promise<boolean> {
    if (document.pictureInPictureElement) {
      await this.exit()
      return false
    } else {
      return await this.enter(videoElement)
    }
  }

  /**
   * Check if currently in PiP mode
   */
  public isActive(): boolean {
    return document.pictureInPictureElement !== null
  }

  /**
   * Get PiP window dimensions
   */
  public getDimensions(): { width: number; height: number } | null {
    if (!this.pipWindow) return null
    return {
      width: this.pipWindow.width,
      height: this.pipWindow.height,
    }
  }

  private handleResize = (event: Event) => {
    const pipWindow = event.target as PictureInPictureWindow
    console.log(`[PiP] Window resized: ${pipWindow.width}x${pipWindow.height}`)
  }

  private handleLeave = () => {
    console.log("[PiP] Left Picture-in-Picture mode")
    this.cleanup()
  }

  private cleanup() {
    if (this.pipWindow) {
      this.pipWindow.removeEventListener("resize", this.handleResize)
    }
    if (this.video) {
      this.video.removeEventListener("leavepictureinpicture", this.handleLeave)
    }
    this.pipWindow = null
    this.video = null
  }

  /**
   * Cleanup resources
   */
  public destroy() {
    this.exit()
    this.cleanup()
  }
}
