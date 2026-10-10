import { EYE_TRACKING_CONSTANTS } from "@/constants/eye-tracking";
import { EyeKeypoints, Point } from "@/types/eyeTrackingHook";
const z = (x: number, m: number, s: number) => (s > 1e-6 ? (x - m) / s : 0);
export type Pt = { x: number; y: number };
const clamp02 = (v: number) => Math.max(0, Math.min(EYE_TRACKING_CONSTANTS.VISUAL.CLAMP_ONE, v));
function safeRect(x: number, y: number, w: number, h: number, cw: number, ch: number) {
	const rx = Math.max(0, Math.min(cw - 1, Math.round(x)));
	const ry = Math.max(0, Math.min(ch - 1, Math.round(y)));
	const rw = Math.max(1, Math.min(cw - rx, Math.round(w)));
	const rh = Math.max(1, Math.min(ch - ry, Math.round(h)));
	return { x: rx, y: ry, w: rw, h: rh };
}
function meanLumaInRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
): number {
    const { canvas } = ctx;
    const r = safeRect(x, y, w, h, canvas.width, canvas.height);
    const img = ctx.getImageData(r.x, r.y, r.w, r.h);
    const data = img.data;
    let sum = 0,
        n = 0;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
            g = data[i + 1],
            b = data[i + 2];
        sum +=
            EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.RED * r +
            EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.GREEN * g +
            EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.BLUE * b;
        n++;
    }
    return n ? sum / n : 0;
}

type EyeKeypoints2 = { inner: Pt; outer: Pt; top: Pt; bottom: Pt };
export const clamp01 = (value: number) =>
    Math.max(0, Math.min(EYE_TRACKING_CONSTANTS.VISUAL.CLAMP_ONE, value));
export const distanceBetweenPoints = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const distPt = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export function getSafeRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const rectX = Math.max(0, Math.min(canvasWidth - 1, Math.round(x)));
    const rectY = Math.max(0, Math.min(canvasHeight - 1, Math.round(y)));
    const rectWidth = Math.max(1, Math.min(canvasWidth - rectX, Math.round(width)));
    const rectHeight = Math.max(1, Math.min(canvasHeight - rectY, Math.round(height)));
    return { x: rectX, y: rectY, width: rectWidth, height: rectHeight };
}

export function calculateMeanLuminance(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
): number {
    const { canvas } = context;
    const rect = getSafeRectangle(x, y, width, height, canvas.width, canvas.height);
    const imageData = context.getImageData(rect.x, rect.y, rect.width, rect.height);
    const data = imageData.data;
    let sum = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        sum +=
            EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.RED * red +
            EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.GREEN * green +
            EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.BLUE * blue;
        count++;
    }
    return count ? sum / count : 0;
}

export function getUnderEyeAndReferenceRectangles(eye: EyeKeypoints) {
    const eyeWidth = distanceBetweenPoints(eye.inner, eye.outer);
    const centerX = (eye.inner.x + eye.outer.x) * 0.5;

    const underEyeWidth = EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.WIDTH_MULTIPLIER * eyeWidth;
    const underEyeHeight = EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.HEIGHT_MULTIPLIER * eyeWidth;
    const underEyeX = centerX - underEyeWidth / 2;
    const underEyeY = eye.bottom.y + EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.Y_OFFSET * eyeWidth;

    const cheekWidth = EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.WIDTH_MULTIPLIER * underEyeWidth;
    const cheekHeight = EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.HEIGHT_MULTIPLIER * underEyeHeight;
    const cheekX = centerX - cheekWidth / 2;
    const cheekY =
        underEyeY + underEyeHeight + EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.Y_OFFSET * eyeWidth;

    const foreheadWidth = EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.WIDTH_MULTIPLIER * underEyeWidth;
    const foreheadHeight =
        EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.HEIGHT_MULTIPLIER * underEyeHeight;
    const foreheadX = centerX - foreheadWidth / 2;
    const foreheadY =
        eye.top.y - EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.Y_OFFSET * eyeWidth - foreheadHeight;
    return {
        underEye: { x: underEyeX, y: underEyeY, width: underEyeWidth, height: underEyeHeight },
        cheek: { x: cheekX, y: cheekY, width: cheekWidth, height: cheekHeight },
        forehead: { x: foreheadX, y: foreheadY, width: foreheadWidth, height: foreheadHeight },
    };
}

export function calculateBlinkPenalty(blinksPerMinute: number) {
    return clamp01(
        Math.abs(blinksPerMinute - EYE_TRACKING_CONSTANTS.BLINK.TARGET_PER_MIN) /
            EYE_TRACKING_CONSTANTS.BLINK.PENALTY_DIVISOR
    );
}

export function normalizePerclos(perclosValue: number) {
    return clamp01(
        (perclosValue - EYE_TRACKING_CONSTANTS.METRICS.PERCLOS_NORMALIZATION.SUBTRACT) /
            EYE_TRACKING_CONSTANTS.METRICS.PERCLOS_NORMALIZATION.DIVIDE
    );
}
export function underEyeAndRefRects(eye: EyeKeypoints) {
    const w = distPt(eye.inner, eye.outer);
    const cx = (eye.inner.x + eye.outer.x) * 0.5;
    const underW = EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.WIDTH_MULTIPLIER * w,
        underH = EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.HEIGHT_MULTIPLIER * w,
        underX = cx - underW / 2;
    const underY = eye.bottom.y + EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.Y_OFFSET * w;
    const cheekW = EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.WIDTH_MULTIPLIER * underW,
        cheekH = EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.HEIGHT_MULTIPLIER * underH,
        cheekX = cx - cheekW / 2;
    const cheekY = underY + underH + EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.Y_OFFSET * w;
    const foreheadW = EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.WIDTH_MULTIPLIER * underW,
        foreheadH = EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.HEIGHT_MULTIPLIER * underH,
        foreheadX = cx - foreheadW / 2;

    const foreheadY = eye.top.y - EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.Y_OFFSET * w - foreheadH;

    return {
        under: { x: underX, y: underY, w: underW, h: underH },
        cheek: { x: cheekX, y: cheekY, w: cheekW, h: cheekH },
        forehead: { x: foreheadX, y: foreheadY, w: foreheadW, h: foreheadH },
    };
}

export function blinkPenaltyAbs(bpm: number) {
    return clamp01(
        Math.abs(bpm - EYE_TRACKING_CONSTANTS.BLINK.TARGET_PER_MIN) /
            EYE_TRACKING_CONSTANTS.BLINK.PENALTY_DIVISOR
    );
}
export function perclosNorm(p: number) {
    return clamp01(
        (p - EYE_TRACKING_CONSTANTS.METRICS.PERCLOS_NORMALIZATION.SUBTRACT) /
            EYE_TRACKING_CONSTANTS.METRICS.PERCLOS_NORMALIZATION.DIVIDE
    );
}
export const calculateEyeAge = 
        (blinkRate: number, perclos: number, darkCircleValue: number, lastValidEyeAge: number):number => {
            if (blinkRate <= 0 || isNaN(blinkRate)) return lastValidEyeAge;

            const blinkPenalty = calculateBlinkPenalty(blinkRate);
            const eyeAgeIndex = clamp01(
                EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.PERCLOS * normalizePerclos(perclos) +
                    EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.DARK * darkCircleValue +
                    EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.BLINK * blinkPenalty
            );

            const eyeAgeYears = Math.round(
                EYE_TRACKING_CONSTANTS.AGE.MIN_EYE +
                    eyeAgeIndex *
                        (EYE_TRACKING_CONSTANTS.AGE.MAX_EYE - EYE_TRACKING_CONSTANTS.AGE.MIN_EYE)
            );

            if (eyeAgeYears > 0 && eyeAgeYears <= EYE_TRACKING_CONSTANTS.AGE.ABSOLUTE_MAX) {
                return eyeAgeYears;
            }

            return lastValidEyeAge;
        }

export const calculateFaceAge = 
        (eyeAge: number, attentionFraction: number, squintValue: number,lastValidFaceAge: number) : number => {
            let calculatedFaceAge = eyeAge;
            calculatedFaceAge +=
                (1 - attentionFraction) * EYE_TRACKING_CONSTANTS.AGE.FACE_ATTENTION_IMPACT;
            calculatedFaceAge += (squintValue - 15) / 5;

            const finalFaceAge = Math.max(
                EYE_TRACKING_CONSTANTS.AGE.MIN_FACE,
                Math.min(EYE_TRACKING_CONSTANTS.AGE.MAX_FACE, Math.round(calculatedFaceAge))
            );

            if (finalFaceAge > 0 && finalFaceAge <= 100) {
                return finalFaceAge;
            }

            return finalFaceAge;
        }
export const calculateLandmarkDistance = (point1: any, point2: any): number => {
  return Math.hypot(point1.x - point2.x, point1.y - point2.y);
};