import useAppStore from '@/store';
import {
	attentionPenalty,
	getDarkCircleLevelPenalty,
	getDrynessLevelPenalty,
	getRednessLevelPenalty,
	getStrainLevelPenalty,
} from '@/utils/battery';
import { useCallback, useEffect, useMemo, useRef } from 'react';

// Types for better type safety
interface MetricsBuffer {
	strain: string[];
	dryness: number[];
	redness: number[];
	darkCircle: number[];
	attention: number[];
}

interface CurrentMetrics {
	strain: string;
	dryness: number;
	redness: number;
	darkCircle: number;
	attention: number;
}

interface Penalties {
	strain: number;
	dryness: number;
	redness: number;
	darkCircle: number;
	attention: number;
}

// Battery constants
const BATTERY_MIN = 0;
const BATTERY_MAX = 100;

const useBattery= () => {
	// Store state and actions
	const batteryLevel = useAppStore((state) => state.eyeTracking.batteryLevel);
	const lastBatteryResetDate = useAppStore((state) => state.eyeTracking.lastBatteryResetDate);
	const initializeDailyBattery = useAppStore((state) => state.eyeTracking.initializeDailyBattery);
	const updateBatteryState = useAppStore((state) => state.eyeTracking.updateBatteryState);

	// Get individual metrics separately to avoid caching issues
	const strainText = useAppStore((state) => state.eyeTracking.currentMetrics.strainText);
	const drynessScore = useAppStore((state) => state.eyeTracking.currentMetrics.drynessScore);
	const rednessScore = useAppStore((state) => state.eyeTracking.currentMetrics.rednessScore);
	const darkCircleScore = useAppStore(
		(state) => state.eyeTracking.currentMetrics.darkCircleScore
	);
	const attentionFrac = useAppStore((state) => state.eyeTracking.currentMetrics.attentionFrac);

	// Track if initial check is done
	const initialCheckDone = useRef(false);
	const lastLogTime = useRef(0);
	const loopCount = useRef(0);

	// Memoize current metrics to avoid recreating object
	const currentMetrics: CurrentMetrics = useMemo(
		() => ({
			strain: strainText || 'Low',
			dryness: drynessScore || 0,
			redness: rednessScore || 0,
			darkCircle: darkCircleScore || 0,
			attention: (attentionFrac || 0) * 100,
		}),
		[strainText, drynessScore, rednessScore, darkCircleScore, attentionFrac]
	);

	// Buffer to collect metrics
	const metricsBuffer = useRef<MetricsBuffer>({
		strain: [],
		dryness: [],
		redness: [],
		darkCircle: [],
		attention: [],
	});

	// Helper to clamp battery between min and max
	const clampBattery = useCallback((value: number): number => {
		return Math.max(BATTERY_MIN, Math.min(BATTERY_MAX, value));
	}, []);

	// Helper function to calculate average
	const calculateAverage = useCallback((numbers: number[]): number => {
		if (numbers.length === 0) return 0;

		let total = 0;
		for (let i = 0; i < numbers.length; i++) {
			total = total + numbers[i];
		}
		return total / numbers.length;
	}, []);

	// Helper to calculate all penalties (WITHOUT time penalty)
	const calculatePenalties = useCallback(
		(
			avgDryness: number,
			avgRedness: number,
			avgDarkCircle: number,
			avgAttention: number,
			lastStrain: string
		): Penalties => {
			const penalties = {
				strain: getStrainLevelPenalty(lastStrain),
				dryness: getDrynessLevelPenalty(avgDryness),
				redness: getRednessLevelPenalty(avgRedness),
				darkCircle: getDarkCircleLevelPenalty(avgDarkCircle),
				attention: attentionPenalty(avgAttention),
			};

			// Only log every 10 seconds to reduce spam
			const now = Date.now();
			if (now - lastLogTime.current > 10000) {
				// console.log('📊 [METRICS] Individual Penalties:', {
				// 	strain: `${lastStrain} = ${penalties.strain.toFixed(6)}`,
				// 	dryness: `${avgDryness.toFixed(2)} = ${penalties.dryness.toFixed(6)}`,
				// 	redness: `${avgRedness.toFixed(2)} = ${penalties.redness.toFixed(6)}`,
				// 	darkCircle: `${avgDarkCircle.toFixed(2)} = ${penalties.darkCircle.toFixed(6)}`,
				// 	attention: `${avgAttention.toFixed(2)} = ${penalties.attention.toFixed(6)}`,
				// });
				lastLogTime.current = now;
			}

			return penalties;
		},
		[]
	);

	// Helper to calculate total penalty
	const calculateTotalPenalty = useCallback((penalties: Penalties): number => {
		const total =
			penalties.strain +
			penalties.dryness +
			penalties.redness +
			penalties.darkCircle +
			penalties.attention;

		return total;
	}, []);

	// OPTIMIZED: Initialize battery once on mount
	useEffect(() => {
		if (initialCheckDone.current) return;
		initialCheckDone.current = true;

		// console.log('\n' + '═'.repeat(80));
		// console.log('🚀 [HOOK MOUNT] Component mounted - checking battery');
		// console.log('💾 [HOOK STATE] Current State:', {
		// 	lastResetDate: lastBatteryResetDate,
		// 	battery: batteryLevel?.toFixed(2) + '%',
		// });
		// console.log('═'.repeat(80) + '\n');

		// Call the single initialization function
		initializeDailyBattery();
	}, [batteryLevel, initializeDailyBattery, lastBatteryResetDate]); // Empty deps - only run once

	// Collect metrics into buffer whenever they change
	useEffect(() => {
		const buffer = metricsBuffer.current;

		if (currentMetrics.strain) buffer.strain.push(currentMetrics.strain);
		if (currentMetrics.dryness > 0) buffer.dryness.push(currentMetrics.dryness);
		if (currentMetrics.redness > 0) buffer.redness.push(currentMetrics.redness);
		if (currentMetrics.darkCircle > 0) buffer.darkCircle.push(currentMetrics.darkCircle);
		if (currentMetrics.attention > 0) buffer.attention.push(currentMetrics.attention);
	}, [currentMetrics]);

	// Main loop: process buffer every second (NO MORE 6 AM CHECKS HERE)
	useEffect(() => {
		// console.log('🔁 [MAIN LOOP] Starting main battery drain loop (1 second interval)');

		const mainLoop = () => {
			loopCount.current++;

			// Process buffer
			const buffer = metricsBuffer.current;
			if (buffer.strain.length === 0) {
				// Only log every 30 seconds when idle
				if (loopCount.current % 30 === 0) {
					// console.log('⏸️  [MAIN LOOP] No metrics in buffer, skipping...');
				}
				return;
			}

			const perfStart = performance.now();

			// Calculate averages
			const avgDryness = calculateAverage(buffer.dryness);
			const avgRedness = calculateAverage(buffer.redness);
			const avgDarkCircle = calculateAverage(buffer.darkCircle);
			const avgAttention = calculateAverage(buffer.attention);
			const lastStrain = buffer.strain[buffer.strain.length - 1];

			// Calculate penalties (metrics only, NO time penalty)
			const penalties = calculatePenalties(
				avgDryness,
				avgRedness,
				avgDarkCircle,
				avgAttention,
				lastStrain
			);

			const totalPenalty = calculateTotalPenalty(penalties);

			// Calculate new battery level
			const currentBattery = useAppStore.getState().eyeTracking.batteryLevel;
			const newBattery = clampBattery(currentBattery - totalPenalty);

			// Only log every 5 seconds to reduce spam
			if (loopCount.current % 5 === 0) {
				const perfEnd = performance.now();
				// console.log('🔋 [BATTERY DRAIN]', {
				// 	loop: loopCount.current,
				// 	before: currentBattery.toFixed(4) + '%',
				// 	after: newBattery.toFixed(4) + '%',
				// 	penalty: '−' + totalPenalty.toFixed(6) + '%',
				// 	bufferSize: buffer.strain.length,
				// 	execTime: (perfEnd - perfStart).toFixed(2) + 'ms',
				// });
			}

			// Update store
			updateBatteryState({ batteryLevel: newBattery });

			// Clear buffer
			metricsBuffer.current = {
				strain: [],
				dryness: [],
				redness: [],
				darkCircle: [],
				attention: [],
			};
		};

		// Run every 1 second
		const interval = setInterval(mainLoop, 1000);
		return () => {
			// console.log('🛑 [MAIN LOOP] Stopping main battery drain loop');
			clearInterval(interval);
		};
	}, [
		calculateAverage,
		calculatePenalties,
		calculateTotalPenalty,
		updateBatteryState,
		clampBattery,
	]);

	// OPTIMIZED: Check for day change every minute
	useEffect(() => {
		// console.log('🕐 [DAY CHECKER] Starting day change checker (60 second interval)');
		let checkCount = 0;

		const checkDayChange = () => {
			checkCount++;
			// console.log(`\n🔍 [DAY CHECKER] Check #${checkCount} - Checking for day change...`);
			initializeDailyBattery();
		};

		// Check every minute
		const interval = setInterval(checkDayChange, 60000);
		return () => {
			// console.log('🛑 [DAY CHECKER] Stopping day change checker');
			clearInterval(interval);
		};
	}, [initializeDailyBattery]);

	// Log battery level changes
	useEffect(() => {
		// console.log(
		// 	'📈 [BATTERY WATCH] Battery level changed to: ' + batteryLevel?.toFixed(2) + '%'
		// );
	}, [batteryLevel]);

	// Log reset date changes
	useEffect(() => {
		// console.log('📅 [DATE WATCH] Last reset date changed to:', lastBatteryResetDate);
	}, [lastBatteryResetDate]);

	return { battery: batteryLevel };
};

export default useBattery;
