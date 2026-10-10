// ============================================
// TIME CONSTANTS
// ============================================
export const SECOND = 1000; // milliseconds
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = HOUR * 24;

// ============================================
// BATTERY LOGIC CONSTANTS
// ============================================
export const BLINK_TARGET = 15; // blinks per minute
export const MIN_DISTANCE = 40; // cm
export const AMBIENT_LIGHT = 0; // normalized 0-1

// Check intervals
export const TIME_METRICS_CHECK = 500; // Check metrics every 15 minutes
export const BATTERY_UPDATE_INTERVAL = 1 * SECOND; // Update battery every second
export const ACTIVITY_LOG_INTERVAL = 10 * MINUTE; // Log activity every 10 minutes
export const INACTIVITY_RESET_THRESHOLD = 6 * HOUR; // Reset after 6 hours

// ============================================
// FATIGUE & RECOVERY RATES
// ============================================
export const F0 = 1.2; // Base fatigue rate per hour
export const Ws = 5; // Screen active weight
export const Wb = 3; // Blink deficit weight
export const We = 8; // Eye strain weight
export const Wd = 6; // Distance penalty weight
export const Wq = 6; // Break quality weight
export const Wl = 2; // Light weight

// ============================================
// BREAK QUALITY
// ============================================
export const BREAK_TARGET_DURATION = 2 * MINUTE; // 2 minutes for full recovery

// ============================================
// TIME SLOT PENALTIES (by hour of day)
// ============================================

export const getTimeSlotPenalty = (): number => {
	const hour = new Date().getHours();

	if (hour >= 6 && hour < 9) return 0; // Morning: 6am-12pm
	if (hour >= 9 && hour < 12) return 10; // Morning: 6am-12pm
	if (hour >= 12 && hour < 15) return 20; // Early afternoon: 12pm-3pm
	if (hour >= 15 && hour < 18) return 30; // Late afternoon: 3pm-6pm
	if (hour >= 18 && hour < 21) return 40; // Evening: 6pm-9pm
	if (hour >= 21 && hour < 24) return 60; // Night: 9pm-12am
	if (hour >= 0 && hour < 6) return 70; // Late night: 12am-6am

	return 0;
};

// 100;
// penalty = 0;

// // getStrainLevelPenalty
// penlaty = 5;

// 100 - penlaty;

// ============================================
// HEALTH METRIC PENALTIES
// ============================================

export const getDrynessLevel = (score: number) => {
	if (score < 0) {
		const text = 'high';
		return { text, status: text.toLowerCase().replace(' ', '-') };
	}
	if (score <= 0.5) {
		const text = 'moderate';
		return { text, status: text.toLowerCase().replace(' ', '-') };
	}
	const text = 'low';
	return { text, status: text.toLowerCase().replace(' ', '-') };
};

export const getRednessLevel = (score: number) => {
	if (score < 0.4) {
		const text = 'high';
		return { text, status: text.toLowerCase().replace(' ', '-') };
	}
	if (score <= 0.6) {
		const text = 'moderate';
		return { text, status: text.toLowerCase().replace(' ', '-') };
	}
	const text = 'low';
	return { text, status: text.toLowerCase().replace(' ', '-') };
};

export const getDarkCircleLevel = (score: number) => {
	if (score < 0.3) {
		const text = 'low';
		return { text, status: text.toLowerCase().replace(' ', '-') };
	}
	if (score <= 0.6) {
		const text = 'moderate';
		return { text, status: text.toLowerCase().replace(' ', '-') };
	}
	const text = 'high';
	return { text, status: text.toLowerCase().replace(' ', '-') };
};

export const getStrainLevelPenalty = (level: string): number => {
	const normalized = level.toLowerCase();

	if (normalized.includes('moderate')) return 0.0005; // Penalty (positive = bad)
	// if (normalized.includes('moderate')) return 5; // Penalty (positive = bad)
	if (normalized.includes('high') || normalized.includes('very high')) return 0.001;
	return 0;
};

export const getDrynessLevelPenalty = (score: number): number => {
	const level = getDrynessLevel(score)?.status;
	const normalized = level.toLowerCase();
	if (normalized.includes('moderate')) return 0.0005;
	if (normalized.includes('high') || normalized.includes('very high')) return 0.001;

	return 0; // Normal
};

export const getRednessLevelPenalty = (score: number): number => {
	const level = getRednessLevel(score)?.status;
	const normalized = level.toLowerCase();

	if (normalized.includes('moderate')) return 0.0005;
	if (normalized.includes('high') || normalized.includes('very high')) return 0.001;

	return 0; // Normal
};

export const getDarkCircleLevelPenalty = (scrore: number): number => {
	const level = getDarkCircleLevel(scrore)?.status;
	const normalized = level.toLowerCase();

	if (normalized.includes('moderate')) return 0.0005;
	if (normalized.includes('high') || normalized.includes('very high')) return 0.001;

	return 0; // Normal
};

// ============================================
// BATTERY BOUNDS
// ============================================
export const BATTERY_MIN = 0;
export const BATTERY_MAX = 100;
export const BATTERY_INITIAL = 100;

// ============================================
// FATIGUE ACCUMULATION LIMITS
// ============================================
export const MAX_FATIGUE_ACCUMULATION = 200; // Maximum fatigue points
export const FATIGUE_DECAY_RATE = 0.1; // Decay rate when idle (per hour)

export const attentionPenalty = (score: number) => {
	if (score >= 100) return 0.0004;
	return -0.00167;
};

/**
//  * every sec of screen time. will decrease 0.0004
//  * every minute away from screen will increase 0.1
 *
 * if attention scrore 100 penalty 0.0004 per sec
 * if attention not 100 penalty 0.00167 per sec
 */
