import { getTimeSlotPenalty } from '@/utils/battery';
import type { StateCreator } from 'zustand';
import { AppStoreState } from '..';

// Enhanced Eye tracking metrics interface
export interface EyeTrackingMetrics {
	timestamp: string;
	blinkRate: number;
	perClose: number;
	attentionFrac: number;
	strainLevelIdx: 0 | 1 | 2;
	strainText: 'Low' | 'Moderate' | 'High';
	tiredText: 'Low' | 'Moderate' | 'High' | 'Very High';
	attBinary: 0 | 1;
	eyeAspectRatio: number;
	pupilDilation: number;
	squintIntensity: number;
	eyeAge: number;
	faceAge: number;

	// Enhanced metrics from worker computations
	meanIBI?: number;
	darkCircleScore?: number;
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

	// New metrics from optimized hook
	earMean?: number;
	perclos?: number;
	fatigueScore?: number;
	blinkScore?: number;
	redEyeScore?: number;
	drynessScoreOptimized?: number;
	overallHealthScore?: number;
	batteryLevel?: number;
	faceDetected?: boolean;
}

// History data interface
export interface HistoryData {
	hourly: EyeTrackingMetrics[];
	daily: EyeTrackingMetrics[];
	monthly: EyeTrackingMetrics[];
	yearly: EyeTrackingMetrics[];
}

// User profile interface
export interface UserProfile {
	name: string;
	age: number;
	eyeAge: number;
	totalSessions: number;
	createdAt: string;
	lastActive: string;
	faceAge: number;
}

// SIMPLIFIED: Just track the date we last reset battery
export interface EyeTrackingState {
	error: string | null;
	currentMetrics: EyeTrackingMetrics;
	metricsHistory: EyeTrackingMetrics[];
	history: HistoryData;
	selectedTimeframe: 'hourly' | 'daily' | 'monthly' | 'yearly';
	selectedDate: string | null;
	profile: UserProfile;
	sessionStartTime: string | null;
	isTrackingActive: boolean;
	trackingError: string | null;
	loading: boolean;
	batteryLevel: number;
	lastBatteryUpdate: number;
	offScreenStart: number | null;
	offScreenDuration: number;
	lastMetricsCheck: number;
	timeSlotPenalty: number;
	metricsPenalty: number;
	netChange: number;

	// SIMPLIFIED: Just store date string (YYYY-MM-DD) when battery was last reset
	lastBatteryResetDate: string | null;
	activityTimestamps: number[];
}

// Enhanced Eye tracking actions interface
export interface EyeTrackingActions {
	setError: (error: string | null) => void;
	updateMetrics: (metrics: Partial<EyeTrackingMetrics>) => void;
	setTimeframe: (timeframe: 'hourly' | 'daily' | 'monthly' | 'yearly') => void;
	setSelectedDate: (date: string | null) => void;
	updateProfile: (profile: Partial<UserProfile>) => void;
	startSession: () => void;
	endSession: () => void;
	exportData: () => string;
	importData: (data: string) => void;
	clearHistory: () => void;
	getMetricsForDate: (date: string) => EyeTrackingMetrics[];
	getLastBlinkRate: () => number;
	getLastMetrics: () => EyeTrackingMetrics;
	setTrackingState: (state: { isTrackingActive: boolean; trackingError?: string | null }) => void;
	setLoading: (loading: boolean) => void;
	setBatteryLevel: (level: number) => void;
	updateBatteryState: (
		state: Partial<
			Pick<
				EyeTrackingState,
				| 'batteryLevel'
				| 'lastBatteryUpdate'
				| 'offScreenStart'
				| 'offScreenDuration'
				| 'lastMetricsCheck'
				| 'timeSlotPenalty'
				| 'metricsPenalty'
				| 'netChange'
				| 'activityTimestamps'
			>
		>
	) => void;
	resetBattery: () => void;
	addActivityTimestamp: (timestamp: number) => void;
	checkInactivityAndReset: () => boolean;
	// SIMPLIFIED: Single function to handle daily battery initialization
	initializeDailyBattery: () => void;
}

// Combined eye tracking slice type
export interface EyeTrackingSlice {
	eyeTracking: EyeTrackingState & EyeTrackingActions;
}

// Default values
const defaultMetrics: EyeTrackingMetrics = {
	timestamp: new Date().toISOString(),
	blinkRate: 0,
	perClose: 0,
	attentionFrac: 0,
	strainLevelIdx: 0,
	strainText: 'Low',
	tiredText: 'Low',
	attBinary: 0,
	eyeAspectRatio: 0,
	pupilDilation: 0,
	squintIntensity: 0,
	eyeAge: 0,
	faceAge: 0,
	meanIBI: 0,
	incompleteBlinkFrac: 0,
	drynessScore: 0,
	rednessMean: 0,
	rednessStd: 0,
	rednessNorm: 0,
	rednessIndex: 0,
	rednessScore: 0,
	rednessZ: 0,
	distanceCm: 0,
	distanceVar: 0,
	proximityScore: 0,
	earMean: 0,
	perclos: 0,
	fatigueScore: 0,
	blinkScore: 0,
	redEyeScore: 0,
	drynessScoreOptimized: 0,
	batteryLevel: 100,
};

const defaultProfile: UserProfile = {
	name: 'User',
	age: 25,
	eyeAge: 25,
	faceAge: 25,
	totalSessions: 0,
	createdAt: new Date().toISOString(),
	lastActive: new Date().toISOString(),
};

const defaultHistory: HistoryData = {
	hourly: [],
	daily: [],
	monthly: [],
	yearly: [],
};

// Helper to get today's date as YYYY-MM-DD
const getTodayString = (): string => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

// Initial eye tracking state
const initialEyeTrackingState: EyeTrackingState = {
	error: null,
	currentMetrics: defaultMetrics,
	metricsHistory: [],
	history: defaultHistory,
	selectedDate: new Date().toISOString().split('T')[0],
	selectedTimeframe: 'hourly',
	profile: defaultProfile,
	sessionStartTime: null,
	isTrackingActive: false,
	trackingError: null,
	loading: false,
	batteryLevel: 100,
	lastBatteryUpdate: Date.now(),
	offScreenStart: null,
	offScreenDuration: 0,
	lastMetricsCheck: Date.now(),
	timeSlotPenalty: 0,
	metricsPenalty: 0,
	netChange: 0,
	activityTimestamps: [],
	lastBatteryResetDate: null,
};

// Helper function to aggregate metrics
export function aggregateMetrics(metrics: EyeTrackingMetrics[]): EyeTrackingMetrics {
	if (metrics.length === 0) return defaultMetrics;

	const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

	return {
		timestamp: new Date().toISOString(),
		blinkRate: Math.round(avg(metrics.map((m) => m.blinkRate))),
		perClose: Number(avg(metrics.map((m) => m.perClose)).toFixed(2)),
		attentionFrac: Number(avg(metrics.map((m) => m.attentionFrac)).toFixed(2)),
		strainLevelIdx: Math.round(avg(metrics.map((m) => m.strainLevelIdx))) as 0 | 1 | 2,
		strainText: metrics[metrics.length - 1].strainText,
		tiredText: metrics[metrics.length - 1].tiredText,
		attBinary: Math.round(avg(metrics.map((m) => m.attBinary))) as 0 | 1,
		eyeAspectRatio: Number(avg(metrics.map((m) => m.eyeAspectRatio)).toFixed(3)),
		pupilDilation: Number(avg(metrics.map((m) => m.pupilDilation)).toFixed(2)),
		squintIntensity: Number(avg(metrics.map((m) => m.squintIntensity)).toFixed(2)),
		eyeAge: Math.round(avg(metrics.map((m) => m.eyeAge))),
		faceAge: Math.round(avg(metrics.map((m) => m.faceAge))),
		meanIBI: Number(avg(metrics.map((m) => m.meanIBI || 0)).toFixed(3)),
		incompleteBlinkFrac: Number(avg(metrics.map((m) => m.incompleteBlinkFrac || 0)).toFixed(3)),
		drynessScore: Number(avg(metrics.map((m) => m.drynessScore || 0)).toFixed(3)),
		rednessMean: Number(avg(metrics.map((m) => m.rednessMean || 0)).toFixed(3)),
		rednessStd: Number(avg(metrics.map((m) => m.rednessStd || 0)).toFixed(3)),
		rednessNorm: Number(avg(metrics.map((m) => m.rednessNorm || 0)).toFixed(3)),
		rednessIndex: Number(avg(metrics.map((m) => m.rednessIndex || 0)).toFixed(3)),
		rednessScore: Number(avg(metrics.map((m) => m.rednessScore || 0)).toFixed(2)),
		rednessZ: Number(avg(metrics.map((m) => m.rednessZ || 0)).toFixed(3)),
		distanceCm: Number(avg(metrics.map((m) => m.distanceCm || 0)).toFixed(3)),
		distanceVar: Number(avg(metrics.map((m) => m.distanceVar || 0)).toFixed(3)),
		proximityScore: Number(avg(metrics.map((m) => m.proximityScore || 0)).toFixed(2)),
		earMean: Number(avg(metrics.map((m) => m.earMean || 0)).toFixed(3)),
		perclos: Number(avg(metrics.map((m) => m.perclos || 0)).toFixed(3)),
		fatigueScore: Number(avg(metrics.map((m) => m.fatigueScore || 0)).toFixed(2)),
		blinkScore: Number(avg(metrics.map((m) => m.blinkScore || 0)).toFixed(2)),
		redEyeScore: Number(avg(metrics.map((m) => m.redEyeScore || 0)).toFixed(2)),
		drynessScoreOptimized: Number(
			avg(metrics.map((m) => m.drynessScoreOptimized || 0)).toFixed(2)
		),
		overallHealthScore: Number(avg(metrics.map((m) => m.overallHealthScore || 0)).toFixed(2)),
		batteryLevel: Number(avg(metrics.map((m) => m.batteryLevel || 0)).toFixed(2)),
		darkCircleScore: Number(avg(metrics.map((m) => m.darkCircleScore || 0)).toFixed(3)),
	};
}

// Create the eye tracking slice
const createEyeTrackingSlice: StateCreator<
	AppStoreState,
	[],
	[['zustand/persist', unknown]],
	EyeTrackingSlice
> = (set, get) => ({
	eyeTracking: {
		...initialEyeTrackingState,

		setError: (error) => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					error,
				},
			}));
		},

		setLoading: (loading) => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					loading,
				},
			}));
		},

		setTrackingState: ({ isTrackingActive, trackingError = null }) => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					isTrackingActive,
					trackingError,
				},
			}));
		},

		updateMetrics: (newMetrics) => {
			const { currentMetrics, history, metricsHistory, batteryLevel } = get().eyeTracking;

			const updatedMetrics = {
				...currentMetrics,
				...newMetrics,
				timestamp: new Date().toISOString(),
				batteryLevel: batteryLevel,
			};

			// Add to metrics history
			const newMetricsHistory = [...metricsHistory, updatedMetrics];
			if (newMetricsHistory.length > 1000) newMetricsHistory.shift();

			// Add to hourly history
			const newHourly = [...history.hourly, updatedMetrics];
			if (newHourly.length > 60) newHourly.shift();

			// Aggregate for daily (every 60 entries)
			const newDaily = [...history.daily];
			if (newHourly.length % 60 === 0 && newHourly.length > 0) {
				const avgMetrics = aggregateMetrics(newHourly.slice(-60));
				newDaily.push(avgMetrics);
				if (newDaily.length > 24) newDaily.shift();
			}

			// Aggregate for monthly (every 24 daily entries)
			const newMonthly = [...history.monthly];
			if (newDaily.length % 24 === 0 && newDaily.length > 0) {
				const avgMetrics = aggregateMetrics(newDaily.slice(-24));
				newMonthly.push(avgMetrics);
				if (newMonthly.length > 30) newMonthly.shift();
			}

			// Aggregate for yearly (every 30 monthly entries)
			const newYearly = [...history.yearly];
			if (newMonthly.length % 30 === 0 && newMonthly.length > 0) {
				const avgMetrics = aggregateMetrics(newMonthly.slice(-30));
				newYearly.push(avgMetrics);
				if (newYearly.length > 12) newYearly.shift();
			}

			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					currentMetrics: updatedMetrics,
					metricsHistory: newMetricsHistory,
					history: {
						hourly: newHourly,
						daily: newDaily,
						monthly: newMonthly,
						yearly: newYearly,
					},
				},
			}));
		},

		setTimeframe: (timeframe) => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					selectedTimeframe: timeframe,
				},
			}));
		},

		setSelectedDate: (date) => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					selectedDate: date,
				},
			}));
		},

		updateProfile: (profileUpdate) => {
			const { profile } = get().eyeTracking;
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					profile: {
						...profile,
						...profileUpdate,
						lastActive: new Date().toISOString(),
					},
				},
			}));
		},

		startSession: () => {
			const { profile } = get().eyeTracking;
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					sessionStartTime: new Date().toISOString(),
					profile: {
						...profile,
						totalSessions: profile.totalSessions + 1,
						lastActive: new Date().toISOString(),
					},
				},
			}));
		},

		endSession: () => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					sessionStartTime: null,
				},
			}));
		},

		exportData: () => {
			const state = get().eyeTracking;
			return JSON.stringify(
				{
					profile: state.profile,
					history: state.history,
					metricsHistory: state.metricsHistory,
					exportDate: new Date().toISOString(),
				},
				null,
				2
			);
		},

		importData: (data) => {
			try {
				const parsed = JSON.parse(data);
				if (parsed.profile && parsed.history) {
					set((state) => ({
						eyeTracking: {
							...state.eyeTracking,
							profile: parsed.profile,
							history: parsed.history,
							metricsHistory: parsed.metricsHistory || [],
						},
					}));
				}
			} catch (error) {
				set((state) => ({
					eyeTracking: {
						...state.eyeTracking,
						error: 'Failed to import data: Invalid format',
					},
				}));
			}
		},

		clearHistory: () => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					history: defaultHistory,
					metricsHistory: [],
				},
			}));
		},

		getMetricsForDate: (date) => {
			const { history, selectedTimeframe } = get().eyeTracking;
			const data = history[selectedTimeframe] || [];

			return data.filter((metric) => {
				const metricDate = new Date(metric.timestamp).toISOString().split('T')[0];
				return metricDate === date;
			});
		},

		getLastBlinkRate: () => {
			const { metricsHistory } = get().eyeTracking;
			const last = metricsHistory?.findLast((m) => m.blinkRate > 0);
			return last?.blinkRate || 0;
		},

		getLastMetrics: () => {
			const { metricsHistory } = get().eyeTracking;
			const last = metricsHistory?.findLast((m) => m.blinkRate > 0);
			return last || defaultMetrics;
		},

		setBatteryLevel: (level) => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					batteryLevel: Math.max(0, Math.min(100, level)),
					lastBatteryUpdate: Date.now(),
				},
			}));
		},

		updateBatteryState: (updates) => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					...updates,
				},
			}));
		},

		resetBattery: () => {
			// console.log('🔄 FULL BATTERY RESET');
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					batteryLevel: 100,
					timeSlotPenalty: 0,
					metricsPenalty: 0,
					netChange: 0,
					lastMetricsCheck: Date.now(),
					lastBatteryUpdate: Date.now(),
					offScreenStart: null,
					offScreenDuration: 0,
					activityTimestamps: [],
				},
			}));
		},

		// OPTIMIZED: Single function to handle daily battery initialization
		initializeDailyBattery: () => {
			const perfStart = performance.now();
			// console.log('\n' + '═'.repeat(80));
			// console.log('🔋 [BATTERY INIT] Starting battery initialization...');

			const state = get().eyeTracking;
			const now = new Date();

			// Log current system time details
			// console.log('⏰ [TIME CHECK] Current System Time:', {
			// 	fullTime: now.toLocaleString(),
			// 	isoTime: now.toISOString(),
			// 	timestamp: now.getTime(),
			// 	timezoneOffset: now.getTimezoneOffset(),
			// });

			const currentHour = now.getHours();
			const todayString = getTodayString();

			// Log stored state
			// console.log('💾 [STATE CHECK] Stored State:', {
			// 	lastResetDate: state.lastBatteryResetDate,
			// 	currentBattery: state.batteryLevel.toFixed(2) + '%',
			// 	lastPenalty: state.timeSlotPenalty,
			// });

			// Log comparison details
			// console.log('📊 [COMPARISON] Date Comparison:', {
			// 	todayString: todayString,
			// 	lastResetDate: state.lastBatteryResetDate,
			// 	datesMatch: state.lastBatteryResetDate === todayString,
			// 	currentHour: currentHour,
			// 	isAfter6AM: currentHour >= 6,
			// });

			// Check if we need to reset (new day after 6 AM)
			const needsReset = state.lastBatteryResetDate !== todayString && currentHour >= 6;

			// console.log('🎯 [DECISION] Reset Decision:', {
			// 	needsReset: needsReset,
			// 	reason: needsReset
			// 		? 'New day detected AND after 6 AM'
			// 		: state.lastBatteryResetDate === todayString
			// 			? 'Same day - already reset'
			// 			: 'Before 6 AM - waiting',
			// });

			if (needsReset) {
				const timePenalty = getTimeSlotPenalty();
				const newBattery = Math.max(0, Math.min(100, 100 - timePenalty));

				// console.log('✅ [RESET] APPLYING BATTERY RESET');
				// console.log('📉 [PENALTY] Time Slot Penalty:', {
				// 	hour: currentHour,
				// 	penalty: timePenalty + '%',
				// 	calculation: `100% - ${timePenalty}% = ${newBattery}%`,
				// });
				// console.log('🔋 [BATTERY] Battery Change:', {
				// 	before: state.batteryLevel.toFixed(2) + '%',
				// 	after: newBattery.toFixed(2) + '%',
				// 	difference: (newBattery - state.batteryLevel).toFixed(2) + '%',
				// });

				set((state) => ({
					eyeTracking: {
						...state.eyeTracking,
						batteryLevel: newBattery,
						lastBatteryResetDate: todayString,
						timeSlotPenalty: timePenalty,
						lastBatteryUpdate: Date.now(),
						offScreenStart: null,
						offScreenDuration: 0,
						metricsPenalty: 0,
						netChange: 0,
						activityTimestamps: [],
					},
				}));

				// console.log('💾 [SAVE] New state saved to store');
			} else {
				// console.log('⏭️  [SKIP] No reset needed');
				// console.log(
				// 	'📌 [INFO] Current battery will continue: ' +
				// 		state.batteryLevel.toFixed(2) +
				// 		'%'
				// );
			}

			const perfEnd = performance.now();
			// console.log(
			// 	'⚡ [PERFORMANCE] Execution time: ' + (perfEnd - perfStart).toFixed(2) + 'ms'
			// );
			// console.log('═'.repeat(80) + '\n');
		},

		addActivityTimestamp: (timestamp) => {
			set((state) => {
				const newTimestamps = [...state.eyeTracking.activityTimestamps, timestamp];
				const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
				const filteredTimestamps = newTimestamps.filter((ts) => ts > sixHoursAgo);

				return {
					eyeTracking: {
						...state.eyeTracking,
						activityTimestamps: filteredTimestamps,
					},
				};
			});
		},

		checkInactivityAndReset: () => {
			const { activityTimestamps } = get().eyeTracking;
			const now = Date.now();
			const sixHoursAgo = now - 6 * 60 * 60 * 1000;

			const recentActivity = activityTimestamps.some((ts) => ts > sixHoursAgo);

			if (!recentActivity && activityTimestamps.length > 0) {
				// console.log('⏰ [INACTIVITY] Resetting due to 6+ hours inactivity');
				set((state) => ({
					eyeTracking: {
						...state.eyeTracking,
						netChange: 0,
						activityTimestamps: [],
					},
				}));

				return true;
			}

			return false;
		},
	},
});

export default createEyeTrackingSlice;
