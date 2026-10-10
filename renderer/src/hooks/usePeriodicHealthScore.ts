import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import { EyeTrackingMetrics } from '@/types/eye-tracking';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Metrics = EyeTrackingMetrics;

// Helper function
const avgArray = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

export function useHealthScoreTimeline() {
	const { metrics: displayMetrics } = useEyeTrackingContext();
	const [minuteAvg, setMinuteAvg] = useState<number[]>([]);
	const [hourAvg, setHourAvg] = useState<number[]>([]);
	const [dayAvg, setDayAvg] = useState<number[]>([]);
	const [weekAvg, setWeekAvg] = useState<number[]>([]);
	const [monthAvg, setMonthAvg] = useState<number[]>([]);
	const [yearAvg, setYearAvg] = useState<number[]>([]);
	const [allTimeAvg, setAllTimeAvg] = useState<number | null>(null);

	// Refs for buffers
	const sixSecBuffer = useRef<number[]>([]);
	const minuteBuffer = useRef<number[]>([]);
	const hourBuffer = useRef<number[]>([]);
	const dayBuffer = useRef<number[]>([]);
	const weekBuffer = useRef<number[]>([]);
	const monthBuffer = useRef<number[]>([]);
	const yearBuffer = useRef<number[]>([]);

	// 🔹 Compute health score with useCallback for optimization
	const computeHealthScore = useCallback((metrics: Metrics): number => {
		if (!metrics) return 0;

		try {
			const blinkScore = Math.max(0, Math.min(100, (metrics.blinkRate / 20) * 100));
			const strainScore = Math.max(0, 100 - metrics.strainLevelIdx * 33);
			const attentionScore = metrics.attentionFrac * 100;
			const tiredScore = Math.max(0, 100 - metrics.perClose * 2);

			return Math.round((blinkScore + strainScore + attentionScore + tiredScore) / 4);
		} catch (error) {
			console.error('Error computing health score:', error);
			return 0;
		}
	}, []);

	// 🔹 Get real-time current score
	const getCurrentScore = useCallback((): number => {
		if (!displayMetrics) return 0;
		return computeHealthScore(displayMetrics);
	}, [displayMetrics, computeHealthScore]);

	// 🔹 Initialize buffer with current score when metrics load
	useEffect(() => {
		if (displayMetrics && sixSecBuffer.current.length === 0) {
			const initialScore = getCurrentScore();
			sixSecBuffer.current = [initialScore];
		}
	}, [displayMetrics, getCurrentScore]);

	// 🔹 Sample every 6 seconds
	useEffect(() => {
		if (!displayMetrics) return;

		const interval = setInterval(() => {
			const healthScore = getCurrentScore();
			sixSecBuffer.current.push(healthScore);

			// Keep last 10 samples (1 minute of data)
			if (sixSecBuffer.current.length > 10) {
				sixSecBuffer.current = sixSecBuffer.current.slice(-10);
			}
		}, 6000);

		return () => clearInterval(interval);
	}, [displayMetrics, getCurrentScore]);

	// 🔹 Aggregate to minutes (every 60 seconds)
	useEffect(() => {
		const interval = setInterval(() => {
			if (sixSecBuffer.current.length === 0) return;

			const avg = avgArray(sixSecBuffer.current);
			minuteBuffer.current.push(avg);

			// Keep last 60 minutes
			setMinuteAvg((prev) => {
				const updated = [...prev, avg];
				return updated.length > 60 ? updated.slice(-60) : updated;
			});

			// Clear 6-second buffer for next minute
			sixSecBuffer.current = [];
		}, 60000);

		return () => clearInterval(interval);
	}, []);

	// 🔹 Aggregate to hours (every 60 minutes)
	useEffect(() => {
		const interval = setInterval(
			() => {
				if (minuteBuffer.current.length === 0) return;

				const avg = avgArray(minuteBuffer.current);
				hourBuffer.current.push(avg);

				// Keep last 24 hours
				setHourAvg((prev) => {
					const updated = [...prev, avg];
					return updated.length > 24 ? updated.slice(-24) : updated;
				});

				minuteBuffer.current = [];
			},
			60 * 60 * 1000
		);

		return () => clearInterval(interval);
	}, []);

	// 🔹 Aggregate to days (every 24 hours)
	useEffect(() => {
		const interval = setInterval(
			() => {
				if (hourBuffer.current.length === 0) return;

				const avg = avgArray(hourBuffer.current);
				dayBuffer.current.push(avg);

				// Keep last 30 days
				setDayAvg((prev) => {
					const updated = [...prev, avg];
					return updated.length > 30 ? updated.slice(-30) : updated;
				});

				hourBuffer.current = [];
			},
			24 * 60 * 60 * 1000
		);

		return () => clearInterval(interval);
	}, []);

	// 🔹 Aggregate to weeks (every 7 days)
	useEffect(() => {
		const interval = setInterval(
			() => {
				if (dayBuffer.current.length === 0) return;

				const avg = avgArray(dayBuffer.current);
				weekBuffer.current.push(avg);

				// Keep last 52 weeks
				setWeekAvg((prev) => {
					const updated = [...prev, avg];
					return updated.length > 52 ? updated.slice(-52) : updated;
				});

				dayBuffer.current = [];
			},
			7 * 24 * 60 * 60 * 1000
		);

		return () => clearInterval(interval);
	}, []);

	// 🔹 Aggregate to months (every 30 days)
	useEffect(() => {
		const interval = setInterval(
			() => {
				if (weekBuffer.current.length === 0) return;

				const avg = avgArray(weekBuffer.current);
				monthBuffer.current.push(avg);

				// Keep last 12 months
				setMonthAvg((prev) => {
					const updated = [...prev, avg];
					return updated.length > 12 ? updated.slice(-12) : updated;
				});

				weekBuffer.current = [];
			},
			30 * 24 * 60 * 60 * 1000
		);

		return () => clearInterval(interval);
	}, []);

	// 🔹 Aggregate to years (every 365 days)
	useEffect(() => {
		const interval = setInterval(
			() => {
				if (monthBuffer.current.length === 0) return;

				const avg = avgArray(monthBuffer.current);
				yearBuffer.current.push(avg);

				setYearAvg((prev) => [...prev, avg]);
				monthBuffer.current = [];

				// Update all-time average
				const totalAvg = avgArray(yearBuffer.current);
				setAllTimeAvg(totalAvg);
			},
			365 * 24 * 60 * 60 * 1000
		);

		return () => clearInterval(interval);
	}, []);

	// Calculate buffered score (average of last 6-second samples)
	const bufferedScore =
		sixSecBuffer.current.length > 0 ? avgArray(sixSecBuffer.current) : getCurrentScore();

	return {
		// Timeline averages
		minuteAvg,
		hourAvg,
		dayAvg,
		weekAvg,
		monthAvg,
		yearAvg,
		allTimeAvg,

		// Current scores
		currentScore: getCurrentScore(), // Real-time score
		bufferedScore, // Smoothed average of recent samples

		// Raw buffer for debugging
		recentSamples: sixSecBuffer.current,

		// Helper to get score for specific time period
		getScoreForPeriod: useCallback(
			(period: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year') => {
				const periods = {
					minute: minuteAvg,
					hour: hourAvg,
					day: dayAvg,
					week: weekAvg,
					month: monthAvg,
					year: yearAvg,
				};

				const periodData = periods[period];
				return periodData.length > 0 ? periodData[periodData.length - 1] : null;
			},
			[minuteAvg, hourAvg, dayAvg, weekAvg, monthAvg, yearAvg]
		),
		realTimeChartData: useMemo(() => {
			const now = new Date();
			return [
				{
					time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
					heartRate: getCurrentScore(),
					timestamp: now.getTime(),
				},
			];
		}, [getCurrentScore]),

		// Timeline chart data for different periods
		getChartDataForPeriod: useCallback(
			(period: 'hour' | 'day' | 'week') => {
				const now = new Date();
				let data: number[];
				let timeFormat: Intl.DateTimeFormatOptions;

				switch (period) {
					case 'hour':
						data = minuteAvg.slice(-60); // Last 60 minutes
						timeFormat = { hour: '2-digit', minute: '2-digit' };
						break;
					case 'day':
						data = hourAvg.slice(-24); // Last 24 hours
						timeFormat = { hour: '2-digit' };
						break;
					case 'week':
						data = dayAvg.slice(-7); // Last 7 days
						timeFormat = { weekday: 'short' };
						break;
					default:
						data = [];
						timeFormat = { hour: '2-digit', minute: '2-digit' };
				}

				return data.map((value, index) => {
					const time = new Date(
						now.getTime() -
							(data.length - index - 1) *
								(period === 'hour' ? 60000 : period === 'day' ? 3600000 : 86400000)
					);

					return {
						time: time.toLocaleTimeString([], timeFormat),
						heartRate: Math.round(value),
						timestamp: time.getTime(),
					};
				});
			},
			[minuteAvg, hourAvg, dayAvg]
		),
	};
}
