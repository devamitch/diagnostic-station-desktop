'use client';

import { CamScreen } from '@/components/dashboard/EyeTracking/camscreen/CamScreen';
import Dialog from '@/components/layout/Modal/Dialog';
import useTranslationData from '@/hooks/use-translation-data';
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import type { EyeMetrics } from '@/types/eyeTrackingHook';
import {
	AlertTriangle,
	Battery,
	Droplets,
	Eye,
	MapPin,
	Share2,
	StopCircle,
	Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import styles from './EyeScanModal.module.css';
import { getBlinkRateStatusHelper, getStatusClassHelper, getStatusLevel } from '@/utils/utility';

interface EyeScanModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentMetrics: EyeMetrics | null;
}


const EyeScanModal: React.FC<EyeScanModalProps> = ({ isOpen, onClose, currentMetrics }) => {
	const [isScanning, setIsScanning] = useState(false);
	const [scanCompleted, setScanCompleted] = useState(false);
	const [countdown, setCountdown] = useState(30);
	const [finalMetrics, setFinalMetrics] = useState<EyeMetrics | null>(null);
	const [previousMetrics, setPreviousMetrics] = useState<EyeMetrics | null>(null);
	const [faceScreenshot, setFaceScreenshot] = useState<string | null>(null);
	const [isSharing, setIsSharing] = useState(false);

	const { livePageText, eyeMetricsDisplayText } = useTranslationData();
	const t = useTranslations();
	const { videoRef, canvasRef, startTracking, isActive } = useEyeTrackingContext();

	const isScanningRef = useRef(false);
	const resultsContainerRef = useRef<HTMLDivElement>(null);

	const strainLabels = useMemo(
		() => [
			t.raw('strainLevels.low'),
			t.raw('strainLevels.moderate'),
			t.raw('strainLevels.high'),
			t.raw('strainLevels.veryHigh'),
		],
		[t]
	);

	const getBlinkRateStatus = useCallback(
		(value: number) => getBlinkRateStatusHelper(value, strainLabels),
		[strainLabels]
	);
	const getDrynessLevel = useCallback(
		(score: number) =>
			getStatusLevel(score, [0, 0.5], [strainLabels[2], strainLabels[1], strainLabels[0]]),
		[strainLabels]
	);
	const getRednessLevel = useCallback(
		(score: number) =>
			getStatusLevel(score, [0.4, 0.6], [strainLabels[2], strainLabels[1], strainLabels[0]]),
		[strainLabels]
	);
	const getDarkCircleLevel = useCallback(
		(score: number) =>
			getStatusLevel(score, [0.3, 0.6], [strainLabels[0], strainLabels[1], strainLabels[2]]),
		[strainLabels]
	);
	const getStatusClass = useCallback(
		(value: number, type: 'blinkRate' | 'perClose') =>
			getStatusClassHelper(value, type, styles),
		[]
	);
	const getBatteryStatus = (level: number) => {
		if (level <= 20) {
			return { text: t.raw('strainLevels.high'), status: 'high' };
		}
		if (level <= 50) {
			return { text: t.raw('strainLevels.moderate'), status: 'moderate' };
		}
		return { text: t.raw('strainLevels.low'), status: 'low' };
	};

	const captureScreenshot = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		try {
			return canvas.toDataURL('image/jpeg', 0.8);
		} catch (error) {
			console.error('Failed to capture screenshot:', error);
			return null;
		}
	}, [canvasRef]);

	const handleStopScan = useCallback(() => {
		isScanningRef.current = false;
		setIsScanning(false);
		if (currentMetrics) {
			if (finalMetrics) {
				setPreviousMetrics(finalMetrics);
			}
			setFinalMetrics({ ...currentMetrics });
			const screenshot = captureScreenshot();
			if (screenshot) {
				setFaceScreenshot(screenshot);
			}
		}
		setScanCompleted(true);
	}, [currentMetrics, finalMetrics, captureScreenshot]);

	const handleClose = useCallback(() => {
		isScanningRef.current = false;
		setIsScanning(false);
		setScanCompleted(false);
		setCountdown(30);
		setFinalMetrics(null);
		setFaceScreenshot(null);
		onClose();
	}, [onClose]);

	const handleShare = useCallback(async () => {
		const resultsContainer = resultsContainerRef.current;
		if (!resultsContainer) {
			console.error('Results container not found');
			toast.error('Failed to capture results. Please try again.');
			return;
		}

		setIsSharing(true);

		try {
			// Dynamically import html2canvas
			const html2canvas = (await import('html2canvas')).default;

			// Capture the entire results container
			const canvas = await html2canvas(resultsContainer, {
				backgroundColor: '#f1f1ebff',
				scale: 2,
				logging: false,
				useCORS: true,
				allowTaint: true,
			});

			// Convert canvas to data URL
			const imageDataUrl = canvas.toDataURL('image/png', 0.95);

			// Check if we're in Electron
			if (window.ipc) {
				// Electron environment - use native share
				const result = await window.ipc.shareImage(imageDataUrl);

				if (result.success) {
					toast.success(result.message || 'Share dialog opened!');
				} else {
					toast.error(result.error || 'Failed to open share dialog');
				}
				setIsSharing(false);
				return;
			}

			// Web environment - use Web Share API only
			canvas.toBlob(
				async (blob) => {
					if (!blob) {
						toast.error('Failed to generate image. Please try again.');
						setIsSharing(false);
						return;
					}

					// Try Web Share API (works on mobile/modern browsers)
					if (navigator.share && navigator.canShare) {
						try {
							const file = new File([blob], `eye-scan-${Date.now()}.png`, {
								type: 'image/png',
							});

							if (navigator.canShare({ files: [file] })) {
								await navigator.share({
									title: 'Eye Health Scan Results',
									text: 'Check out my eye health scan results!',
									files: [file],
								});
								toast.success('Shared successfully!');
							} else {
								toast.error('Sharing not supported on this device');
							}
						} catch (shareError: any) {
							if (shareError.name === 'AbortError') {
								// User cancelled
								console.log('Share cancelled by user');
							} else {
								toast.error('Failed to share image');
								console.error('Share error:', shareError);
							}
						}
					} else {
						toast.error('Sharing not supported on this browser');
					}

					setIsSharing(false);
				},
				'image/png',
				0.95
			);
		} catch (error) {
			console.error('Failed to share:', error);
			toast.error('Failed to share results. Please try again.');
			setIsSharing(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen && !isScanning && !scanCompleted) {
			isScanningRef.current = true;
			setIsScanning(true);
			setScanCompleted(false);
			setCountdown(30);
			setFaceScreenshot(null);

			if (!isActive) {
				startTracking().catch((error) => {
					console.error('Failed to start scan:', error);
				});
			}
		}
	}, [isOpen, isScanning, scanCompleted, isActive, startTracking]);

	useEffect(() => {
		if (!isScanning) return;

		let currentCount = 30;
		const interval = setInterval(() => {
			currentCount -= 1;
			setCountdown(currentCount);

			if (currentCount <= 0 && isScanningRef.current) {
				handleStopScan();
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [isScanning]);

	const allMetrics = useMemo(() => {
		if (!finalMetrics) return [];

		return [
			{
				icon: <Battery size={36} />,
				label: eyeMetricsDisplayText.metricLabels.batteryLevel,
				value: `${(finalMetrics.batteryLevel || 100).toFixed(0)}%`,
				recommendedValue: '50% -70%',
				status: getBatteryStatus(finalMetrics.batteryLevel || 100).status,
			},
			{
				icon: <AlertTriangle size={36} />,
				label: eyeMetricsDisplayText.metricLabels.eyeStrain,
				value: finalMetrics.strainText,
				recommendedValue: eyeMetricsDisplayText.recommendedValues.eyeStrain,
				status: finalMetrics.strainText.toLowerCase(),
			},
			{
				icon: <Eye size={36} />,
				label: eyeMetricsDisplayText.metricLabels.blinkRate,
				value: finalMetrics.blinkRate.toFixed(1),
				recommendedValue: eyeMetricsDisplayText.recommendedValues.blinkRate,
				status: getBlinkRateStatus(finalMetrics.blinkRate),
			},
			{
				icon: <AlertTriangle size={36} />,
				label: eyeMetricsDisplayText.metricLabels.rednessScore,
				value: getRednessLevel(finalMetrics.rednessScore || 0).text,
				recommendedValue: eyeMetricsDisplayText.recommendedValues.rednessScore,
				status: getRednessLevel(finalMetrics.rednessScore || 0).status,
			},
			{
				icon: <Eye size={36} />,
				label: eyeMetricsDisplayText.metricLabels.squintIntensity,
				value: `${finalMetrics.squintIntensity.toFixed(1)} %`,
				recommendedValue: eyeMetricsDisplayText.recommendedValues.squintIntensity,
				status: finalMetrics.squintIntensity > 30 ? strainLabels[2] : strainLabels[0],
			},

			{
				icon: <Droplets size={36} />,
				label: eyeMetricsDisplayText.metricLabels.drynessScore,
				value: getDrynessLevel(finalMetrics.drynessScore || 0).text,
				recommendedValue: eyeMetricsDisplayText.recommendedValues.drynessScore,
				status: getDrynessLevel(finalMetrics.drynessScore || 0).status,
			},
			{
				icon: <MapPin size={36} />,
				label: eyeMetricsDisplayText.metricLabels.proximityScore,
				value: finalMetrics.proximityScore
					? finalMetrics.proximityScore.toFixed(0)
					: '0.000',
				recommendedValue: eyeMetricsDisplayText.recommendedValues.proximityScore,
				status:
					(finalMetrics.proximityScore || 0) > 0.5 ? strainLabels[2] : strainLabels[0],
			},
			{
				icon: <Zap size={36} />,
				label: 'Dark Circle Score',
				value: getDarkCircleLevel(finalMetrics.darkCircleScore || 0).text,
				recommendedValue: eyeMetricsDisplayText.recommendedValues.drynessScore,
				status: getDarkCircleLevel(finalMetrics.darkCircleScore || 0).status,
			},
		];
	}, [
		finalMetrics,
		eyeMetricsDisplayText.metricLabels.blinkRate,
		eyeMetricsDisplayText.metricLabels.eyeStrain,
		eyeMetricsDisplayText.metricLabels.batteryLevel,
		eyeMetricsDisplayText.metricLabels.rednessScore,
		eyeMetricsDisplayText.metricLabels.squintIntensity,
		eyeMetricsDisplayText.metricLabels.drynessScore,
		eyeMetricsDisplayText.metricLabels.proximityScore,
		eyeMetricsDisplayText.recommendedValues.blinkRate,
		eyeMetricsDisplayText.recommendedValues.eyeStrain,
		eyeMetricsDisplayText.recommendedValues.rednessScore,
		eyeMetricsDisplayText.recommendedValues.squintIntensity,
		eyeMetricsDisplayText.recommendedValues.drynessScore,
		eyeMetricsDisplayText.recommendedValues.proximityScore,
		getBlinkRateStatus,
		getRednessLevel,
		strainLabels,
		getDrynessLevel,
		getDarkCircleLevel,
	]);

	return (
		<Dialog
			isOpen={isOpen}
			onClose={handleClose}
			footer={
				scanCompleted && (
					<div className={styles.resultsFooter}>
						<button
							onClick={handleShare}
							className={styles.shareButton}
							disabled={isSharing}
						>
							{isSharing ? (
								<>
									<div className={styles.shareSpinner} />
									Sharing...
								</>
							) : (
								<>
									<Share2 size={20} />
									Share Results
								</>
							)}
						</button>
					</div>
				)
			}
		>
			<div className={styles.modalContainer}>
				{isScanning && (
					<div className={styles.cameraContainer}>
						<CamScreen
							oldVideoRef={videoRef}
							oldCanvasRef={canvasRef}
							isActive={isActive}
						/>
						<div className={styles.metricsOverlay}>
							{currentMetrics && (
								<div className={styles.metricsRow}>
									<div>
										<span className={styles.overlayLabel}>
											{livePageText.eyeScan.metricLabels.blinkRate}
										</span>
										<span
											className={`${styles.overlayValue} ${getStatusClass(currentMetrics.blinkRate, 'blinkRate')}`}
										>
											{currentMetrics.blinkRate.toFixed(1)} bpm
										</span>
									</div>
									<div>
										<span className={styles.overlayLabel}>
											{livePageText.eyeScan.metricLabels.eyeClosure}
										</span>
										<span
											className={`${styles.overlayValue} ${getStatusClass(currentMetrics.perClose, 'perClose')}`}
										>
											{currentMetrics.perClose.toFixed(1)}%
										</span>
									</div>
									<div>
										<span className={styles.overlayLabel}>
											{livePageText.eyeScan.metricLabels.strainLevel}
										</span>
										<span
											className={`${styles.overlayValue} ${styles[currentMetrics.strainText.toLowerCase()]}`}
										>
											{currentMetrics.strainText}
										</span>
									</div>
									<div>
										<span className={styles.overlayLabel}>
											{livePageText.eyeScan.metricLabels.attention}
										</span>
										<span
											className={`${styles.overlayValue} ${currentMetrics.attBinary ? styles.good : styles.poor}`}
										>
											{currentMetrics.attBinary
												? livePageText.eyeScan.attentionStates.good
												: livePageText.eyeScan.attentionStates.poor}
										</span>
									</div>
								</div>
							)}
						</div>
						<div className={styles.scanControls}>
							<div className={styles.timerDisplay}>
								<span>{countdown}</span>
							</div>
							<button onClick={handleStopScan} className={styles.stopButton}>
								<StopCircle size={20} />
								{livePageText.eyeScan.stopButton}
							</button>
						</div>
					</div>
				)}

				{scanCompleted && (
					<div className={styles.resultsContainer} ref={resultsContainerRef}>
						<div className={styles.resultsHeader}>
							<h2 className={styles.resultsTitle}>
								{livePageText.eyeScan.completedTitle}
							</h2>
							<p className={styles.resultSubtitle}>
								{livePageText.eyeScan.completedSubtitle}
							</p>
						</div>
						{faceScreenshot && (
							<div className={styles.screenshotContainer}>
								<img
									src={faceScreenshot || '/placeholder.svg'}
									alt="Face scan"
									className={styles.faceScreenshot}
								/>
							</div>
						)}
						<div className={styles.scanResults}>
							<div className={styles.metricsGrid}>
								{allMetrics.map((metric) => (
									<div key={metric.label} className={styles.metricCard}>
										<div className={styles.cardIcon}>{metric.icon}</div>
										<div className={styles.cardContent}>
											<div className={styles.metricHeader}>
												<span className={styles.metricLabel}>
													{metric.label}
												</span>
												<span className={styles.recommendedValue}>
													{metric.recommendedValue}
												</span>
											</div>
											<div
												className={styles.metricValue}
												data-status={metric.status}
											>
												{metric.value}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		</Dialog>
	);
};

export default EyeScanModal;
