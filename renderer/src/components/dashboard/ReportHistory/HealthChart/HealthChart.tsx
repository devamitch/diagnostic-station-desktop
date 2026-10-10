import { useHealthScoreTimeline } from '@/hooks/usePeriodicHealthScore';
import { useMemo, useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import styles from './HealthChart.module.css';

const HEALTH_DOMAIN = [0, 100]; // Health score range

export function HealthRateChart() {
	const { currentScore, bufferedScore, realTimeChartData, getChartDataForPeriod } =
		useHealthScoreTimeline();

	const [selectedPeriod, setSelectedPeriod] = useState<'hour' | 'day' | 'week'>('hour');

	// Memoized chart data based on selected period
	const healthRateChartData = useMemo(() => {
		if (selectedPeriod === 'hour') {
			return realTimeChartData;
		}
		return getChartDataForPeriod(selectedPeriod);
	}, [selectedPeriod, realTimeChartData, getChartDataForPeriod]);

	// Memoized chart component
	const healthRateChart = useMemo(() => {
		const lastUpdate = new Date().toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});

		return (
			<div className={styles.chartContainer}>
				<div className={styles.chartHeader}>
					<h3>Eye Health Score</h3>
					<div className={styles.chartStats}>
						<div className={styles.scoreDisplay}>
							<span className={styles.currentScore}>{currentScore}%</span>
							<span className={styles.scoreLabel}>Current</span>
						</div>
						<div className={styles.periodSelector}>
							<select
								value={selectedPeriod}
								onChange={(e) => setSelectedPeriod(e.target.value as any)}
								className={styles.periodSelect}
							>
								<option value="hour">Live</option>
								<option value="day">24 Hours</option>
								<option value="week">7 Days</option>
							</select>
						</div>
					</div>
				</div>

				<div className={styles.chart}>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart
							data={healthRateChartData}
							margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
							<XAxis
								dataKey="time"
								tick={{ fontSize: 10 }}
								axisLine={false}
								tickLine={false}
								interval={selectedPeriod === 'hour' ? 0 : 'preserveStartEnd'}
							/>
							<YAxis
								tick={{ fontSize: 10 }}
								axisLine={false}
								tickLine={false}
								width={30}
								domain={HEALTH_DOMAIN}
							/>
							<Tooltip
								content={({ active, payload, label }: any) => {
									if (active && payload && payload.length) {
										return (
											<div className={styles.customTooltip}>
												<p className={styles.tooltipLabel}>{label}</p>
												<p className={styles.tooltipValue}>
													Health Score: {payload[0].value}%
												</p>
												<p className={styles.tooltipSubtext}>
													{selectedPeriod === 'hour'
														? 'Live data'
														: `${selectedPeriod} average`}
												</p>
											</div>
										);
									}
									return null;
								}}
							/>
							<Bar dataKey="heartRate" name="Health Score" radius={[4, 4, 0, 0]}>
								{healthRateChartData.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={getHealthScoreColor(entry.heartRate)}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>

				<div className={styles.chartFooter}>
					<span className={styles.lastUpdate}>Last update: {lastUpdate}</span>
					<div className={styles.legend}>
						<div className={styles.legendItem}>
							<div
								className={styles.legendColor}
								style={{ backgroundColor: 'var(--lowValue)' }}
							/>
							<span>Good (80-100%)</span>
						</div>
						<div className={styles.legendItem}>
							<div
								className={styles.legendColor}
								style={{ backgroundColor: 'var(--modValue)' }}
							/>
							<span>Moderate (60-79%)</span>
						</div>
						<div className={styles.legendItem}>
							<div
								className={styles.legendColor}
								style={{ backgroundColor: 'var(--highValue)' }}
							/>
							<span>Needs Attention (0-59%)</span>
						</div>
					</div>
				</div>
			</div>
		);
	}, [healthRateChartData, currentScore, selectedPeriod]);

	return healthRateChart;
}

// Helper function for health score colors
function getHealthScoreColor(score: number): string {
	if (score >= 80) return 'var(--lowValue)'; // Green - Good
	if (score >= 60) return 'var(--modValue)'; // Yellow - Moderate
	return 'var(--highValue)'; // Red - Needs attention
}
