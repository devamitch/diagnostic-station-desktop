'use client';
import React from 'react';
import styles from './ProductivityHealth.module.css';
import useTranslationData from '@/hooks/use-translation-data';
import useAppStore from '@/store';
import { Eye, Laugh, SquareCheckBigIcon } from 'lucide-react';


const ProductivityHealth: React.FC = () => {
	const eyeTracking = useAppStore?.((state) => state?.eyeTracking) || {};
	const currentMetrics = eyeTracking?.currentMetrics || {};
	const history = eyeTracking?.history || [];
	const selectedTimeframe = eyeTracking?.selectedTimeframe || 'daily';
	const selectedDate = eyeTracking?.selectedDate || null;
	const getMetricsForDate = eyeTracking?.getMetricsForDate || (() => ({}));
	const { reportCardText, productivityHealthText } = useTranslationData();

	// Get metrics for the selected date or use current metrics
	const getMetricsForDisplay = () => {
		if (selectedDate) {
			const dateMetrics = getMetricsForDate?.(selectedDate);
			if (dateMetrics.length > 0) {
				// Return the most recent metrics for the selected date
				return dateMetrics[dateMetrics.length - 1];
			}
		}

		// Fallback to most recent metrics for the selected timeframe
		const recentMetrics =
			history[selectedTimeframe]?.[history[selectedTimeframe].length - 1] || currentMetrics;
		return recentMetrics;
	};

	const displayMetrics = getMetricsForDisplay?.();

	// Calculate overall health score based on metrics
	const calculateHealthScore = () => {
		const blinkScore = Math.max(0, Math.min(100, (displayMetrics.blinkRate / 20) * 100));
		const strainScore = Math.max(0, 100 - displayMetrics.strainLevelIdx * 33);
		const attentionScore = displayMetrics.attentionFrac * 100;
		const tiredScore = Math.max(0, 100 - displayMetrics.perClose * 2);

		return Math.round((blinkScore + strainScore + attentionScore + tiredScore) / 4);
	};

	const healthScore = calculateHealthScore();

	const getDisplayTimestamp = () => {
		if (selectedDate) {
			const dateMetrics = getMetricsForDate?.(selectedDate);
			if (dateMetrics.length > 0) {
				return new Date(dateMetrics[dateMetrics.length - 1].timestamp).toLocaleString(
					'en-US',
					{
						day: '2-digit',
						month: 'short',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						hour12: false,
					}
				);
			}
		}

		const data = history[selectedTimeframe];
		if (data && data.length > 0) {
			return new Date(data[data.length - 1].timestamp).toLocaleString('en-US', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			});
		}
		return new Date().toLocaleString('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		});
	};

	// Determine condition based on metrics
	const getCondition = () => {
		if (displayMetrics.strainText === 'High' || displayMetrics.tiredText === 'Very High') {
			return reportCardText.conditions.high;
		} else if (
			displayMetrics.strainText === 'Moderate' ||
			displayMetrics.tiredText === 'High'
		) {
			return reportCardText.conditions.moderate;
		} else {
			return reportCardText.conditions.normal;
		}
	};

	// Get state configuration based on health score
	const getStateConfig = (): StateConfig => {
		if (healthScore >= 90) {
			return { primary: productivityHealthText.states.Good, color: 'var(--lowValue)', highlighted: ['Flow'] };
		} else if (healthScore >= 80) {
			return { primary: productivityHealthText.states.Good, color: 'var(--lowValue)', highlighted: ['Control'] };
		} else if (healthScore >= 70) {
			return { primary: productivityHealthText.states.Good, color: 'var(--lowValue)', highlighted: ['Relax'] };
		} else if (healthScore >= 55) {
			return { primary: productivityHealthText.states.Moderate, color: 'var(--modValue)', highlighted: ['Boredom'] };
		} else if (healthScore >= 40) {
			return { primary: productivityHealthText.states.Moderate, color: 'var(--modValue)', highlighted: ['Apathy'] };
		} else if (healthScore >= 25) {
			return { primary: productivityHealthText.states.High, color: 'var(--highValue)', highlighted: ['Worry'] };
		} else if (healthScore >= 15) {
			return { primary: productivityHealthText.states.High, color: 'var(--highValue)', highlighted: ['Anxiety'] };
		} else {
			return { primary: productivityHealthText.states.High, color: 'var(--highValue)', highlighted: ['Arousal'] };
		}
	};

	const emotions: Emotion[] = [
		{ name: 'Boredom', angle: 270, emoji: '/emotions-emoji/crazy.svg' },
		{ name: 'Flow', angle: 315, emoji: '/emotions-emoji/smile.svg' },
		{ name: 'Control', angle: 0, emoji: '/emotions-emoji/star-face.svg' },
		{ name: 'Relax', angle: 45, emoji: '/emotions-emoji/relieved-02.svg' },
		{ name: 'Apathy', angle: 90, emoji: '/emotions-emoji/nerd.svg' },
		{ name: 'Worry', angle: 135, emoji: '/emotions-emoji/senseless.svg' },
		{ name: 'Anxiety', angle: 180, emoji: '/emotions-emoji/smile-dizzy.svg' },
		{ name: 'Arousal', angle: 225, emoji: '/emotions-emoji/shocked.svg' },
	];

	const getEmotionPosition = (angle: number): Position => {
		const radius = 140;
		const rad = (angle * Math.PI) / 180;
		return {
			x: Math.cos(rad) * radius,
			y: Math.sin(rad) * radius,
		};
	};

	const currentConfig = getStateConfig();

	return (
		<div className={styles.card}>
			<div>
				<div className={styles.header}>
					<div className={styles.titleSection}>
						<div>
							<h2 className={styles.title}>
								<Eye />
								{reportCardText.title}
							</h2>
							<p className={styles.subtitle}>
								{reportCardText.subtitle} {Math.round(healthScore)}%
							</p>
						</div>
					</div>
					<p className={styles.date}>{getDisplayTimestamp?.()}</p>
				</div>
				<p className={styles.conditionSection}>
					<SquareCheckBigIcon size={20} /> {getCondition()}
				</p>
			</div>

			<div className={styles.visualizationWrapper}>
				<svg className={styles.visualization} viewBox="-200 -200 400 400">
					{emotions.map((emotion) => {
						const pos = getEmotionPosition(emotion.angle);
						const isHighlighted = currentConfig.highlighted.includes(emotion.name);

						return (
							<g key={emotion.name}>
								<circle
									cx={pos.x}
									cy={pos.y}
									r="40"
									className={`${styles.emotionBubble} ${isHighlighted ? styles.highlighted : ''}`}
									style={
										{
											'--highlight-color': isHighlighted
												? currentConfig.color
												: 'transparent',
										} as React.CSSProperties
									}
								/>
								{isHighlighted && (
									<line
										x1={pos.x * 0.25}
										y1={pos.y * 0.25}
										x2={pos.x * 0.7}
										y2={pos.y * 0.7}
										className={styles.connectionLine}
										style={
											{
												'--line-color': currentConfig.color,
											} as React.CSSProperties
										}
									/>
								)}
								<image
									x={pos.x - 15}
									y={pos.y - 22}
									width="30"
									height="30"
									href={emotion.emoji}
								/>
								<text x={pos.x} y={pos.y + 22} className={styles.emotionLabel}>
									{productivityHealthText.emotions[emotion.name]}
								</text>
							</g>
						);
					})}

					<circle
						cx="0"
						cy="0"
						r="75"
						className={styles.centerCircle}
						style={{ '--center-color': currentConfig.color } as React.CSSProperties}
					/>
					<text x="0" y="-5" className={styles.centerText}>
						{currentConfig.primary}
					</text>
					<text x="0" y="15" className={styles.centerSubtext}>
							{productivityHealthText.centerText}
					</text>
					<text x="0" y="30" className={styles.centerSubtext}>
						{productivityHealthText.centerSubtext}
					</text>
				</svg>
			</div>
		</div>
	);
};

export default ProductivityHealth;
