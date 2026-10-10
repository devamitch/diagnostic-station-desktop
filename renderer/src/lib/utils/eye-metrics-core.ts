// Core eye metrics computation utilities - consolidated to avoid module resolution issues

export type LowMedHigh = "low" | "medium" | "high"

export interface EyeMetrics {
  timestamp: string
  blinkRate: number
  perClose: number
  perclos?: number
  attentionFrac: number
  strainLevelIdx: 0 | 1 | 2
  strainText: string
  tiredText: string
  attBinary: 0 | 1
  eyeAspectRatio: number
  pupilDilation: number
  squintIntensity: number
  darkCircleScore?: number
  tirednessScore?: number
  eyeAgeIndex?: number
  eyeAge: number
  faceAge: number
  drynessLevel?: LowMedHigh
  rednessLevel?: LowMedHigh
  wrinkleLevel?: LowMedHigh
  distanceLevel?: LowMedHigh
  _debug?: {
    dryness?: {
      blinkPerMin?: number
      incompleteFrac?: number
      longestIBI?: number
      reasonSkipped?: string
    }
    redness?: { rIdx?: number; scleraPx?: number; reasonSkipped?: string }
    wrinkles?: { edgeDensity?: number; reasonSkipped?: string }
    distance?: { cm?: number; reasonSkipped?: string }
  }
}

export type Landmark = { x: number; y: number; z?: number; visibility?: number }
export type NormalizedLandmarks = Landmark[]
export type IrisPack = { leftIris?: NormalizedLandmarks; rightIris?: NormalizedLandmarks }

export type FaceContext = {
  ts: number
  video: HTMLVideoElement
  canvas2d: CanvasRenderingContext2D
  faceLandmarks?: NormalizedLandmarks
  iris?: IrisPack
  yawDeg?: number
  rollDeg?: number
  pitchDeg?: number
  wearingGlassesHint?: boolean
  faceOcclusionScore?: number
  lightingLevel?: number
  mediaTrack?: MediaStreamTrack
  metrics?: { faceAge?: number; eyeAspectRatio?: number; squintIntensity?: number }
  faceAge?: number
  eyeAspectRatio?: number
  squintIntensity?: number
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

export class BlinkTracker {
  private state: "OPEN" | "CLOSING" | "CLOSED" | "OPENING" = "OPEN"
  private curBlinkMin: number = Number.POSITIVE_INFINITY
  private blinksTotal = 0
  private incompleteCount = 0
  private lastBlinkTime: number | null = null
  private blinkTimes: number[] = []
  private windowMs = 60_000

  constructor(
    private openThresh = 0.25,
    private closedThresh = 0.65,
    private incompleteThreshold = 0.5,
  ) {}

  update(perClose: number, ts: number) {
    const now = ts
    this.blinkTimes = this.blinkTimes.filter((t) => now - t <= this.windowMs)

    switch (this.state) {
      case "OPEN":
        if (perClose >= this.closedThresh) {
          this.state = "CLOSING"
          this.curBlinkMin = perClose
        }
        break
      case "CLOSING":
        this.curBlinkMin = Math.min(this.curBlinkMin, perClose)
        if (perClose >= this.closedThresh) this.state = "CLOSED"
        else if (perClose <= this.openThresh) this.state = "OPEN"
        break
      case "CLOSED":
        this.curBlinkMin = Math.min(this.curBlinkMin, perClose)
        if (perClose <= this.openThresh) {
          this.blinksTotal++
          if (this.curBlinkMin > this.incompleteThreshold) this.incompleteCount++
          this.lastBlinkTime = now
          this.blinkTimes.push(now)
          this.state = "OPENING"
        }
        break
      case "OPENING":
        if (perClose <= this.openThresh) this.state = "OPEN"
        else if (perClose >= this.closedThresh) this.state = "CLOSED"
        break
    }
  }

  getBlinkRatePerMin(nowMs: number) {
    const now = nowMs
    this.blinkTimes = this.blinkTimes.filter((t) => now - t <= this.windowMs)
    return (this.blinkTimes.length * 60_000) / this.windowMs
  }

  getIncompleteFrac() {
    return this.blinksTotal ? this.incompleteCount / this.blinksTotal : 0
  }

  getLastBlinkTs() {
    return this.lastBlinkTime
  }

  getBlinkTimes() {
    return this.blinkTimes.slice()
  }
}

// Eye Aspect Ratio calculation
export function calculateEAR(landmarks: NormalizedLandmarks, eyeIndices: number[]): number {
  if (!landmarks || landmarks.length < 468) return 0

  const [p1, p2, p3, p4, p5, p6] = eyeIndices.map((i) => landmarks[i])
  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return 0

  const vertical1 = Math.hypot(p2.x - p6.x, p2.y - p6.y)
  const vertical2 = Math.hypot(p3.x - p5.x, p3.y - p5.y)
  const horizontal = Math.hypot(p1.x - p4.x, p1.y - p4.y)

  return (vertical1 + vertical2) / (2.0 * horizontal)
}

// Calculate average EAR for both eyes
export function calculateAverageEAR(landmarks: NormalizedLandmarks): number {
  const leftEyeIndices = [33, 160, 158, 133, 153, 144]
  const rightEyeIndices = [362, 385, 387, 263, 373, 380]

  const leftEAR = calculateEAR(landmarks, leftEyeIndices)
  const rightEAR = calculateEAR(landmarks, rightEyeIndices)

  return (leftEAR + rightEAR) / 2
}

// Calculate percentage of eye closure
export function calculatePerClose(ear: number): number {
  const openEAR = 0.3
  const closedEAR = 0.1
  const perClose = clamp01((openEAR - ear) / (openEAR - closedEAR))
  return perClose
}

// Calculate attention fraction
export function calculateAttention(ear: number, threshold = 0.2): number {
  return ear > threshold ? 1 : 0
}

// Calculate strain level
export function calculateStrainLevel(
  blinkRate: number,
  ear: number,
  squint: number,
): { level: 0 | 1 | 2; text: string } {
  let score = 0

  if (blinkRate > 25) score += 1
  if (ear < 0.2) score += 1
  if (squint > 0.5) score += 1

  const level = Math.min(2, score) as 0 | 1 | 2
  const texts = ["Low", "Medium", "High"]

  return { level, text: texts[level] }
}

// Calculate squint intensity
export function calculateSquintIntensity(landmarks: NormalizedLandmarks): number {
  if (!landmarks || landmarks.length < 468) return 0

  const leftUpper = landmarks[159]
  const leftLower = landmarks[145]
  const rightUpper = landmarks[386]
  const rightLower = landmarks[374]

  if (!leftUpper || !leftLower || !rightUpper || !rightLower) return 0

  const leftHeight = Math.abs(leftUpper.y - leftLower.y)
  const rightHeight = Math.abs(rightUpper.y - rightLower.y)
  const avgHeight = (leftHeight + rightHeight) / 2

  const normalHeight = 0.03
  const squint = clamp01((normalHeight - avgHeight) / normalHeight)

  return squint
}

// Estimate pupil dilation (simplified)
export function estimatePupilDilation(landmarks: NormalizedLandmarks): number {
  if (!landmarks || landmarks.length < 468) return 0.5

  const leftIris = landmarks[468]
  const rightIris = landmarks[473]

  if (!leftIris || !rightIris) return 0.5

  return 0.5 // Placeholder - would need iris landmarks for accurate measurement
}

// Calculate tiredness score
export function calculateTirednessScore(
  blinkRate: number,
  ear: number,
  attentionFrac: number,
): { score: number; text: string } {
  let score = 0

  if (blinkRate < 10) score += 0.3
  if (ear < 0.22) score += 0.3
  if (attentionFrac < 0.7) score += 0.4

  score = clamp01(score)

  const text = score < 0.3 ? "Alert" : score < 0.6 ? "Slightly Tired" : "Very Tired"

  return { score, text }
}

// Estimate face age (simplified heuristic)
export function estimateFaceAge(landmarks: NormalizedLandmarks): number {
  if (!landmarks || landmarks.length < 468) return 30

  // Simplified age estimation based on facial proportions
  return 30 // Placeholder
}

// Estimate eye age
export function estimateEyeAge(faceAge: number, squint: number, blinkRate: number): number {
  let ageModifier = 0

  if (squint > 0.4) ageModifier += 5
  if (blinkRate < 10) ageModifier += 3

  return faceAge + ageModifier
}

// Placeholder functions for compatibility
export function computeDrynessLevel() {
  return { level: "low" as LowMedHigh, debug: {} }
}

export function computeRednessLevel() {
  return { level: "low" as LowMedHigh, debug: {} }
}

export function computeWrinkleLevel() {
  return { level: "low" as LowMedHigh, debug: {} }
}

export function computeDistanceLevel() {
  return { level: "medium" as LowMedHigh, debug: {} }
}

export function augmentEyeMetricsPerFrame(ctx: FaceContext, base: EyeMetrics): EyeMetrics {
  return base
}

export function calibrateFocalPxAtKnownDistance(): number | undefined {
  return undefined
}

export const DistanceCalib = {
  irisRealMM: 11.7,
  focalPxGuessHFOV(video: HTMLVideoElement, hfovDeg = 60) {
    const W = video.videoWidth
    return W / 2 / Math.tan((hfovDeg * Math.PI) / 180 / 2)
  },
}

export function longestInterBlinkSecInWindow(): number | undefined {
  return undefined
}
