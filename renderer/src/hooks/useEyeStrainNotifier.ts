// renderer/src/hooks/useEyeStrainNotifier.ts
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import useAppStore from '@/store';
import { notify } from '@/utils/toasts';
import { useCallback, useEffect, useRef, useState } from 'react';
import useTranslationData from './use-translation-data';

/**
 * Configuration
 */
const STRAIN_DURATION_THRESHOLD = 15 * 60 * 1000; // 15 minutes
const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutes cooldown between notifications
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes cleanup

const PROXIMITY_THRESHOLD = 30; // < 30cm
const PROXIMITY_DURATION_THRESHOLD = 30 * 1000; // 30 seconds
const SCREEN_TIME_THRESHOLD = 360; // 6 hours in minutes
const BATTERY_DRAIN_THRESHOLD = 10; // 10% drain
const BATTERY_DRAIN_TIME = 15 * 60 * 1000; // 15 minutes
const BATTERY_LOW_THRESHOLD = 20; // 20% battery
const LIGHTING_DURATION_THRESHOLD = 30000; // 30s
const LIGHTING_COOLDOWN = 5 * 60 * 1000; // 5 min cooldown

interface NotificationSettings {
	screenDistanceAlert: boolean;
	eyeStrainAlert: boolean;
	batteryDrainingAlert: boolean;
	lightingAlert: boolean;
	screenTimeAlert: boolean;
}

const useEyeStrainNotifier = () => {
	const { metrics, isActive } = useEyeTrackingContext();
	const { screenTime, eyeTracking } = useAppStore();
	const { settingsPageText } = useTranslationData();

	const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
		screenDistanceAlert: true,
		eyeStrainAlert: true,
		batteryDrainingAlert: true,
		lightingAlert: true,
		screenTimeAlert: true,
	});

	// Refs for timing and state management
	const strainStartTime = useRef<number | null>(null);
	const lastNotificationTime = useRef<number | null>(null);
	const lastProximityNotificationTime = useRef<number | null>(null);
	const lastScreenTimeNotificationDate = useRef<string | null>(null);
	const lastBatteryNotificationTime = useRef<number | null>(null);
	const lastLightingNotificationTime = useRef<number | null>(null);
	const proximityStartTime = useRef<number | null>(null);
	const batteryCheckStartTime = useRef<number | null>(null);
	const initialBatteryLevel = useRef<number | null>(null);
	const cleanupTimer = useRef<NodeJS.Timeout | null>(null);
	const lightingStartTime = useRef<number | null>(null);

	// Get battery level from store
	const batteryLevel = eyeTracking?.batteryLevel || 100;

	// Load notification settings from Electron store
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const settings = await window.ipc.getNotificationSettings();
				setNotificationSettings(settings);
				console.log('[NotificationSettings] ✅ Loaded:', settings);
			} catch (error) {
				console.error('[NotificationSettings] ❌ Failed to load:', error);
			}
		};
		loadSettings();
	}, []);

	const eyeStrainDetected = Boolean(metrics?.strainText && ['High'].includes(metrics.strainText));

	// Timer reset functions
	const resetStrainTimer = useCallback(() => {
		if (strainStartTime.current) {
			console.log('🔄 Resetting eye strain timer');
		}
		strainStartTime.current = null;
	}, []);

	const resetProximityTimer = useCallback(() => {
		proximityStartTime.current = null;
	}, []);

	const resetBatteryTimer = useCallback(() => {
		batteryCheckStartTime.current = null;
		initialBatteryLevel.current = null;
	}, []);

	// Notification functions
	const sendStrainNotification = useCallback(() => {
		if (!notificationSettings.eyeStrainAlert) return;

		const now = Date.now();
		if (
			lastNotificationTime.current &&
			now - lastNotificationTime.current < NOTIFICATION_COOLDOWN
		) {
			console.log(
				`⚠️ Strain notification cooldown active (${Math.floor(
					(NOTIFICATION_COOLDOWN - (now - lastNotificationTime.current)) / 1000
				)}s remaining)`
			);
			return;
		}

		notify(settingsPageText.notifications.messages.eyeStrain, 'info');
		lastNotificationTime.current = now;
		console.log(`✅ Eye strain notification sent at ${new Date().toLocaleTimeString()}`);
	}, [notificationSettings.eyeStrainAlert]);

	const sendProximityNotification = useCallback(() => {
		if (!notificationSettings.screenDistanceAlert) return;

		const now = Date.now();
		if (
			lastProximityNotificationTime.current &&
			now - lastProximityNotificationTime.current < NOTIFICATION_COOLDOWN
		) {
			return;
		}

		notify(settingsPageText.notifications.messages.screenDistance, 'info');
		lastProximityNotificationTime.current = now;
		console.log(`✅ Proximity notification sent at ${new Date().toLocaleTimeString()}`);
	}, [notificationSettings.screenDistanceAlert]);

	const sendScreenTimeNotification = useCallback(() => {
		if (!notificationSettings.screenTimeAlert) return;

		const today = new Date().toDateString();
		if (lastScreenTimeNotificationDate.current === today) {
			return;
		}

		notify(settingsPageText.notifications.messages.screenTime, 'info');
		lastScreenTimeNotificationDate.current = today;
		console.log(`✅ Screen time notification sent`);
	}, [notificationSettings.screenTimeAlert]);

	const sendBatteryNotification = useCallback(() => {
		if (!notificationSettings.batteryDrainingAlert) return;

		const now = Date.now();
		if (
			lastBatteryNotificationTime.current &&
			now - lastBatteryNotificationTime.current < NOTIFICATION_COOLDOWN
		) {
			return;
		}

		notify(settingsPageText.notifications.messages.batteryDraining, 'info');
		lastBatteryNotificationTime.current = now;
		console.log(`✅ Battery notification sent`);
	}, [notificationSettings.batteryDrainingAlert]);

	const sendLightingNotification = useCallback(() => {
		if (!notificationSettings.lightingAlert) return;

		const now = Date.now();
		
			// Start timer if first detection
			if (!lightingStartTime.current) {
				lightingStartTime.current = now;
				console.log('[Lighting] Detected — timer started');
				return;
			}

			const duration = now - lightingStartTime.current;
			// console.log(`[Lighting] Duration: ${Math.floor(duration/1000)}s`);

		
		
		if (
			lastLightingNotificationTime.current &&
			now - lastLightingNotificationTime.current < NOTIFICATION_COOLDOWN
		) {
			return;
		}

			// If threshold reached and cooldown passed
			if (
				duration >= LIGHTING_DURATION_THRESHOLD &&
				now - (lastLightingNotificationTime.current ?? 0) > LIGHTING_COOLDOWN
			) {
				notify(settingsPageText.notifications.messages.lighting, 'info');
				console.log(`✅ Lighting notification sent`);
				lastLightingNotificationTime.current = now;
				lightingStartTime.current = null; // reset
				console.log('[Lighting] Notification sent!');
			}
		
	}, [notificationSettings.lightingAlert]);

	// Cleanup function
	const cleanupOldData = useCallback(() => {
		if (!eyeStrainDetected) {
			resetStrainTimer();
		}

		// Reset proximity timer if no proximity data
		if (!metrics?.proximityScore || metrics.proximityScore >= PROXIMITY_THRESHOLD) {
			resetProximityTimer();
		}

		console.log('🧹 Cleaned up notification timers');
	}, [eyeStrainDetected, resetStrainTimer, resetProximityTimer, metrics?.proximityScore]);

	// Core notification logic
	useEffect(() => {
		if (!metrics || !isActive) return;

		// 1. Eye Strain Alert (High for > 15 minutes)
		if (eyeStrainDetected && notificationSettings.eyeStrainAlert) {
			if (!strainStartTime.current) {
				strainStartTime.current = Date.now();
				console.log(
					`👁️ Eye strain detected, starting timer at ${new Date().toLocaleTimeString()}`
				);
			} else {
				const duration = Date.now() - strainStartTime.current;
				// console.log(`⏱️ Eye strain duration: ${Math.floor(duration / 1000)}s`);

				if (duration >= STRAIN_DURATION_THRESHOLD) {
					sendStrainNotification();
					resetStrainTimer(); // Reset after notification
				}
			}
		} else {
			resetStrainTimer();
		}

		// 2. Screen Distance Alert (< 30cm for > 30 seconds)
		if (notificationSettings.screenDistanceAlert && metrics.proximityScore !== undefined) {
			if (metrics.proximityScore < PROXIMITY_THRESHOLD) {
				if (!proximityStartTime.current) {
					proximityStartTime.current = Date.now();
					console.log(
						`📏 Too close to screen, starting timer at ${new Date().toLocaleTimeString()}`
					);
				} else {
					const duration = Date.now() - proximityStartTime.current;
					console.log(`⏱️ Proximity duration: ${Math.floor(duration / 1000)}s`);

					if (duration >= PROXIMITY_DURATION_THRESHOLD) {
						sendProximityNotification();
						resetProximityTimer(); // Reset after notification
					}
				}
			} else {
				resetProximityTimer();
			}
		}

		// 3. Battery Alert - Using actual battery level from store
		if (notificationSettings.batteryDrainingAlert) {
			const currentBatteryLevel = batteryLevel;

			// Check for low battery using BATTERY_LOW_THRESHOLD
			if (currentBatteryLevel < BATTERY_LOW_THRESHOLD) {
				sendBatteryNotification();
			}

			// Check for rapid battery drain using BATTERY_DRAIN_THRESHOLD
			if (!batteryCheckStartTime.current) {
				batteryCheckStartTime.current = Date.now();
				initialBatteryLevel.current = currentBatteryLevel;
			} else {
				const timePassed = Date.now() - batteryCheckStartTime.current;
				const batteryDrop = (initialBatteryLevel.current || 0) - currentBatteryLevel;

				if (timePassed >= BATTERY_DRAIN_TIME) {
					// Use actual BATTERY_DRAIN_THRESHOLD
					if (batteryDrop >= BATTERY_DRAIN_THRESHOLD) {
						sendBatteryNotification();
					}
					// Reset for next check
					batteryCheckStartTime.current = Date.now();
					initialBatteryLevel.current = currentBatteryLevel;
				}
			}
		} else {
			resetBatteryTimer();
		}

		// 4. Lighting Alert - Using available eye metrics as alternative for lighting detection
		if (notificationSettings.lightingAlert) {
			let lightingIssue = false;

			// Use blink rate abnormalities as proxy for lighting issues
			if (metrics.blinkRate !== undefined) {
				// Abnormal blink rate can indicate strain from poor lighting
				if (metrics.blinkRate > 25 || metrics.blinkRate < 8) {
					lightingIssue = true;
				}
			}

			// Use eye aspect ratio (squinting in poor light)
			if (metrics.eyeAspectRatio !== undefined && metrics.eyeAspectRatio < 0.2) {
				lightingIssue = true;
			}

			// Use squint intensity
			if (metrics.squintIntensity !== undefined && metrics.squintIntensity > 0.7) {
				lightingIssue = true;
			}

			// Use pupil dilation (larger pupils in low light)
			if (metrics.pupilDilation !== undefined && metrics.pupilDilation > 8) {
				lightingIssue = true;
			}

			if (lightingIssue) {
				sendLightingNotification();
			}
		}

		// 5. Screen Time Alert - Only using dailyScreenTime since hourlyScreenTime doesn't exist
		if (notificationSettings.screenTimeAlert && screenTime?.dailyScreenTime) {
			const screenTimeSeconds = screenTime.dailyScreenTime;
			const screenTimeHours = screenTimeSeconds / (60 * 60);
			// Daily threshold (6 hours)
			if (screenTimeHours > SCREEN_TIME_THRESHOLD / 60) {
				sendScreenTimeNotification();
			}

			// // Additional check for continuous usage patterns using available metrics
			// if (metrics.perClose !== undefined && metrics.perClose > 0.8) {
			// 	// High percentage of eye closure indicates fatigue from prolonged use
			// 	console.log('High eye closure detected');
			// 	sendScreenTimeNotification();
			// }

			// // Check attention fraction for continuous focus
			// if (metrics.attentionFrac !== undefined && metrics.attentionFrac > 0.9) {
			// 	// Very high attention for long periods indicates need for break
			// 	console.log('High attention fraction detected');
			// 	sendScreenTimeNotification();
			// }
		}
	}, [
		metrics,
		isActive,
		eyeStrainDetected,
		notificationSettings,
		batteryLevel, // Added batteryLevel dependency
		sendStrainNotification,
		sendProximityNotification,
		sendScreenTimeNotification,
		sendBatteryNotification,
		sendLightingNotification,
		resetStrainTimer,
		resetProximityTimer,
		resetBatteryTimer,
		screenTime,
	]);

	// Periodic cleanup
	useEffect(() => {
		cleanupTimer.current = setInterval(cleanupOldData, CLEANUP_INTERVAL);
		return () => {
			if (cleanupTimer.current) {
				clearInterval(cleanupTimer.current);
				cleanupTimer.current = null;
			}
		};
	}, [cleanupOldData]);

	// Reset all timers when tracking becomes inactive
	useEffect(() => {
		if (!isActive) {
			resetStrainTimer();
			resetProximityTimer();
			resetBatteryTimer();
		}
	}, [isActive, resetStrainTimer, resetProximityTimer, resetBatteryTimer]);

	return {
		eyeStrainDetected,
		notificationSettings,
		batteryLevel, // Export battery level for components that need it
		resetStrainTimer,
		resetProximityTimer,
		resetBatteryTimer,
	};
};

export default useEyeStrainNotifier;
