
/** Results */
export interface DrynessResult {
  meanIBI: number;                 // seconds
  incompleteBlinkFrac: number;     // 0..1
  drynessScore: number;            // higher = drier
}

export interface RednessResult {
  meanR: number;
  stdR: number;
  normRedness: number;
  rednessIndex: number;
  rednessScore: number;
  rednessZ: number;
}

export interface ProximityResult {
  distanceCm: number;
  distanceVar: number;
  proximityScore: number;          // higher = closer/unstable
}


export type EyeMetrics = {
  timestamp: string;
  blinkRate: number;
  perClose: number;
  perclos?: number;
  attentionFrac: number;
  strainLevelIdx: 0 | 1 | 2;
  strainText: string;
  tiredText: string;
  attBinary: 0 | 1;
  eyeAspectRatio: number;
  pupilDilation: number;
  squintIntensity: number;
  darkCircleScore?: number;
  tirednessScore?: number;
  eyeAgeIndex?: number;
  eyeAge: number;
  faceAge: number;

  // Added:
  meanIBI?: number;
  incompleteBlinkFrac?: number;
  drynessScore?: number;

  rednessMean?: number;
  rednessStd?: number;
  rednessNorm?: number;
  rednessIndex?: number;
  rednessScore?: number;
  rednessZ?: number;

  distanceCm?: number;
  distanceVar?: number;
  proximityScore?: number;
  batteryLevel?: number;
};


export type DrawingColors = {
    faceMesh: string;
    rightEye: string;
    leftEye: string;
    rightIris: string;
    leftIris: string;
    rightEyebrow: string;
    leftEyebrow: string;
    lips: string;
    faceOval: string;
    background: string;
    text: string;
    highlight: string;
};

export type ColorScheme = 'default' | 'minimal';

export type EyeTrackingOptions = {
    colors?: Partial<DrawingColors>;
    colorScheme?: ColorScheme;
    drawFaceMesh?: boolean;
    drawEyes?: boolean;
    drawIris?: boolean;
    drawEyebrows?: boolean;
    drawLips?: boolean;
    drawFaceOval?: boolean;
    metricsUpdateInterval?: number;
    blinkDetectionThreshold?: number;
    videoConstraints?: MediaTrackConstraints;
};


export type Point = { x: number; y: number };


export type EyeKeypoints = { inner: Point; outer: Point; top: Point; bottom: Point };
