import Dialog from '@/components/layout/Modal/Dialog';
import useTranslationData from '@/hooks/use-translation-data';
import useAppStore from '@/store';
import { ExerciseCardData } from '@/types';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import styles from './ExerciseModal.module.css';
import FooterButton from './FooterButton/FooterButton';

// Dynamic import for GumletPlayer to avoid SSR issues
const GumletPlayer = dynamic(
	() => import('@gumlet/react-embed-player').then(mod => ({ default: mod.GumletPlayer })),
	{ 
		ssr: false,
		loading: () => (
			<div style={{ 
				width: '100%', 
				height: '400px', 
				display: 'flex', 
				alignItems: 'center', 
				justifyContent: 'center',
				backgroundColor: '#000',
				color: '#fff'
			}}>
				Loading player...
			</div>
		)
	}
);

interface ExerciseModalProps {
	isOpen: boolean;
	onClose: () => void;
	exercise: ExerciseCardData | null;
	currentMetrics: EyeMetrics | null;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({
	isOpen,
	onClose,
	exercise,
	currentMetrics,
}) => {
	// Zustand store
	const {
		startExercise,
		updateExerciseProgress,
		completeExercise,
		pauseExercise,
		restartExercise,
		getExerciseProgress,
	} = useAppStore((state) => state.exercise);

	// Local state
	const [videoEnded, setVideoEnded] = useState(false);
	const [isVideoReady, setIsVideoReady] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);

	const { exerciseModalText } = useTranslationData();

	// Load existing progress when modal opens
	useEffect(() => {
		if (isOpen && exercise) {
			const progress = getExerciseProgress(exercise.videoUrl);

			if (!progress || progress.isCompleted || progress.currentTime === 0) {
				// Start new exercise
				const metrics = currentMetrics
					? {
							blinkRate: currentMetrics.blinkRate,
							perClose: currentMetrics.perClose,
							strainText: currentMetrics.strainText,
							attBinary: currentMetrics.attBinary,
							timestamp: new Date().toISOString(),
						}
					: null;

				startExercise(exercise.videoUrl, exercise.title, metrics);
			}
		}
	}, [isOpen, exercise]);

	// Reset video state when modal closes
	useEffect(() => {
		if (!isOpen) {
			setVideoEnded(false);
			setIsVideoReady(false);
		}
	}, [isOpen]);

	// Gumlet player event handlers
	const handlePlayerReady = () => {
		setIsVideoReady(true);
	};

	const handleTimeUpdate = (time: number) => {
		setCurrentTime(time);
		if (exercise) {
			updateExerciseProgress(exercise.videoUrl, time, 0); 
		}
	};

	const handleVideoEnd = () => {
		if (!exercise) return;

		setVideoEnded(true);

		const metrics = currentMetrics
			? {
					blinkRate: currentMetrics.blinkRate,
					perClose: currentMetrics.perClose,
					strainText: currentMetrics.strainText,
					attBinary: currentMetrics.attBinary,
					timestamp: new Date().toISOString(),
				}
			: null;

		completeExercise(exercise.videoUrl, metrics);
	};

	const handleExerciseComplete = () => {
		if (!exercise || !currentMetrics) return;

		const metrics = {
			blinkRate: currentMetrics.blinkRate,
			perClose: currentMetrics.perClose,
			strainText: currentMetrics.strainText,
			attBinary: currentMetrics.attBinary,
			timestamp: new Date().toISOString(),
		};

		completeExercise(exercise.videoUrl, metrics);
		setVideoEnded(true);
	};

	const handleRestartExercise = () => {
		if (!exercise) return;

		setVideoEnded(false);

		const metrics = currentMetrics
			? {
					blinkRate: currentMetrics.blinkRate,
					perClose: currentMetrics.perClose,
					strainText: currentMetrics.strainText,
					attBinary: currentMetrics.attBinary,
					timestamp: new Date().toISOString(),
				}
			: null;

		restartExercise(exercise.videoUrl, metrics);
	};

	const handleClose = () => {
		if (exercise && currentTime > 0 && !videoEnded) {
			pauseExercise(exercise.videoUrl, currentTime);
		}

		setVideoEnded(false);
		setCurrentTime(0);
		setIsVideoReady(false);
		onClose();
	};

	if (!exercise) return null;

	const progress = getExerciseProgress(exercise.videoUrl);
	const metricsComparison = progress
		? {
				before: progress.metricsBeforeExercise,
				after: progress.metricsAfterExercise,
				improvement: progress.improvement,
			}
		: null;

	const getStatusClass = (value: number, type: string) => {
		switch (type) {
			case 'blinkRate':
				return value < 10 ? styles.high : value < 15 ? styles.moderate : styles.low;
			case 'perClose':
				return value > 40
					? styles.veryHigh
					: value > 20
						? styles.high
						: value > 5
							? styles.moderate
							: styles.low;
			default:
				return styles.normal;
		}
	};

	const MetricsDisplay: React.FC<{ metrics: any; title: string }> = ({ metrics, title }) => (
		<div className={styles.metricsSection}>
			<h4 className={styles.metricsTitle}>{title}</h4>
			<div className={styles.metricsGrid}>
				<div className={styles.metricItem}>
					<span className={styles.metricLabel}>
						{exerciseModalText.metricLabels.blinkRate}
					</span>
					<span
						className={`${styles.metricValue} ${getStatusClass(metrics.blinkRate, 'blinkRate')}`}
					>
						{metrics.blinkRate.toFixed(1)}
						{exerciseModalText.units.bpm}
					</span>
				</div>

				<div className={styles.metricItem}>
					<span className={styles.metricLabel}>
						{exerciseModalText.metricLabels.eyeClosure}
					</span>
					<span
						className={`${styles.metricValue} ${getStatusClass(metrics.perClose, 'perClose')}`}
					>
						{metrics.perClose.toFixed(1)}%
					</span>
				</div>

				<div className={styles.metricItem}>
					<span className={styles.metricLabel}>
						{exerciseModalText.metricLabels.strainLevel}
					</span>
					<span
						className={`${styles.metricValue} ${styles[metrics.strainText.toLowerCase()]}`}
					>
						{metrics.strainText}
					</span>
				</div>

				<div className={styles.metricItem}>
					<span className={styles.metricLabel}>
						{exerciseModalText.metricLabels.attention}
					</span>
					<span
						className={`${styles.metricValue} ${metrics.attBinary ? styles.good : styles.poor}`}
					>
						{metrics.attBinary
							? exerciseModalText.attentionStates.good
							: exerciseModalText.attentionStates.poor}
					</span>
				</div>
			</div>
		</div>
	);

	return (
		<Dialog
			isOpen={isOpen}
			onClose={handleClose}
			footer={
				<FooterButton
					videoEnded={videoEnded}
					handleExerciseComplete={handleExerciseComplete}
					handleRestartExercise={handleRestartExercise}
				/>
			}
		>
			<div>
				<div className={styles.videoContainer}>
					<GumletPlayer
						videoID={exercise.videoUrl}
						title={exercise.title}
						style={{ height: '100%', width: '100%' ,  objectFit: 'contain' }}
						schemaOrgVideoObject={{
							'@context': 'https://schema.org',
							'@type': 'VideoObject',
							name: 'Gumlet',
							description: '',
							embedUrl: 'https://play.gumlet.io/embed/64bfb0913ed6e5096d66dc1e',
						}}
						preload={true}
						autoplay={true}
						muted={false}
						playsinline={true}
						
						onReady={handlePlayerReady}
						onTimeUpdate={handleTimeUpdate}
						onEnded={handleVideoEnd}
					/>
				</div>
			</div>

			<div className={styles.metricsContainer}>
				{!videoEnded && currentMetrics && (
					<div className={styles.metricsGrid}>
						<div className={styles.metricItem}>
							<span className={styles.metricLabel}>
								{exerciseModalText.metricLabels.blinkRate}
							</span>
							<span
								className={`${styles.metricValue} ${getStatusClass(currentMetrics.blinkRate, 'blinkRate')}`}
							>
								{currentMetrics.blinkRate.toFixed(1)}
								{exerciseModalText.units.bpm}
							</span>
						</div>

						<div className={styles.metricItem}>
							<span className={styles.metricLabel}>
								{exerciseModalText.metricLabels.eyeClosure}
							</span>
							<span
								className={`${styles.metricValue} ${getStatusClass(currentMetrics.perClose, 'perClose')}`}
							>
								{currentMetrics.perClose.toFixed(1)}%
							</span>
						</div>

						<div className={styles.metricItem}>
							<span className={styles.metricLabel}>
								{exerciseModalText.metricLabels.strainLevel}
							</span>
							<span
								className={`${styles.metricValue} ${styles[currentMetrics.strainText.toLowerCase()]}`}
							>
								{currentMetrics.strainText}
							</span>
						</div>

						<div className={styles.metricItem}>
							<span className={styles.metricLabel}>
								{exerciseModalText.metricLabels.attention}
							</span>
							<span
								className={`${styles.metricValue} ${currentMetrics.attBinary ? styles.good : styles.poor}`}
							>
								{currentMetrics.attBinary
									? exerciseModalText.attentionStates.good
									: exerciseModalText.attentionStates.poor}
							</span>
						</div>
					</div>
				)}

				{videoEnded && metricsComparison?.before && metricsComparison?.after && (
					<div className={styles.comparisonSection}>
						<h3 className={styles.comparisonTitle}>Exercise Results Comparison</h3>
						<div className={styles.comparisonGrid}>
							<MetricsDisplay
								metrics={metricsComparison.before}
								title="Before Exercise"
							/>
							<MetricsDisplay
								metrics={metricsComparison.after}
								title="After Exercise"
							/>
						</div>

						{metricsComparison.improvement && (
							<div className={styles.improvementSection}>
								<h4 className={styles.improvementTitle}>Improvement</h4>
								<div className={styles.improvementGrid}>
									<div className={styles.improvementItem}>
										<span>Blink Rate:</span>
										<span
											className={
												metricsComparison.improvement.blinkRate > 0
													? styles.positive
													: styles.negative
											}
										>
											{metricsComparison.improvement.blinkRate > 0 ? '+' : ''}
											{metricsComparison.improvement.blinkRate.toFixed(1)}
										</span>
									</div>
									<div className={styles.improvementItem}>
										<span>Eye Closure:</span>
										<span
											className={
												metricsComparison.improvement.perClose < 0
													? styles.positive
													: styles.negative
											}
										>
											{metricsComparison.improvement.perClose > 0 ? '+' : ''}
											{metricsComparison.improvement.perClose.toFixed(1)}%
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</Dialog>
	);
};

export default ExerciseModal;
