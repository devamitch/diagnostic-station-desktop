import { DrynessResult, ProximityResult, RednessResult } from "@/types/eyeTrackingHook";

const z = (x: number, m: number, s: number) => (s > 1e-6 ? (x - m) / s : 0);

export function computeDryness(
    blinkTimes: number[],
    incompleteBlinkFlags: boolean[],
    blinkRate: number
): DrynessResult {
    const ibis: number[] = [];
    for (let i = 1; i < blinkTimes.length; i++) {
        ibis.push((blinkTimes[i] - blinkTimes[i - 1]) / 1000);
    }
    const meanIBI = ibis.length ? ibis.reduce((a, b) => a + b, 0) / ibis.length : 0;

    const total = incompleteBlinkFlags.length;
    const incompleteCount = incompleteBlinkFlags.reduce((acc, v) => acc + (v ? 1 : 0), 0);
    const incompleteBlinkFrac = total ? incompleteCount / total : 0;

    const BASE = {
        rate: { m: 12, s: 6 },
        incomp: { m: 0.15, s: 0.1 },
        ibi: { m: 4.0, s: 1.5 },
    };
    const drynessScore =
        0.45 * z(blinkRate, BASE.rate.m, BASE.rate.s) +
        0.35 * z(incompleteBlinkFrac, BASE.incomp.m, BASE.incomp.s) +
        0.2 * z(meanIBI, BASE.ibi.m, BASE.ibi.s);

    return { meanIBI, incompleteBlinkFrac, drynessScore };
}

export function computeRedness(
    rednessValues: number[],
    blinkRate: number,
    exposureLevel: number = 0.5
): RednessResult {
    const n = rednessValues.length || 1;
    const meanR = rednessValues.reduce((a, b) => a + b, 0) / n;
    const stdR = Math.sqrt(rednessValues.reduce((a, b) => a + (b - meanR) ** 2, 0) / n);

    const normRedness = meanR / Math.max(exposureLevel, 0.1);
    const rednessIndex = normRedness + 0.5 * stdR;

    const rednessScore = 0.7 * rednessIndex + 0.3 * (blinkRate / 20);

    const BASE = { red: { m: 0.35, s: 0.15 } };
    const rednessZ = z(rednessScore, BASE.red.m, BASE.red.s);

    return { meanR, stdR, normRedness, rednessIndex, rednessScore, rednessZ };
}

export function computeScreenDistance(
    faceSizes: number[],
    baselineWidthPx: number,
    targetDistanceCm: number = 50
): ProximityResult {
    const n = faceSizes.length || 1;
    const meanSize = faceSizes.reduce((a, b) => a + b, 0) / n;
    const varSum = faceSizes.reduce((a, b) => a + (b - meanSize) ** 2, 0) / n;
    const stdSize = Math.sqrt(varSum);

    let distanceCm = targetDistanceCm * (baselineWidthPx / Math.max(meanSize, 1e-6));
    const distanceVar = stdSize / Math.max(meanSize, 1e-6);
    const BASE = { dist: { m: 50, s: 10 }, v: { m: 0.05, s: 0.03 } };
    const distZ = -z(distanceCm, BASE.dist.m, BASE.dist.s);
    const varZ = z(distanceVar, BASE.v.m, BASE.v.s);
    let proximityScore = (0.7 * distZ + 0.3 * varZ) * -12;
    if (proximityScore > 150) {
        proximityScore = 150;
    }
    if (distanceCm > 150) {
        distanceCm = 150;
    }
    return { distanceCm, distanceVar, proximityScore };
}