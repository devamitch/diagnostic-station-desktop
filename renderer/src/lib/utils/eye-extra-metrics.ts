// eye-extra-metrics.ts - FIXED VERSION
// Lightweight, real-time heuristics for dryness, redness, wrinkles, and screen distance.

export type LowMedHigh = "low" | "medium" | "high"

declare global {
  interface EyeMetrics {
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
    proximityScore?: number
    batteryLevel?: number
    rednessScore?: number
    drynessScore?: number
    faceDetected?: boolean
    darkcircleScore?: number
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
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function toPx(p: Landmark, video: HTMLVideoElement) {
  return { x: p.x * video.videoWidth, y: p.y * video.videoHeight }
}

function drawPolyMask(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  ctx.beginPath()
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.closePath()
}

function estimateYawDeg(landmarks?: NormalizedLandmarks): number | undefined {
  if (!landmarks || landmarks.length < 468) return undefined
  const L = landmarks[33]
  const R = landmarks[263]
  const N = landmarks[1]
  if (!L || !R || !N) return undefined
  const dx = R.x - L.x
  const nx = N.x - (L.x + R.x) / 2
  return (nx / Math.max(1e-6, dx)) * 90
}

function eyeRegionConfidence(landmarks?: NormalizedLandmarks): number {
  if (!landmarks) return 0
  let vis = 0
  let cnt = 0
  for (const idx of [33, 133, 159, 145, 263, 362, 386, 374]) {
    const p = landmarks[idx]
    if (p?.visibility !== undefined) {
      vis += p.visibility
      cnt++
    }
  }
  return cnt ? Math.max(0, Math.min(1, vis / cnt)) : 0.7
}

type Range = { gte?: number; lt?: number }
type RangesLMH = { low: Range; medium: Range; high: Range }

function categorizeLMH(value: number, ranges: RangesLMH): LowMedHigh {
  const eps = 1e-6
  if (
    (ranges.high.gte === undefined || value + eps >= ranges.high.gte) &&
    (ranges.high.lt === undefined || value < ranges.high.lt - eps)
  )
    return "high"
  if (
    (ranges.medium.gte === undefined || value + eps >= ranges.medium.gte) &&
    (ranges.medium.lt === undefined || value < ranges.medium.lt - eps)
  )
    return "medium"
  return "low"
}

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

  setWindowMs(ms: number) {
    this.windowMs = ms
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

export function longestInterBlinkSecInWindow(blinkTimes: number[], windowMs = 60_000): number | undefined {
  const now = performance.now()
  const times = blinkTimes.filter((t) => now - t <= windowMs).sort((a, b) => a - b)
  if (times.length < 2) return undefined
  let maxIbi = 0
  for (let i = 1; i < times.length; i++) {
    const ibi = (times[i] - times[i - 1]) / 1000
    if (ibi > maxIbi) maxIbi = ibi
  }
  return maxIbi || undefined
}

export const DistanceCalib = {
  irisRealMM: 11.7,
  focalPxGuessHFOV(video: HTMLVideoElement, hfovDeg = 60) {
    const W = video.videoWidth
    return W / 2 / Math.tan((hfovDeg * Math.PI) / 180 / 2)
  },
}

function irisDiameterPx(iris?: NormalizedLandmarks): number | undefined {
  if (!iris || iris.length < 4) return undefined
  const xs = iris.map((p) => p.x)
  const ys = iris.map((p) => p.y)
  const dx = Math.max(...xs) - Math.min(...xs)
  const dy = Math.max(...ys) - Math.min(...ys)
  return (dx + dy) * 0.5
}

function interpupilPx(faceLandmarks?: NormalizedLandmarks): number | undefined {
  if (!faceLandmarks) return undefined
  const L = faceLandmarks[468] ?? faceLandmarks[33]
  const R = faceLandmarks[473] ?? faceLandmarks[263]
  if (!L || !R) return undefined
  return Math.hypot(R.x - L.x, R.y - L.y)
}

type CamKey = string
const FocalStore = {
  keyFor(track?: MediaStreamTrack): CamKey | null {
    try {
      if (!track?.getSettings) return null
      const s = track.getSettings()
      if (!s?.deviceId) return null
      const w = s.width ?? 0
      const h = s.height ?? 0
      return w && h ? `${s.deviceId}@${w}x${h}` : `${s.deviceId}`
    } catch {
      return null
    }
  },
  get(track?: MediaStreamTrack): number | undefined {
    const key = this.keyFor(track)
    if (!key) return undefined
    const v = localStorage.getItem(`focalPx:${key}`)
    return v ? Number(v) : undefined
  },
  set(track: MediaStreamTrack | undefined, focalPx: number) {
    const key = this.keyFor(track)
    if (!key) return
    localStorage.setItem(`focalPx:${key}`, String(focalPx))
  },
}

function resolveFocalPx(ctx: FaceContext, hfovDeg = 60): number {
  const stored = FocalStore.get(ctx.mediaTrack)
  if (stored && Number.isFinite(stored)) return stored
  return DistanceCalib.focalPxGuessHFOV(ctx.video, hfovDeg)
}

export function calibrateFocalPxAtKnownDistance(
  ctx: FaceContext,
  knownDistanceCm: number,
  preferIris = true,
): number | undefined {
  const irisNormPx = (() => {
    const L = ctx.iris?.leftIris ? irisDiameterPx(ctx.iris.leftIris) : undefined
    const R = ctx.iris?.rightIris ? irisDiameterPx(ctx.iris.rightIris) : undefined
    if (L && R) return (L + R) / 2
    return L ?? R
  })()
  let obsPx: number | undefined
  let realMM = DistanceCalib.irisRealMM
  if (preferIris && irisNormPx) {
    obsPx = irisNormPx * ctx.video.videoWidth
    realMM = DistanceCalib.irisRealMM
  } else {
    const ipdNorm = interpupilPx(ctx.faceLandmarks)
    if (!ipdNorm) return
    obsPx = ipdNorm * ctx.video.videoWidth
    realMM = 63
  }
  if (!obsPx) return
  const fpx = (knownDistanceCm * 10 * obsPx) / realMM
  if (Number.isFinite(fpx)) FocalStore.set(ctx.mediaTrack, fpx)
  return fpx
}

export function computeDrynessLevel(
  blinkPerMin: number | undefined,
  incompleteBlinkFrac: number | undefined,
  longestInterBlinkSec: number | undefined,
): { level?: LowMedHigh; debug: NonNullable<EyeMetrics["_debug"]>["dryness"] } {
  const dbg: NonNullable<EyeMetrics["_debug"]>["dryness"] = {}
  if (blinkPerMin == null) {
    dbg.reasonSkipped = "no blink rate"
    return { level: undefined, debug: dbg }
  }
  dbg.blinkPerMin = blinkPerMin
  if (incompleteBlinkFrac != null) dbg.incompleteFrac = incompleteBlinkFrac
  if (longestInterBlinkSec != null) dbg.longestIBI = longestInterBlinkSec
  let score = 0
  if (blinkPerMin < 8) score += 2
  else if (blinkPerMin < 12) score += 1
  if (blinkPerMin > 25) score += 1
  if (incompleteBlinkFrac != null) {
    if (incompleteBlinkFrac > 0.5) score += 2
    else if (incompleteBlinkFrac > 0.35) score += 1
  }
  if (longestInterBlinkSec != null) {
    if (longestInterBlinkSec > 15) score += 2
    else if (longestInterBlinkSec > 12) score += 1
  }
  const drynessRanges: RangesLMH = {
    low: { lt: 1 },
    medium: { gte: 1, lt: 3 },
    high: { gte: 3 },
  }
  const level = categorizeLMH(score, drynessRanges)
  return { level, debug: dbg }
}

export function computeRednessLevel(ctx: FaceContext): {
  level?: LowMedHigh
  debug: NonNullable<EyeMetrics["_debug"]>["redness"]
} {
  const { video, canvas2d, faceLandmarks } = ctx
  const dbg: NonNullable<EyeMetrics["_debug"]>["redness"] = {}
  const yaw = ctx.yawDeg ?? estimateYawDeg(faceLandmarks)
  const yawOK = yaw == null ? true : Math.abs(yaw) <= 25
  const occOK = (ctx.faceOcclusionScore ?? 0) < 0.4
  const lightOK = (ctx.lightingLevel ?? 0.5) > 0.2
  if (!faceLandmarks || !yawOK || !occOK || !lightOK) {
    dbg.reasonSkipped = !faceLandmarks
      ? "no landmarks"
      : !yawOK
        ? "yaw too large"
        : !occOK
          ? "occluded"
          : "lighting too low"
    return { level: undefined, debug: dbg }
  }
  const eyeIdxL = [33, 133, 159, 145]
  const eyeIdxR = [263, 362, 386, 374]
  const w = video.videoWidth
  const h = video.videoHeight
  canvas2d.canvas.width = w
  canvas2d.canvas.height = h
  canvas2d.drawImage(video, 0, 0, w, h)

  function sampleEye(idxArr: number[]) {
    const pts = idxArr.map((i) => toPx(faceLandmarks?.[i], video))
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
    const shrunk = pts.map((p) => ({ x: lerp(cx, p.x, 0.85), y: lerp(cy, p.y, 0.85) }))
    canvas2d.save()
    canvas2d.beginPath()
    drawPolyMask(canvas2d, shrunk)
    canvas2d.clip()
    const bbx = Math.max(0, Math.min(...shrunk.map((p) => p.x)))
    const bby = Math.max(0, Math.min(...shrunk.map((p) => p.y)))
    const bbw = Math.min(w, Math.max(...shrunk.map((p) => p.x))) - bbx
    const bbh = Math.min(h, Math.max(...shrunk.map((p) => p.y))) - bby
    const data = canvas2d.getImageData(bbx, bby, Math.max(1, bbw), Math.max(1, bbh))
    canvas2d.restore()
    return data
  }

  const leftData = sampleEye(eyeIdxL)
  const rightData = sampleEye(eyeIdxR)

  function rednessFrom(data: ImageData): { rIdx: number; n: number } {
    const arr = data.data
    let sum = 0
    let n = 0
    let glare = 0
    for (let i = 0; i < arr.length; i += 4) {
      const r = arr[i]
      const g = arr[i + 1]
      const b = arr[i + 2]
      const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
      if (y > 245) {
        glare++
        continue
      }
      const idx = r - 0.83 * g - 0.17 * b
      sum += idx
      n++
    }
    const glareFrac = glare / (arr.length / 4)
    if (glareFrac > 0.4) return { rIdx: Number.NaN, n: 0 }
    return { rIdx: n ? sum / n : Number.NaN, n }
  }

  const L = rednessFrom(leftData)
  const R = rednessFrom(rightData)
  const valid = [L, R].filter((v) => Number.isFinite(v.rIdx) && v.n > 200)
  if (!valid.length) {
    dbg.reasonSkipped = "glare or too few sclera pixels"
    return { level: undefined, debug: dbg }
  }
  const avgR = valid.reduce((s, v) => s + v.rIdx, 0) / valid.length
  dbg.rIdx = avgR
  dbg.scleraPx = valid.reduce((s, v) => s + v.n, 0)
  const rednessRanges: RangesLMH = {
    low: { lt: 10 },
    medium: { gte: 10, lt: 18 },
    high: { gte: 18 },
  }
  const level = categorizeLMH(avgR, rednessRanges)
  return { level, debug: dbg }
}

export function computeWrinkleLevel(ctx: FaceContext): {
  level?: LowMedHigh
  debug: NonNullable<EyeMetrics["_debug"]>["wrinkles"]
} {
  const { video, canvas2d, faceLandmarks } = ctx
  const dbg: NonNullable<EyeMetrics["_debug"]>["wrinkles"] = {}
  const yaw = ctx.yawDeg ?? estimateYawDeg(faceLandmarks)
  const yawOK = yaw == null ? true : Math.abs(yaw) <= 25
  const occOK = (ctx.faceOcclusionScore ?? 0) < 0.4
  const lightOK = (ctx.lightingLevel ?? 0.5) > 0.25
  const confOK = eyeRegionConfidence(faceLandmarks) > 0.5

  if (!faceLandmarks || !yawOK || !occOK || !lightOK || !confOK) {
    dbg.reasonSkipped = !faceLandmarks
      ? "no landmarks"
      : !yawOK
        ? "yaw too large"
        : !occOK
          ? "occluded"
          : !lightOK
            ? "lighting too low"
            : "low eye visibility"
    return { level: undefined, debug: dbg }
  }

  const w = video.videoWidth
  const h = video.videoHeight
  const L_outer = toPx(faceLandmarks[33], video)
  const R_outer = toPx(faceLandmarks[263], video)
  const L_lower = toPx(faceLandmarks[145], video)
  const R_lower = toPx(faceLandmarks[374], video)
  const eyeSpan = Math.hypot(R_outer.x - L_outer.x, R_outer.y - L_outer.y)
  const patchW = Math.max(10, eyeSpan * 0.08)
  const patchH = patchW * 0.7

  type Patch = { x: number; y: number; w: number; h: number }
  const patches: Patch[] = [
    { x: L_outer.x + patchW * 0.1, y: L_outer.y - patchH * 0.5, w: patchW, h: patchH },
    { x: R_outer.x - patchW * 1.1, y: R_outer.y - patchH * 0.5, w: patchW, h: patchH },
    { x: L_lower.x - patchW * 0.5, y: L_lower.y + patchH * 0.2, w: patchW, h: patchH },
    { x: R_lower.x - patchW * 0.5, y: R_lower.y + patchH * 0.2, w: patchW, h: patchH },
  ].map((p) => ({
    x: Math.max(0, Math.min(w - 1, p.x | 0)),
    y: Math.max(0, Math.min(h - 1, p.y | 0)),
    w: Math.min(w, p.w | 0),
    h: Math.min(h, p.h | 0),
  }))

  canvas2d.canvas.width = w
  canvas2d.canvas.height = h
  canvas2d.drawImage(video, 0, 0, w, h)

  function edgeDensity(x: number, y: number, ww: number, hh: number): number {
    const img = canvas2d.getImageData(x, y, ww, hh)
    const g = new Uint8ClampedArray(ww * hh)
    for (let i = 0, j = 0; i < img.data.length; i += 4, j++) {
      const r = img.data[i]
      const g1 = img.data[i + 1]
      const b = img.data[i + 2]
      g[j] = (0.2126 * r + 0.7152 * g1 + 0.0722 * b) | 0
    }
    let sum = 0
    const gxK = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
    const gyK = [-1, -2, -1, 0, 0, 0, 1, 2, 1]
    for (let yy = 1; yy < hh - 1; yy++) {
      for (let xx = 1; xx < ww - 1; xx++) {
        const idx = yy * ww + xx
        let gx = 0
        let gy = 0
        let k = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++, k++) {
            const v = g[idx + dy * ww + dx]
            gx += gxK[k] * v
            gy += gyK[k] * v
          }
        }
        sum += Math.hypot(gx, gy)
      }
    }
    return sum / ((ww - 2) * (hh - 2) * 255)
  }

  const densities = patches.map((p) => edgeDensity(p.x, p.y, p.w, p.h))
  const avg = densities.reduce((s, v) => s + v, 0) / densities.length
  const ear = ctx.metrics?.eyeAspectRatio ?? ctx.eyeAspectRatio
  const squint = ctx.metrics?.squintIntensity ?? ctx.squintIntensity
  let dynamic = 1.0
  if (typeof squint === "number") dynamic += Math.min(0.25, 0.25 * squint)
  if (typeof ear === "number") {
    if (ear < 0.2) dynamic += 0.2
    else if (ear < 0.24) dynamic += 0.1
  }
  let score = avg * dynamic
  const faceAge = ctx.metrics?.faceAge ?? ctx.faceAge
  if (typeof faceAge === "number") {
    if (faceAge <= 22) score *= 0.9
    else if (faceAge >= 45) score *= 1.1
  }
  dbg.edgeDensity = score
  const wrinkleRanges: RangesLMH = {
    low: { lt: 0.06 },
    medium: { gte: 0.06, lt: 0.1 },
    high: { gte: 0.1 },
  }
  const level = categorizeLMH(score, wrinkleRanges)
  return { level, debug: dbg }
}

export function computeDistanceLevel(ctx: FaceContext): {
  level?: LowMedHigh
  debug: NonNullable<EyeMetrics["_debug"]>["distance"]
} {
  const { video, faceLandmarks, iris } = ctx
  const dbg: NonNullable<EyeMetrics["_debug"]>["distance"] = {}
  const yaw = ctx.yawDeg ?? estimateYawDeg(faceLandmarks)
  if (yaw != null && Math.abs(yaw) > 30) {
    dbg.reasonSkipped = "yaw too large"
    return { level: undefined, debug: dbg }
  }
  if ((ctx.faceOcclusionScore ?? 0) > 0.5) {
    dbg.reasonSkipped = "occluded"
    return { level: undefined, debug: dbg }
  }
  const irisNormPx = (() => {
    const L = iris?.leftIris ? irisDiameterPx(iris.leftIris) : undefined
    const R = iris?.rightIris ? irisDiameterPx(iris.rightIris) : undefined
    if (L && R) return (L + R) / 2
    return L ?? R
  })()
  let cm: number | undefined
  if (irisNormPx && irisNormPx > 0) {
    const fpx = resolveFocalPx(ctx)
    const irisPx = irisNormPx * video.videoWidth
    cm = (fpx * DistanceCalib.irisRealMM) / irisPx / 10
  } else {
    const ipdNorm = interpupilPx(faceLandmarks)
    if (ipdNorm && ipdNorm > 0) {
      const fpx = resolveFocalPx(ctx)
      const ipdPx = ipdNorm * video.videoWidth
      cm = (fpx * 63) / ipdPx / 10
    }
  }
  if (!cm || !Number.isFinite(cm)) {
    dbg.reasonSkipped = "no iris/IPD"
    return { level: undefined, debug: dbg }
  }
  dbg.cm = cm
  const distanceRanges: RangesLMH = {
    high: { lt: 35 },
    medium: { gte: 35, lt: 55 },
    low: { gte: 55 },
  }
  const level = categorizeLMH(cm, distanceRanges)
  return { level, debug: dbg }
}

export function augmentEyeMetricsPerFrame(
  ctx: FaceContext,
  base: EyeMetrics,
  blinkPerMin?: number,
  incompleteBlinkFrac?: number,
  longestInterBlinkSec?: number,
): EyeMetrics {
  const out: EyeMetrics = { ...base, _debug: { ...base._debug } }
  const d = computeDrynessLevel(blinkPerMin, incompleteBlinkFrac, longestInterBlinkSec)
  out.drynessLevel = d.level
  out._debug = { ...out._debug, dryness: d.debug }
  const r = computeRednessLevel(ctx)
  out.rednessLevel = r.level
  out._debug = { ...out._debug, redness: r.debug }
  const w = computeWrinkleLevel(ctx)
  out.wrinkleLevel = w.level
  out._debug = { ...out._debug, wrinkles: w.debug }
  const dist = computeDistanceLevel(ctx)
  out.distanceLevel = dist.level
  out._debug = { ...out._debug, distance: dist.debug }
  return out
}
