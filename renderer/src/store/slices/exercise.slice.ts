import type { StateCreator } from 'zustand';
import { AppStoreState } from '..';

// Exercise progress interface
export interface ExerciseProgress {
	videoUrl: string;
	videoTitle: string;
	lastWatchedAt: string;
	currentTime: number;
	duration: number;
	progressPercentage: number;
	isCompleted: boolean;
	completedAt?: string;
	watchCount: number;
	metricsBeforeExercise: ExerciseMetrics | null;
	metricsAfterExercise: ExerciseMetrics | null;
	improvement?: {
		blinkRate: number;
		perClose: number;
		strainLevel: number;
		attention: number;
	};
}

// Exercise metrics snapshot
export interface ExerciseMetrics {
	blinkRate: number;
	perClose: number;
	strainText: string;
	attBinary: number;
	timestamp: string;
}

// Exercise session interface
export interface ExerciseSession {
	id: string;
	videoUrl: string;
	videoTitle: string;
	startedAt: string;
	completedAt?: string;
	duration: number;
	metricsBeforeExercise: ExerciseMetrics | null;
	metricsAfterExercise: ExerciseMetrics | null;
	wasCompleted: boolean;
}

// Exercise state interface
export interface ExerciseState {
	exerciseProgress: Record<string, ExerciseProgress>;
	currentSession: ExerciseSession | null;
	exerciseHistory: ExerciseSession[];
	totalExercisesCompleted: number;
	totalExerciseTime: number;
	averageImprovement: {
		blinkRate: number;
		perClose: number;
		strainLevel: number;
		attention: number;
	};
}

// Exercise actions interface
export interface ExerciseActions {
	startExercise: (
		videoUrl: string,
		videoTitle: string,
		currentMetrics: ExerciseMetrics | null
	) => void;
	updateExerciseProgress: (videoUrl: string, currentTime: number, duration: number) => void;
	completeExercise: (videoUrl: string, currentMetrics: ExerciseMetrics | null) => void;
	pauseExercise: (videoUrl: string, currentTime: number) => void;
	restartExercise: (videoUrl: string, currentMetrics: ExerciseMetrics | null) => void;
	getExerciseProgress: (videoUrl: string) => ExerciseProgress | null;
	getExerciseHistory: () => ExerciseSession[];
	getExerciseStats: () => {
		totalCompleted: number;
		totalTime: number;
		averageImprovement: ExerciseState['averageImprovement'];
	};
	clearExerciseHistory: () => void;
	calculateImprovement: (
		before: ExerciseMetrics | null,
		after: ExerciseMetrics | null
	) => ExerciseProgress['improvement'];
}

// Combined exercise slice type
export interface ExerciseSlice {
	exercise: ExerciseState & ExerciseActions;
}

// Initial exercise state
const initialExerciseState: ExerciseState = {
	exerciseProgress: {},
	currentSession: null,
	exerciseHistory: [],
	totalExercisesCompleted: 0,
	totalExerciseTime: 0,
	averageImprovement: {
		blinkRate: 0,
		perClose: 0,
		strainLevel: 0,
		attention: 0,
	},
};

// Helper function to calculate improvement
const calculateImprovementHelper = (
	before: ExerciseMetrics | null,
	after: ExerciseMetrics | null
): ExerciseProgress['improvement'] => {
	if (!before || !after) return undefined;

	return {
		blinkRate: after.blinkRate - before.blinkRate,
		perClose: after.perClose - before.perClose,
		strainLevel:
			['Low', 'Moderate', 'High'].indexOf(after.strainText) -
			['Low', 'Moderate', 'High'].indexOf(before.strainText),
		attention: after.attBinary - before.attBinary,
	};
};

// Create the exercise slice
const createExerciseSlice: StateCreator<
	AppStoreState,
	[],
	[['zustand/persist', unknown]],
	ExerciseSlice
> = (set, get) => ({
	exercise: {
		...initialExerciseState,

		startExercise: (videoUrl, videoTitle, currentMetrics) => {
			const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const session: ExerciseSession = {
				id: sessionId,
				videoUrl,
				videoTitle,
				startedAt: new Date().toISOString(),
				duration: 0,
				metricsBeforeExercise: currentMetrics,
				metricsAfterExercise: null,
				wasCompleted: false,
			};

		// Initialize or update progress
		const existingProgress = get().exercise.exerciseProgress[videoUrl];
		const progress: ExerciseProgress = existingProgress
			? {
					...existingProgress,
					lastWatchedAt: new Date().toISOString(),
					watchCount: existingProgress.watchCount + 1,
					metricsBeforeExercise: currentMetrics,
					metricsAfterExercise: null,
			  }
			: {
					videoUrl,
					videoTitle,
					lastWatchedAt: new Date().toISOString(),
					currentTime: 0,
					duration: 0,
					progressPercentage: 0,
					isCompleted: false,
					watchCount: 1,
					metricsBeforeExercise: currentMetrics,
					metricsAfterExercise: null,
			  };

		set((state) => ({
			exercise: {
				...state.exercise,
				currentSession: session,
				exerciseProgress: {
					...state.exercise.exerciseProgress,
					[videoUrl]: progress,
				},
			},
		}));
	},		updateExerciseProgress: (videoUrl, currentTime, duration) => {
			const progress = get().exercise.exerciseProgress[videoUrl];
			if (!progress) return;

			const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

			set((state) => ({
				exercise: {
					...state.exercise,
					exerciseProgress: {
						...state.exercise.exerciseProgress,
						[videoUrl]: {
							...progress,
							currentTime,
							duration,
							progressPercentage,
							lastWatchedAt: new Date().toISOString(),
						},
					},
				},
			}));

			// Update current session duration
			const { currentSession } = get().exercise;
			if (currentSession && currentSession.videoUrl === videoUrl) {
				set((state) => ({
					exercise: {
						...state.exercise,
						currentSession: {
							...currentSession,
							duration: Math.floor(currentTime),
						},
					},
				}));
			}
		},

		completeExercise: (videoUrl, currentMetrics) => {
			const progress = get().exercise.exerciseProgress[videoUrl];
			const { currentSession, exerciseHistory, totalExercisesCompleted, totalExerciseTime } =
				get().exercise;

			if (!progress) return;

			const improvement = calculateImprovementHelper(
				progress.metricsBeforeExercise,
				currentMetrics
			);

			// Update progress
			const updatedProgress: ExerciseProgress = {
				...progress,
				isCompleted: true,
				completedAt: new Date().toISOString(),
				progressPercentage: 100,
				metricsAfterExercise: currentMetrics,
				improvement,
			};

			// Complete current session
			let completedSession: ExerciseSession | null = null;
			if (currentSession && currentSession.videoUrl === videoUrl) {
				completedSession = {
					...currentSession,
					completedAt: new Date().toISOString(),
					metricsAfterExercise: currentMetrics,
					wasCompleted: true,
				};
			}

			// Calculate new averages
			const newHistory = completedSession
				? [...exerciseHistory, completedSession]
				: exerciseHistory;
			const completedSessions = newHistory.filter(
				(s) => s.wasCompleted && s.metricsBeforeExercise && s.metricsAfterExercise
			);

			let averageImprovement = { blinkRate: 0, perClose: 0, strainLevel: 0, attention: 0 };
			if (completedSessions.length > 0) {
				const improvements = completedSessions
					.map((s) =>
						calculateImprovementHelper(s.metricsBeforeExercise, s.metricsAfterExercise)
					)
					.filter(Boolean);

				if (improvements.length > 0) {
					averageImprovement = {
						blinkRate:
							improvements.reduce((sum, imp) => sum + (imp?.blinkRate || 0), 0) /
							improvements.length,
						perClose:
							improvements.reduce((sum, imp) => sum + (imp?.perClose || 0), 0) /
							improvements.length,
						strainLevel:
							improvements.reduce((sum, imp) => sum + (imp?.strainLevel || 0), 0) /
							improvements.length,
						attention:
							improvements.reduce((sum, imp) => sum + (imp?.attention || 0), 0) /
							improvements.length,
					};
				}
			}

			const sessionDuration = completedSession?.duration || 0;

			set((state) => ({
				exercise: {
					...state.exercise,
					exerciseProgress: {
						...state.exercise.exerciseProgress,
						[videoUrl]: updatedProgress,
					},
					currentSession: null,
					exerciseHistory: newHistory,
					totalExercisesCompleted: totalExercisesCompleted + 1,
					totalExerciseTime: totalExerciseTime + sessionDuration,
					averageImprovement,
				},
			}));
		},

		pauseExercise: (videoUrl, currentTime) => {
			const progress = get().exercise.exerciseProgress[videoUrl];
			if (!progress) return;

			set((state) => ({
				exercise: {
					...state.exercise,
					exerciseProgress: {
						...state.exercise.exerciseProgress,
						[videoUrl]: {
							...progress,
							currentTime,
							lastWatchedAt: new Date().toISOString(),
						},
					},
				},
			}));
		},

		restartExercise: (videoUrl, currentMetrics) => {
			const progress = get().exercise.exerciseProgress[videoUrl];
			if (!progress) return;

			const updatedProgress: ExerciseProgress = {
				...progress,
				currentTime: 0,
				progressPercentage: 0,
				isCompleted: false,
				completedAt: undefined,
				lastWatchedAt: new Date().toISOString(),
				metricsBeforeExercise: currentMetrics,
				metricsAfterExercise: null,
				improvement: undefined,
				watchCount: progress.watchCount + 1,
			};

			// Start new session
			const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const session: ExerciseSession = {
				id: sessionId,
				videoUrl,
				videoTitle: progress.videoTitle,
				startedAt: new Date().toISOString(),
				duration: 0,
				metricsBeforeExercise: currentMetrics,
				metricsAfterExercise: null,
				wasCompleted: false,
			};

			set((state) => ({
				exercise: {
					...state.exercise,
					currentSession: session,
					exerciseProgress: {
						...state.exercise.exerciseProgress,
						[videoUrl]: updatedProgress,
					},
				},
			}));
		},

		getExerciseProgress: (videoUrl) => {
			return get().exercise.exerciseProgress[videoUrl] || null;
		},

		getExerciseHistory: () => {
			return get().exercise.exerciseHistory;
		},

		getExerciseStats: () => {
			const { totalExercisesCompleted, totalExerciseTime, averageImprovement } =
				get().exercise;
			return {
				totalCompleted: totalExercisesCompleted,
				totalTime: totalExerciseTime,
				averageImprovement,
			};
		},

		clearExerciseHistory: () => {
			set((state) => ({
				exercise: {
					...state.exercise,
					exerciseHistory: [],
					totalExercisesCompleted: 0,
					totalExerciseTime: 0,
					averageImprovement: {
						blinkRate: 0,
						perClose: 0,
						strainLevel: 0,
						attention: 0,
					},
				},
			}));
		},

		calculateImprovement: (before, after) => {
			return calculateImprovementHelper(before, after);
		},
	},
});

export default createExerciseSlice;
