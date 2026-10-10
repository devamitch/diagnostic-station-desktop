// components/MetricChart/MetricChart.tsx
'use client';

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
	Cell,
} from 'recharts';
import { memo, useMemo, useCallback } from 'react';
import styles from '../ReportHistory/ReportHistoryGraph/reporthistorygraph.module.css';
import CustomTooltip from './Tooltip';
const MetricChartSkeleton = () => {
	return (
		<div className={styles.chartContainer}>
			{/* Header Skeleton */}
			<div className={styles.chartHeader}>
				<div className={styles.skeletonTitle}></div>
				<div className={styles.chartStats}>
					<div className={styles.skeletonText}></div>
				</div>
			</div>

			{/* Chart Area Skeleton */}
			<div className={styles.chart}>
				<div className={styles.chartSkeleton}>
					{/* Y-axis skeleton */}
					<div className={styles.yAxis}>
						<div className={styles.yTick}></div>
						<div className={styles.yTick}></div>
						<div className={styles.yTick}></div>
						<div className={styles.yTick}></div>
					</div>

					{/* Chart bars skeleton */}
					<div className={styles.barsContainer}>
						<div className={styles.skeletonBar}></div>
						<div className={styles.skeletonBar}></div>
						<div className={styles.skeletonBar}></div>
						<div className={styles.skeletonBar}></div>
						<div className={styles.skeletonBar}></div>
						<div className={styles.skeletonBar}></div>
					</div>

					{/* X-axis skeleton */}
					<div className={styles.xAxis}>
						<div className={styles.xTick}></div>
						<div className={styles.xTick}></div>
						<div className={styles.xTick}></div>
						<div className={styles.xTick}></div>
						<div className={styles.xTick}></div>
						<div className={styles.xTick}></div>
					</div>
				</div>
			</div>
		</div>
	);
};
const MetricChart = memo(
	({
		title,
		dataKey,
		color,
		data,
		lastUpdated,
		reportHistoryText,
		isLoading,
	}: {
		title: string;
		dataKey: string;
		color: string;
		data: any[];
		lastUpdated?: string | Date;
		reportHistoryText: any;
		isLoading: boolean;
	}) => {
		const formattedDateTime = useMemo(() => {
			if (!lastUpdated) return 'N/A';

			const date = new Date(lastUpdated);
			return date.toLocaleString('en-US', {
				dateStyle: 'medium',
				timeStyle: 'short',
			});
		}, [lastUpdated]);

		const yAxisDomain = dataKey === 'screenTimeMinutes' ? [0, 60] : ['auto', 'auto'];
		const getBarColor = useCallback(
			(value: number, dataKey: string) => {
				switch (dataKey) {
					case 'blinkRate':
						if (value < 10) return 'url(#highGradient)';
						if (value >= 10 && value <= 20) return 'url(#modGradient)';
						return 'url(#lowGradient)';

					case 'overallHealth':
						if (value < 50) return 'url(#highGradient)';
						if (value >= 50 && value <= 75) return 'url(#modGradient)';
						return 'url(#lowGradient)';

					case 'distanceCm':
						if (value < 30) return 'url(#highGradient)';
						if (value >= 30 && value <= 45) return 'url(#modGradient)';
						return 'url(#lowGradient)';
					case 'screenTimeMinutes':
						if (value > 45) return 'url(#highGradient)';
						if (value <= 45 && value >= 30) return 'url(#modGradient)';
						return 'url(#lowGradient)';
					default:
						return color;
				}
			},
			[color]
		);
		if (isLoading) return <MetricChartSkeleton />;
		return (
			<div className={styles.chartContainer}>
				<div className={styles.chartHeader}>
					<h3>{title}</h3>
					<div className={styles.chartStats}>
						<span className={styles.lastUpdate}>
							{reportHistoryText.lastUpdate}: {formattedDateTime}
						</span>
					</div>
				</div>
				<div className={styles.chart}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
							<defs>
								<linearGradient
									id="lowGradient"
									x1="0%"
									y1="0%"
									x2="100%"
									y2="100%"
								>
									<stop offset="0%" stopColor="#3F8A50" />
									<stop offset="100%" stopColor="#2D6A3B" />
								</linearGradient>
								<linearGradient
									id="modGradient"
									x1="0%"
									y1="0%"
									x2="100%"
									y2="100%"
								>
									<stop offset="0%" stopColor="#F2B94A" />
									<stop offset="100%" stopColor="#C9891E" />
								</linearGradient>
								<linearGradient
									id="highGradient"
									x1="0%"
									y1="0%"
									x2="100%"
									y2="100%"
								>
									<stop offset="0%" stopColor="#E25A4E" />
									<stop offset="100%" stopColor="#B73128" />
								</linearGradient>
								<linearGradient
									id="vHighGradient"
									x1="0%"
									y1="0%"
									x2="100%"
									y2="100%"
								>
									<stop offset="0%" stopColor="#C44540" />
									<stop offset="100%" stopColor="#8D1F1C" />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
							<XAxis
								dataKey="time"
								tick={{ fontSize: 10 }}
								axisLine={false}
								tickLine={false}
							/>
							<YAxis
								domain={yAxisDomain} // ✅ custom domain here
								tick={{ fontSize: 10 }}
								axisLine={false}
								tickLine={false}
								width={30}
							/>
							<Tooltip
								content={<CustomTooltip reportHistoryText={reportHistoryText} />}
							/>
							<Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]}>
								{data.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={getBarColor(entry[dataKey], dataKey)}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.title === nextProps.title &&
			prevProps.dataKey === nextProps.dataKey &&
			prevProps.color === nextProps.color &&
			prevProps.data === nextProps.data &&
			prevProps.lastUpdated === nextProps.lastUpdated
		);
	}
);
MetricChart.displayName = 'MetricChart';
export default MetricChart;