import { COLOR_SCHEMES, EYE_TRACKING_CONSTANTS, strainLevels } from '@/constants/eye-tracking';
import useAppStore from '@/store';
import { DrawingUtils, FaceLandmarker } from '@/utils/mediapipe';
import { notify } from '@/utils/toasts';
import {
	calculateBlinkPenalty,
	calculateEyeAge,
	calculateFaceAge,
	calculateMeanLuminance,
	clamp01,
	getUnderEyeAndReferenceRectangles,
	normalizePerclos,
	underEyeAndRefRects,
} from '@/utils/tracking-utils/calculateFunctions';
import {
	computeDryness,
	computeRedness,
	computeScreenDistance,
} from '@/utils/tracking-utils/computationFunctions';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DrawingColors, EyeKeypoints, EyeTrackingOptions } from '../types/eyeTrackingHook';
import { useCamera } from './use-camera';
import { useCameraRecovery } from './use-camera-recovery';
import { useMediaPipe } from './use-mediaPipe';
import { useBackgroundTracking } from './useBackgroundTracking';

export const useEyeTracking = (options: EyeTrackingOptions = {}) => {
	// ========== STORE STATE ==========
	const storeState = useAppStore();

	// const isCameraActive = storeState?.camera?.isCameraActive ?? false;
	const isTrackingActive = storeState?.camera?.isTrackingActive ?? false;
	const loading = storeState?.camera?.loading ?? false;
	const currentMetrics = storeState?.eyeTracking?.currentMetrics ?? null;
	const metricsHistory = storeState?.eyeTracking?.metricsHistory ?? [];

	const getLastBlinkRate = useMemo(
		() => storeState?.eyeTracking?.getLastBlinkRate?.() ?? 0,
		[storeState?.eyeTracking]
	);

	const getLastMetrics = useMemo(
		() => storeState?.eyeTracking?.getLastMetrics?.() ?? (() => null),
		[storeState?.eyeTracking]
	);

	// ========== STORE ACTIONS ==========
	const setCameraState = useMemo(
		() =>
			storeState?.camera?.setCameraState ??
			(() => console.warn('setCameraState is not available')),
		[storeState?.camera?.setCameraState]
	);

	const setTrackingState = useMemo(
		() =>
			storeState?.camera?.setTrackingState ??
			(() => console.warn('setTrackingState is not available')),
		[storeState?.camera?.setTrackingState]
	);

	const setLoading = useMemo(
		() => storeState?.camera?.setLoading ?? (() => console.warn('setLoading is not available')),
		[storeState?.camera?.setLoading]
	);

	const setError = useMemo(
		() =>
			storeState?.eyeTracking?.setError ?? (() => console.warn('setError is not available')),
		[storeState?.eyeTracking?.setError]
	);

	const startSession = useMemo(
		() =>
			storeState?.eyeTracking?.startSession ??
			(() => console.warn('startSession is not available')),
		[storeState?.eyeTracking?.startSession]
	);

	const endSession = useMemo(
		() =>
			storeState?.eyeTracking?.endSession ??
			(() => console.warn('endSession is not available')),
		[storeState?.eyeTracking?.endSession]
	);

	const updateStoreMetrics = useMemo(
		() =>
			storeState?.eyeTracking?.updateMetrics ??
			(() => console.warn('updateStoreMetrics is not available')),
		[storeState?.eyeTracking?.updateMetrics]
	);

	// ========== LOCAL STATE ==========
	// const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);
	const [isScanning, setIsScanning] = useState(true);
	const [cameraConflictWarning, setCameraConflictWarning] = useState(false); // ✅ NEW

	// ========== REFS - DOM ==========
	// const videoRef = usePersistentVideo();
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// ========== REFS - MEDIAPIPE ==========
	// const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
	const drawingUtilsRef = useRef<DrawingUtils | null>(null);

	// ========== REFS - ANIMATION & INTERVALS ==========
	const animationFrameIdRef = useRef<number | null>(null);
	const metricsIntervalIdRef = useRef<number | null>(null);

	// ========== REFS - TRACKING DATA ==========
	const totalFramesRef = useRef(0);
	const closedFramesRef = useRef(0);
	const facePresentFramesRef = useRef(0);
	const previousEyesClosedRef = useRef(false);
	const closedSamplesRef = useRef<Array<{ timestamp: number; closed: boolean }>>([]);
	const darkCircleScoreRef = useRef(0);
	const streamDataRef = useRef<any[]>([]);

	// ========== REFS - BLINK DETECTION ==========
	const blinkTimestampsRef = useRef<number[]>([]);
	const incompleteBlinkFlagsRef = useRef<boolean[]>([]);
	const inBlinkRef = useRef<boolean>(false);
	const blinkStartTsRef = useRef<number>(0);
	const blinkMaxPerCloseRef = useRef<number>(0);

	// ========== REFS - REDNESS & DISTANCE ==========
	const rednessValuesRef = useRef<number[]>([]);
	const faceSizesRef = useRef<number[]>([]);
	const exposureLevelRef = useRef<number>(0.5);
	const baselineWidthPxRef = useRef<number>(240);

	// ========== REFS - METRICS BUFFER ==========
	const lastDrynessRef = useRef<{
		meanIBI: number;
		incompleteBlinkFrac: number;
		drynessScore: number;
	} | null>(null);

	// ========== REFS - VALIDATION ==========
	const lastValidBlinkRateRef = useRef<number>(
		getLastBlinkRate || EYE_TRACKING_CONSTANTS.FALLBACK.BLINK_RATE
	);
	const lastValidEyeAgeRef = useRef<number>(
		getLastMetrics?.eyeAge || EYE_TRACKING_CONSTANTS.FALLBACK.EYE_AGE
	);
	const lastValidFaceAgeRef = useRef<number>(
		getLastMetrics?.faceAge || EYE_TRACKING_CONSTANTS.FALLBACK.FACE_AGE
	);

	// ========== REFS - SESSION ==========
	const isCameraOnRef = useRef(false);
	const scanningTimerRef = useRef<NodeJS.Timeout | null>(null);

	// ========== REFS - CAMERA RECOVERY ==========
	// const mediaStreamRef = useRef<MediaStream | null>(null);
	const isRecoveringRef = useRef(false);
	const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const lastEyeAgeUpdateRef = useRef<number>(Date.now());
	// const recoveryAttemptsRef = useRef(0); // ✅ NEW
	// const lastRecoveryTimeRef = useRef(0); // ✅ NEW
	const cameraConflictTimeoutRef = useRef<NodeJS.Timeout | null>(null); // ✅ NEW

	// ========== HOOKS ==========
	const { keepMediaAlive, stopMediaKeepAlive } = useBackgroundTracking();

	// ========== OPTIONS ==========
	const {
		colorScheme = 'minimal',
		colors = {},
		drawFaceMesh = true,
		drawEyes = false,
		drawIris = false,
		metricsUpdateInterval = 500,
		blinkDetectionThreshold = EYE_TRACKING_CONSTANTS.BLINK.DETECTION_THRESHOLD,
		// videoConstraints = {
		// 	width: { ideal: 640 },
		// 	height: { ideal: 480 },
		// 	focusMode: 'continuous',
		// 	frameRate: { ideal: 1.7 },
		// },
	} = options;

	const drawingColors: DrawingColors = useMemo(
		() => ({ ...COLOR_SCHEMES[colorScheme], ...colors }),
		[colorScheme, colors]
	);

	// ========== EXTERNAL HOOKS ==========
	const {
		mediaStream,
		setMediaStream,
		startCamera,
		stopCamera,
		isCameraActive,
		videoRef,
		mediaStreamRef,
	} = useCamera(setCameraConflictWarning);

	const { handleCameraDisconnection, monitorCameraHealth } = useCameraRecovery({
		isTrackingActive,
		setCameraConflictWarning,
		startCamera,
		videoRef,
		mediaStreamRef,
		setMediaStream,
		notify,
	});

	const { initializeFaceLandmarker, faceLandmarkerRef } = useMediaPipe();
		const processFrame = useCallback(
		(
			video: HTMLVideoElement,
			canvas: HTMLCanvasElement,
			faceLandmarker: any,
			context: CanvasRenderingContext2D,
			drawingUtils: any
		) => {
			if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				drawingUtilsRef.current = new DrawingUtils(context);
			}

			const currentTime = performance.now();
			const results = faceLandmarker.detectForVideo(video, currentTime);

			context.save();
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.drawImage(video, 0, 0, canvas.width, canvas.height);
			totalFramesRef.current += 1;

			if (results.faceLandmarks && results.faceLandmarks.length > 0) {
				const landmarks = results.faceLandmarks[0];
				facePresentFramesRef.current += 1;

				if (drawFaceMesh) {
					drawingUtils.drawConnectors(
						landmarks,
						FaceLandmarker.FACE_LANDMARKS_TESSELATION,
						{
							color: drawingColors.faceMesh,
							lineWidth: 0.5,
						}
					);
				}

				if (drawEyes) {
					drawingUtils.drawConnectors(
						landmarks,
						FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
						{
							color: drawingColors.rightEye,
							lineWidth: 0.5,
						}
					);
					drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
						color: drawingColors.leftEye,
						lineWidth: 0.5,
					});
				}

				if (drawIris) {
					drawingUtils.drawConnectors(
						landmarks,
						FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
						{
							color: drawingColors.rightIris,
							lineWidth: 0.5,
						}
					);
					drawingUtils.drawConnectors(
						landmarks,
						FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
						{
							color: drawingColors.leftIris,
							lineWidth: 0.5,
						}
					);
				}

				const leftHorizontal = calculateLandmarkDistance(landmarks[33], landmarks[133]);
				const leftVertical = calculateLandmarkDistance(landmarks[159], landmarks[145]);
				const rightHorizontal = calculateLandmarkDistance(landmarks[362], landmarks[263]);
				const rightVertical = calculateLandmarkDistance(landmarks[386], landmarks[374]);

				const leftRatio = leftVertical > 0 ? leftHorizontal / leftVertical : 0;
				const rightRatio = rightVertical > 0 ? rightHorizontal / rightVertical : 0;
				const averageRatio = (leftRatio + rightRatio) / 2;

				const eyesClosed = averageRatio > blinkDetectionThreshold;

				closedSamplesRef.current.push({
					timestamp: Date.now(),
					closed: eyesClosed,
				});

				if (
					closedSamplesRef.current.length > EYE_TRACKING_CONSTANTS.PERCLOS.SAMPLES_LIMIT
				) {
					const keepAfterTimestamp =
						Date.now() -
						EYE_TRACKING_CONSTANTS.PERCLOS.WINDOW_MS *
							EYE_TRACKING_CONSTANTS.PERCLOS.WINDOW_MULTIPLIER;
					closedSamplesRef.current = closedSamplesRef.current.filter(
						(sample) => sample.timestamp > keepAfterTimestamp
					);
				}

				try {
					const toPixelCoordinates = (point: any) => ({
						x: point.x * canvas.width,
						y: point.y * canvas.height,
					});

					const leftEye = {
						inner: toPixelCoordinates(landmarks[133]),
						outer: toPixelCoordinates(landmarks[33]),
						top: toPixelCoordinates(landmarks[159]),
						bottom: toPixelCoordinates(landmarks[145]),
					};

					const rightEye = {
						inner: toPixelCoordinates(landmarks[362]),
						outer: toPixelCoordinates(landmarks[263]),
						top: toPixelCoordinates(landmarks[386]),
						bottom: toPixelCoordinates(landmarks[374]),
					};

					const leftRectangles = getUnderEyeAndReferenceRectangles(
						leftEye as EyeKeypoints
					);
					const rightRectangles = getUnderEyeAndReferenceRectangles(
						rightEye as EyeKeypoints
					);

					const leftUnderEyeLuminance = calculateMeanLuminance(
						context,
						leftRectangles.underEye.x,
						leftRectangles.underEye.y,
						leftRectangles.underEye.width,
						leftRectangles.underEye.height
					);

					const rightUnderEyeLuminance = calculateMeanLuminance(
						context,
						rightRectangles.underEye.x,
						rightRectangles.underEye.y,
						rightRectangles.underEye.width,
						rightRectangles.underEye.height
					);

					const leftCheekLuminance = calculateMeanLuminance(
						context,
						leftRectangles.cheek.x,
						leftRectangles.cheek.y,
						leftRectangles.cheek.width,
						leftRectangles.cheek.height
					);

					const rightCheekLuminance = calculateMeanLuminance(
						context,
						rightRectangles.cheek.x,
						rightRectangles.cheek.y,
						rightRectangles.cheek.width,
						rightRectangles.cheek.height
					);

					const averageUnderEyeLuminance =
						(leftUnderEyeLuminance + rightUnderEyeLuminance) / 2;
					const averageCheekLuminance = (leftCheekLuminance + rightCheekLuminance) / 2;
					const relativeDifference =
						(averageCheekLuminance - averageUnderEyeLuminance) /
						Math.max(averageCheekLuminance, 1);

					darkCircleScoreRef.current = clamp01(
						(relativeDifference - EYE_TRACKING_CONSTANTS.METRICS.DARK_CIRCLE.SUBTRACT) /
							EYE_TRACKING_CONSTANTS.METRICS.DARK_CIRCLE.DIVIDE
					);
				} catch (error) {
					console.debug('ROI calculation error:', error);
				}

				if (eyesClosed && !previousEyesClosedRef.current) {
					blinkTimestampsRef.current.push(Date.now());
				}

				if (eyesClosed) closedFramesRef.current += 1;
				previousEyesClosedRef.current = eyesClosed;

				const nowMs = performance.now();
				const FULL_CLOSE_RATIO = blinkDetectionThreshold * 1.4;

				if (!inBlinkRef.current && eyesClosed) {
					inBlinkRef.current = true;
					blinkStartTsRef.current = nowMs;
					blinkMaxPerCloseRef.current = averageRatio;
				} else if (inBlinkRef.current && eyesClosed) {
					if (averageRatio > blinkMaxPerCloseRef.current)
						blinkMaxPerCloseRef.current = averageRatio;
				} else if (inBlinkRef.current && !eyesClosed) {
					inBlinkRef.current = false;
					const dur = nowMs - blinkStartTsRef.current;
					if (dur >= 50 && dur <= 600) {
						blinkTimestampsRef.current.push(nowMs);
						const incomplete = blinkMaxPerCloseRef.current < FULL_CLOSE_RATIO;
						incompleteBlinkFlagsRef.current.push(incomplete);
						const cutoff = nowMs - 120_000;
						while (
							blinkTimestampsRef.current.length &&
							blinkTimestampsRef.current[0] < cutoff
						) {
							blinkTimestampsRef.current.shift();
							incompleteBlinkFlagsRef.current.shift();
						}
					}
				}

				const ctx = canvas.getContext('2d');
				if (ctx) {
					const toPx = (p: any) => ({
						x: p.x * canvas.width,
						y: p.y * canvas.height,
					});
					const leftEye = {
						inner: toPx(landmarks[133]),
						outer: toPx(landmarks[33]),
						top: toPx(landmarks[159]),
						bottom: toPx(landmarks[145]),
					};
					const { under: r } = underEyeAndRefRects(leftEye as EyeKeypoints);
					const img = ctx.getImageData(
						Math.max(0, r.x),
						Math.max(0, r.y),
						Math.max(1, r.w),
						Math.max(1, r.h)
					);
					let rs = 0,
						gs = 0,
						bs = 0;
					for (let i = 0; i < img.data.length; i += 4) {
						rs += img.data[i];
						gs += img.data[i + 1];
						bs += img.data[i + 2];
					}
					const n = Math.max(1, img.data.length / 4);
					const meanR = rs / n,
						meanG = gs / n,
						meanB = bs / n;
					const exposure = (0.2126 * meanR + 0.7152 * meanG + 0.0722 * meanB) / 255;
					exposureLevelRef.current =
						0.8 * exposureLevelRef.current + 0.2 * Math.min(1, Math.max(0, exposure));
					const frameRedness = Math.max(0, (meanR - (meanG + meanB) / 2) / 255);
					rednessValuesRef.current.push(frameRedness);
					if (rednessValuesRef.current.length > 600) rednessValuesRef.current.shift();
				}

				const L_OUT = 33,
					R_OUT = 263;
				const left = landmarks[L_OUT],
					right = landmarks[R_OUT];
				const interOcularPx = Math.hypot(
					(right.x - left.x) * canvas.width,
					(right.y - left.y) * canvas.height
				);
				faceSizesRef.current.push(interOcularPx);
				if (faceSizesRef.current.length > 600) faceSizesRef.current.shift();
			}

			context.restore();
		},
		[drawFaceMesh, drawEyes, drawIris, blinkDetectionThreshold, drawingColors]
	);
	// ============================================

	const updateAllMetrics = useCallback(async () => {
		const timestamp = new Date().toISOString();
		const now = Date.now();
		const oneMinuteAgo = now - EYE_TRACKING_CONSTANTS.BLINK.WINDOW_MS;

		blinkTimestampsRef.current = blinkTimestampsRef.current.filter(
			(timestamp) => timestamp > oneMinuteAgo
		);
		const rawBlinkRate = blinkTimestampsRef.current.length;
		const blinkRate = rawBlinkRate === 0 ? lastValidBlinkRateRef.current : rawBlinkRate;
		if (rawBlinkRate !== 0) lastValidBlinkRateRef.current = blinkRate;

		closedSamplesRef.current = closedSamplesRef.current.filter(
			(sample) => sample.timestamp > now - EYE_TRACKING_CONSTANTS.PERCLOS.WINDOW_MS
		);

		let perclos = 0;
		if (closedSamplesRef.current.length > 1) {
			let closedMilliseconds = 0;
			const samples = closedSamplesRef.current;

			for (let i = 0; i < samples.length - 1; i++) {
				const timeDifference = samples[i + 1].timestamp - samples[i].timestamp;
				if (samples[i].closed) closedMilliseconds += timeDifference;
			}

			const totalMilliseconds = samples[samples.length - 1].timestamp - samples[0].timestamp;
			perclos = totalMilliseconds > 0 ? closedMilliseconds / totalMilliseconds : 0;
		}

		const percentageClosed =
			totalFramesRef.current > 0
				? (closedFramesRef.current / totalFramesRef.current) * 100
				: 0;

		const redWindow = Math.max(1, Math.min(rednessValuesRef.current.length, 300));
		const redVals = rednessValuesRef.current.slice(-redWindow);
		const red = computeRedness(redVals, blinkRate, exposureLevelRef.current);

		const sizeWindow = Math.max(1, Math.min(faceSizesRef.current.length, 180));
		const sizes = faceSizesRef.current.slice(-sizeWindow);
		const prox = computeScreenDistance(sizes, baselineWidthPxRef.current, 50);

		const attentionFraction =
			totalFramesRef.current > 0 ? facePresentFramesRef.current / totalFramesRef.current : 0;

		let strainText: string;
		if (blinkRate < 12) {
			strainText = strainLevels.high;
		} else if (blinkRate < 18) {
			strainText = strainLevels.moderate;
		} else {
			strainText = strainLevels.low;
		}

		let tiredText: string;
		if (percentageClosed > EYE_TRACKING_CONSTANTS.PERCENTAGE.PERCLOS_THRESHOLDS.VERY_HIGH) {
			tiredText = strainLevels.veryHigh;
		} else if (percentageClosed > EYE_TRACKING_CONSTANTS.PERCENTAGE.PERCLOS_THRESHOLDS.HIGH) {
			tiredText = strainLevels.high;
		} else if (
			percentageClosed > EYE_TRACKING_CONSTANTS.PERCENTAGE.PERCLOS_THRESHOLDS.MODERATE
		) {
			tiredText = strainLevels.moderate;
		} else {
			tiredText = strainLevels.low;
		}

		const blinkPenalty = calculateBlinkPenalty(blinkRate);
		const darkCircleValue = darkCircleScoreRef.current;
		const tiredness = clamp01(
			EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.PERCLOS * normalizePerclos(perclos) +
				EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.DARK * darkCircleValue +
				EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.BLINK * blinkPenalty
		);

		const eyeAgeIndex = clamp01(
			EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.PERCLOS * normalizePerclos(perclos) +
				EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.DARK * darkCircleValue +
				EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.BLINK * blinkPenalty
		);

		let eyeAge = lastValidEyeAgeRef.current;
		if (now - lastEyeAgeUpdateRef.current >= 6000) {
			eyeAge = calculateEyeAge(
				blinkRate,
				perclos,
				darkCircleValue,
				lastValidEyeAgeRef.current
			);
			if (eyeAge !== lastValidEyeAgeRef.current) {
				lastValidEyeAgeRef.current = eyeAge;
			}
			lastEyeAgeUpdateRef.current = now;
		}

		const squintIntensity =
			percentageClosed > 15
				? EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.HIGH.MIN +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.HIGH.RANGE
				: EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.LOW.MIN +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.LOW.RANGE;

		const faceAge = calculateFaceAge(
			eyeAge,
			attentionFraction,
			squintIntensity,
			lastValidFaceAgeRef.current
		);
		if (faceAge !== lastValidFaceAgeRef.current) {
			lastValidFaceAgeRef.current = faceAge;
		}
		const drynessNow = computeDryness(
			blinkTimestampsRef.current,
			incompleteBlinkFlagsRef.current,
			blinkRate
		);
		lastDrynessRef.current = drynessNow;

		const blinkScore = Math.max(0, Math.min(100, (blinkRate / 20) * 100));
		const strainScore = Math.max(
			0,
			100 - ((blinkRate < 12 ? 2 : blinkRate < 18 ? 1 : 0) as 0 | 1 | 2) * 33
		);
		const attentionScore = attentionFraction * 100;
		const tiredScore = Math.max(0, 100 - percentageClosed * 2);
		const overallHealthScore = Math.round(
			(blinkScore + strainScore + attentionScore + tiredScore) / 4
		);

		const metrics: any = {
			timestamp,
			blinkRate,
			perClose: percentageClosed,
			perclos,
			attentionFrac: attentionFraction,
			strainLevelIdx: (blinkRate < 12 ? 2 : blinkRate < 18 ? 1 : 0) as 0 | 1 | 2,
			strainText,
			tiredText,
			attBinary:
				attentionFraction >= EYE_TRACKING_CONSTANTS.PERCENTAGE.ATTENTION_THRESHOLD ? 1 : 0,
			eyeAspectRatio:
				EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.BASE +
				blinkRate * EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.BLINK_FACTOR +
				Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.RANGE,
			pupilDilation: Math.max(
				EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.MIN,
				EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.BASE -
					percentageClosed * EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.PERCLOS_FACTOR +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.RANGE
			),
			squintIntensity: squintIntensity,
			darkCircleScore: darkCircleValue,
			tirednessScore: tiredness,
			eyeAgeIndex: eyeAgeIndex,
			eyeAge,
			faceAge,
			meanIBI: lastDrynessRef.current?.meanIBI ?? 0,
			incompleteBlinkFrac: lastDrynessRef.current?.incompleteBlinkFrac ?? 0,
			drynessScore: lastDrynessRef.current?.drynessScore ?? 0,
			faceDetected: facePresentFramesRef.current > 0,
			rednessMean: red.meanR,
			rednessStd: red.stdR,
			rednessNorm: red.normRedness,
			rednessIndex: red.rednessIndex,
			rednessScore: red.rednessScore,
			rednessZ: red.rednessZ,
			distanceCm: prox.distanceCm,
			distanceVar: prox.distanceVar,
			proximityScore: prox.proximityScore,
			overallHealthScore: overallHealthScore,
		};

		streamDataRef.current = [
			...streamDataRef.current.slice(-EYE_TRACKING_CONSTANTS.METRICS.HISTORY_LIMIT),
			metrics,
		];
		updateStoreMetrics(metrics);
		totalFramesRef.current = 0;
		closedFramesRef.current = 0;
		facePresentFramesRef.current = 0;
	}, [updateStoreMetrics]);

	// ============================================
	// ✅ IMPROVED START CAMERA FUNCTION
	// ============================================

	const calculateLandmarkDistance = useCallback(
		(point1: any, point2: any) => Math.hypot(point1.x - point2.x, point1.y - point2.y),
		[]
	);

	// ============================================
	// ✅ START TRACKING FUNCTION (Complete)
	// ============================================
	const startTracking = useCallback(async () => {
		setLoading(true);
		const isCancelled = false;

		try {
			if (!faceLandmarkerRef.current) {
				const initialized = await initializeFaceLandmarker();
				if (!initialized) throw new Error('Face landmarker initialization failed');
			}

			await startCamera();
			setCameraState({ isCameraActive: true, cameraError: null });

			const renderFrame = async () => {
				if (isCancelled) return;

				const video = videoRef.current;
				const canvas = canvasRef.current;
				const faceLandmarker = faceLandmarkerRef.current;

				if (
					video &&
					canvas &&
					faceLandmarker &&
					video.readyState === video.HAVE_ENOUGH_DATA
				) {
					const context = canvas.getContext('2d');
					if (!context) return;

					const drawingUtils = drawingUtilsRef.current || new DrawingUtils(context);

					// Use the extracted processFrame function
					processFrame(video, canvas, faceLandmarker, context, drawingUtils);
				}

				if (!isCancelled) {
					animationFrameIdRef.current = requestAnimationFrame(renderFrame);
				}
			};

			renderFrame();

			metricsIntervalIdRef.current = window.setInterval(
				updateAllMetrics,
				metricsUpdateInterval
			);

			monitorCameraHealth();

			setTrackingState({ isTrackingActive: true, trackingError: null });
			startSession();

			// Start scanning timer
			setIsScanning(true);
			scanningTimerRef.current = setTimeout(() => {
				setIsScanning(false);
				scanningTimerRef.current = null;
				console.log('[useEyeTracking] Scanning period completed - showing real values');
			}, 30000); // 30 seconds
		} catch (error) {
			console.error('Tracking error:', error);
			setTrackingState({
				isTrackingActive: false,
				trackingError: EYE_TRACKING_CONSTANTS.ERROR.TRACKING,
			});
			endSession();
			isCameraOnRef.current = false;
		} finally {
			setLoading(false);
			setIsInitialized(true);
		}
	}, [
		setLoading,
		setCameraState,
		updateAllMetrics,
		metricsUpdateInterval,
		setTrackingState,
		startSession,
		initializeFaceLandmarker,
		videoRef,
		endSession,
		monitorCameraHealth,
		faceLandmarkerRef,
		processFrame,
		startCamera,
	]);

	const stopTracking = useCallback(async () => {
		if (animationFrameIdRef.current != null) {
			cancelAnimationFrame(animationFrameIdRef.current);
		}

		if (metricsIntervalIdRef.current != null) {
			clearInterval(metricsIntervalIdRef.current);
		}

		if (healthCheckIntervalRef.current != null) {
			clearInterval(healthCheckIntervalRef.current);
		}

		if (scanningTimerRef.current != null) {
			clearTimeout(scanningTimerRef.current);
			scanningTimerRef.current = null;
		}
		stopCamera();
		setTrackingState({ isTrackingActive: false, trackingError: null });
		endSession();
		setIsScanning(false);
	}, [endSession, setTrackingState, stopCamera]);

	const getMetricsHistory = useCallback(() => {
		return metricsHistory;
	}, [metricsHistory]);

	const getStreamData = useCallback(() => {
		return streamDataRef.current;
	}, []);

	const updateDrawingOptions = useCallback((newOptions: Partial<EyeTrackingOptions>) => {
		console.log('Drawing options updated. Restart tracking to apply changes.', newOptions);
	}, []);

	// ============================================
	// EFFECTS
	// ============================================

	useEffect(() => {
		if (mediaStream) {
			keepMediaAlive(mediaStream);
		} else {
			stopMediaKeepAlive();
		}
	}, [keepMediaAlive, stopMediaKeepAlive, mediaStream]);

	// ✅ System event listeners
	useEffect(() => {
		const unsubscribeSuspend = window.ipc.onSystemSuspend(() => {
			console.log('[System] 💤 Suspend detected - preparing for sleep');
			if (metricsIntervalIdRef.current) {
				clearInterval(metricsIntervalIdRef.current);
			}
		});

		const unsubscribeResume = window.ipc.onSystemResume(async () => {
			console.log('[System] ☀️ Resume detected - recovering camera');
			await new Promise((resolve) => setTimeout(resolve, 2000));
			handleCameraDisconnection();
		});

		const unsubscribeLock = window.ipc.onSystemLock(() => {
			console.log('[System] 🔒 Screen locked');
		});

		const unsubscribeUnlock = window.ipc.onSystemUnlock(async () => {
			console.log('[System] 🔓 Screen unlocked - checking camera');
			await new Promise((resolve) => setTimeout(resolve, 1000));
			monitorCameraHealth();
		});

		return () => {
			unsubscribeSuspend();
			unsubscribeResume();
			unsubscribeLock();
			unsubscribeUnlock();
		};
	}, [mediaStream, monitorCameraHealth, handleCameraDisconnection]);

	// ✅ Periodic health check
	useEffect(() => {
		healthCheckIntervalRef.current = setInterval(() => {
			monitorCameraHealth();
		}, 3000); // Check every 3 seconds

		return () => {
			if (healthCheckIntervalRef.current) {
				clearInterval(healthCheckIntervalRef.current);
			}
		};
	}, [monitorCameraHealth]);

	// ✅ Clear conflict warning after 30 seconds
	useEffect(() => {
		if (cameraConflictWarning) {
			cameraConflictTimeoutRef.current = setTimeout(() => {
				setCameraConflictWarning(false);
			}, 30000);
		}

		return () => {
			if (cameraConflictTimeoutRef.current) {
				clearTimeout(cameraConflictTimeoutRef.current);
			}
		};
	}, [cameraConflictWarning]);

	// Auto-start tracking
	useEffect(() => {
		startTracking();
		return () => {
			if (recoveryTimeoutRef.current) {
				clearTimeout(recoveryTimeoutRef.current);
			}
			if (scanningTimerRef.current) {
				clearTimeout(scanningTimerRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // ✅ Empty array - only run once on mount

	return {
		videoRef,
		canvasRef,
		metrics: currentMetrics,
		isActive: isTrackingActive,
		cameraReady: isCameraActive,
		streamData: streamDataRef.current,
		loading,
		isScanning,
		cameraConflictWarning, // ✅ NEW: Expose conflict warning state
		startTracking,
		stopTracking,
		getMetricsHistory,
		getStreamData,
		isInitialized,
		drawingColors,
		updateDrawingOptions,
		colorSchemes: COLOR_SCHEMES,
		stream: mediaStream,
	};
};
