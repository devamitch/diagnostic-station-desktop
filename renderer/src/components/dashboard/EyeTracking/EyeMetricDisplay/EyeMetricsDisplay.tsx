'use client';

import ReportCard from '@/components/dashboard/ReportCard/ReportCard';
import useTranslationData from '@/hooks/use-translation-data';
import { AlertTriangle, Battery, Droplets, Eye, MapPin, ScanEye, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import styles from './EyeMetricsDisplay.module.css';
import MetricInfoPopup from './MetricInfoPopup';
import ProductivityHealth from '../../ProductivityHealth/ProductivityHealth';

interface EyeMetricsDisplayProps {
	metrics: EyeMetrics;
	className?: string;
	faceAge?: number;
	eyeAge?: number;
}

const EyeMetricsDisplay: React.FC<EyeMetricsDisplayProps> = ({ metrics, className = '' }) => {
	const [showPopup, setShowPopup] = useState(false);
	const [selectedMetric, setSelectedMetric] = useState<any>(null);
	const { eyeMetricsDisplayText } = useTranslationData();
	const t = useTranslations();

	const isScanning = false;

	const getMetricInfoData = (metricKey: string) => {
		return {
			title: t(`metricInfoData.${metricKey}.title`),
			description: t(`metricInfoData.${metricKey}.description`),
			healthy: t(`metricInfoData.${metricKey}.healthy`),
			whyItMatters: t(`metricInfoData.${metricKey}.whyItMatters`),
			quickWin: t(`metricInfoData.${metricKey}.quickWin`),
		};
	};

	const getStatus = (value: number, type: string) => {
		switch (type) {
			case 'blinkRate':
				return value < 10
					? t.raw('strainLevels.high')
					: value < 15
						? t.raw('strainLevels.moderate')
						: t.raw('strainLevels.low');
			case 'perClose':
				return value > 40
					? t.raw('strainLevels.veryHigh')
					: value > 20
						? t.raw('strainLevels.high')
						: value > 5
							? t.raw('strainLevels.moderate')
							: t.raw('strainLevels.low');
			case 'strain':
				return metrics.strainText.toLowerCase();
			case 'tiredness':
				return metrics.tiredText.toLowerCase().replace(' ', '-');
			default:
				return t.raw('strainLevels.low');
		}
	};

	const getStrainText = (text: string) => {
		if (text === 'Low') {
			return t.raw('strainLevels.low');
		} else if (text === 'Moderate') {
			return t.raw('strainLevels.moderate');
		} else if (text === 'High') {
			return t.raw('strainLevels.high');
		} else if (text === 'Very High') {
			return t.raw('strainLevels.veryHigh');
		} else {
			return text;
		}
	};

	const getBatteryStatus = (level: number) => {
		if (level <= 20) {
			return { text: t.raw('strainLevels.high'), status: 'high' };
		}
		if (level <= 50) {
			return { text: t.raw('strainLevels.moderate'), status: 'moderate' };
		}
		return { text: t.raw('strainLevels.low'), status: 'low' };
	};

	const getDrynessLevel = (score: number) => {
		if (score < 0) {
			const text = t.raw('strainLevels.high');
			return { text, status: text.toLowerCase().replace(' ', '-') };
		}
		if (score <= 0.5) {
			const text = t.raw('strainLevels.moderate');
			return { text, status: text.toLowerCase().replace(' ', '-') };
		}
		const text = t.raw('strainLevels.low');
		return { text, status: text.toLowerCase().replace(' ', '-') };
	};

	const getRednessLevel = (score: number) => {
		if (score < 0.4) {
			const text = t.raw('strainLevels.high');
			return { text, status: text.toLowerCase().replace(' ', '-') };
		}
		if (score <= 0.6) {
			const text = t.raw('strainLevels.moderate');
			return { text, status: text.toLowerCase().replace(' ', '-') };
		}
		const text = t.raw('strainLevels.low');
		return { text, status: text.toLowerCase().replace(' ', '-') };
	};

	const getDarkCircleLevel = (score: number) => {
		if (score < 0.3) {
			const text = t.raw('strainLevels.low');
			return { text, status: text.toLowerCase().replace(' ', '-') };
		}
		if (score <= 0.6) {
			const text = t.raw('strainLevels.moderate');
			return { text, status: text.toLowerCase().replace(' ', '-') };
		}
		const text = t.raw('strainLevels.high');
		return { text, status: text.toLowerCase().replace(' ', '-') };
	};

	const handleMetricClick = (metricKey: string) => {
		if (isScanning) return;
		const info = getMetricInfoData(metricKey);
		setSelectedMetric(info);
		setShowPopup(true);
	};

	const MetricCard: React.FC<{
		icon: React.ReactNode;
		labelKey: string;
		metricKey: string;
		value: string | number;
		recommendedValue: string;
		status?: string;
	}> = ({ icon, labelKey, metricKey, value, recommendedValue, status }) => (
		<div
			className={`${styles.metricCard} ${!isScanning ? styles.clickable : ''} ${isScanning ? styles.scanning : ''}`}
			onClick={() => handleMetricClick(metricKey)}
		>
			<div className={styles.cardIcon}>{icon}</div>
			<div className={styles.cardContent}>
				<div className={styles.metricHeader}>
					<span className={styles.metricLabel}>{t(`eyeMetrics.labels.${labelKey}`)}</span>
					<span className={styles.recommendedValue}>{recommendedValue}</span>
				</div>
				{isScanning ? (
					<div className={styles.scanningContainer}>
						<div className={styles.scanningBar}>
							<div className={styles.scanningProgress}></div>
						</div>
					</div>
				) : (
					<div className={styles.metricValue} data-status={status}>
						{value}
					</div>
				)}
			</div>
		</div>
	);

	const leftMetrics = [
		{
				icon: <Eye size={36} />,
				labelKey: 'eyeAge',
				metricKey: 'eyeAge',
				value: `${(metrics.eyeAge ?? 25).toFixed(0)} ${eyeMetricsDisplayText.units.years}`,
				recommendedValue: eyeMetricsDisplayText.recommendedValues.eyeAge,
				status: 'low',
		},
		{
			icon: <Eye size={36} />,
			labelKey: 'blinkRate',
			metricKey: 'blinkRate',
			value: metrics.blinkRate.toFixed(1),
			recommendedValue: eyeMetricsDisplayText.recommendedValues.blinkRate,
			status: getStatus(metrics.blinkRate, 'blinkRate'),
		},
		{
			icon: <MapPin size={36} />,
			labelKey: 'proximityScore',
			metricKey: 'screenDistance',
			value: `${metrics.proximityScore ? (metrics.proximityScore > 0 ? `${metrics.proximityScore.toFixed(0)} cm` : 'N/A') : 'N/A'}`,
			recommendedValue: eyeMetricsDisplayText.recommendedValues.proximityScore,
			status:
				(metrics.proximityScore || 0) > 0.5
					? t.raw('strainLevels.high')
					: t.raw('strainLevels.low'),
		},
		{
			icon: <ScanEye size={36} />,
			labelKey: 'squintIntensity',
			metricKey: 'squintIntensity',
			value: `${metrics.squintIntensity.toFixed(1)} %`,
			recommendedValue: eyeMetricsDisplayText.recommendedValues.squintIntensity,
			status: metrics.squintIntensity > 0 ? t.raw('strainLevels.low') : t.raw('strainLevels.high'),
		},
	];

	const rightMetrics = [
		{
			icon: <AlertTriangle size={36} />,
			labelKey: 'eyeStrain',
			metricKey: 'eyeStrain',
			value: getStrainText(metrics.strainText),
			recommendedValue: eyeMetricsDisplayText.recommendedValues.eyeStrain,
			status: getStatus(0, 'strain'),
		},
		{
			icon: <AlertTriangle size={36} />,
			labelKey: 'rednessScore',
			metricKey: 'rednessScore',
			value: getRednessLevel(metrics.rednessScore || 0).text,
			recommendedValue: eyeMetricsDisplayText.recommendedValues.rednessScore,
			status: getRednessLevel(metrics.rednessScore || 0).status,
		},
		{
			icon: <Droplets size={36} />,
			labelKey: 'drynessScore',
			metricKey: 'drynessScore',
			value: getDrynessLevel(metrics.drynessScore || 0).text,
			recommendedValue: eyeMetricsDisplayText.recommendedValues.drynessScore,
			status: getDrynessLevel(metrics.drynessScore || 0).status,
		},
		{
			icon: <Zap size={36} />,
			labelKey: 'darkCircleScore',
			metricKey: 'darkCircleScore',
			value: getDarkCircleLevel(metrics.darkCircleScore || 0).text,
			recommendedValue: eyeMetricsDisplayText.recommendedValues.darkcircleScore,
			status: getDarkCircleLevel(metrics.darkCircleScore || 0).status,
		},
	];

	const allMetrics = [...leftMetrics, ...rightMetrics];

	return (
		<div className={`${styles.container} ${className}`}>
			<div className={styles.metricsLayout}>
				<div className={styles.leftMetrics}>
					{leftMetrics.map((metric) => (
						<MetricCard
							key={metric.metricKey}
							icon={metric.icon}
							labelKey={metric.labelKey}
							metricKey={metric.metricKey}
							value={metric.value}
							recommendedValue={metric.recommendedValue}
							status={metric.status}
						/>
					))}
				</div>

				<div className={styles.centerReport}>
					{/* <ProductivityHealth/> */}
					<ReportCard />
				</div>

				<div className={styles.rightMetrics}>
					{rightMetrics.map((metric) => (
						<MetricCard
							key={metric.metricKey}
							icon={metric.icon}
							labelKey={metric.labelKey}
							metricKey={metric.metricKey}
							value={metric.value}
							recommendedValue={metric.recommendedValue}
							status={metric.status}
						/>
					))}
				</div>

				<div className={styles.metrics}>
					{allMetrics.map((metric) => (
						<MetricCard
							key={metric.metricKey}
							icon={metric.icon}
							labelKey={metric.labelKey}
							metricKey={metric.metricKey}
							value={metric.value}
							recommendedValue={metric.recommendedValue}
							status={metric.status}
						/>
					))}
				</div>
			</div>
			<MetricInfoPopup
				isOpen={showPopup}
				onClose={() => setShowPopup(false)}
				metricInfo={selectedMetric}
			/>
		</div>
	);
};

export default EyeMetricsDisplay;
