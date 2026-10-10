'use client';
import { useEffect, useRef, useState } from 'react';
import useTranslationData from '@/hooks/use-translation-data';
import useAppStore from '@/store';
import { Eye, Laugh, SquareCheckBigIcon } from 'lucide-react';
import styles from './ReportCard.module.css';

const ReportCard = () => {
	const eyeTracking = useAppStore?.((state) => state?.eyeTracking) || {};
	const currentMetrics = eyeTracking?.currentMetrics || {};
	const history = eyeTracking?.history || [];
	const selectedTimeframe = eyeTracking?.selectedTimeframe || 'daily';
	const selectedDate = eyeTracking?.selectedDate || null;
	const getMetricsForDate = eyeTracking?.getMetricsForDate || (() => ({}));
	const { reportCardText } = useTranslationData();
	const [batteryLevel, setBatteryLevel] = useState(0);
	const lastUpdateRef = useRef(0);

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

	// Use battery level from metrics
	const currentBatteryLevel = Math.round(displayMetrics?.batteryLevel ?? 100);
	const progressValue = (batteryLevel / 100) * 180;

	useEffect(() => {
		const now = Date.now();
		if (now - lastUpdateRef.current >= 5000) {
			setBatteryLevel(currentBatteryLevel);
			lastUpdateRef.current = now;
		}
	}, [currentBatteryLevel]);

	const getProgressColor = () => {
		if (batteryLevel < 30) {
			return 'var(--highValue)';
		} else if (batteryLevel < 70) {
			return 'var(--modValue)';
		} else {
			return 'var(--lightMetricValue)';
		}
	};

	// Get the timestamp for display
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

	// Determine condition based on battery level
	const getCondition = () => {
		if (batteryLevel < 50) {
			return reportCardText.conditions.high;
		} else if (batteryLevel < 70) {
			return reportCardText.conditions.moderate;
		} else {
			return reportCardText.conditions.normal;
		}
	};

	// Get appropriate emoji based on battery level
	const getEmoji = () => {
		if (batteryLevel >= 80) return Laugh;
		if (batteryLevel >= 60) return Eye;
		return Eye; // Default to eye icon for lower scores
	};

	const EmojiIcon = getEmoji();

	return (
		<div className={styles.card} role="article" aria-label="Eye health report card">
			<div>
				<div className={styles.header}>
					<div className={styles.titleSection}>
						<div>
							<p className={styles.title}>
								<Eye aria-hidden="true" />
								{reportCardText.title}
							</p>
							<p className={styles.subtitle}>
							{reportCardText.subtitle} {Math.round(batteryLevel)}%
							</p>
						</div>
					</div>
					<p className={styles.date}>{getDisplayTimestamp?.()}</p>
				</div>
				<p className={styles.conditionSection}>
					<SquareCheckBigIcon size={20} aria-hidden="true" /> {getCondition()}
				</p>
			</div>

			<div>
				<div 
					className={styles.progressWrapper}
					style={
						{
							'--progress-color': getProgressColor(),
						} as React.CSSProperties & Record<string, string>
					}
					aria-label={`battery level progress: ${batteryLevel} percent`}
				>
					<div
						className={styles.progress}
						style={
							{
								'--progress-rotation': `${progressValue}deg`,
							} as React.CSSProperties & Record<string, string>
						}
					/>
					<div className={styles.emojiCircle}>
						<span className={styles.emoji} aria-hidden="true">
							<EmojiIcon />
						</span>
					</div>
				</div>

				<div className={styles.statsBox}>
				<p className={styles.statsValue}>{batteryLevel}%</p>
					<p className={styles.statsFooter}>{reportCardText.statsFooter}</p>
				</div>
			</div>
		</div>
	);
};

export default ReportCard;