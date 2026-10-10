import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Import slices
import { deepMerge } from '@/utils/deepMerge';
import createApiSlice, { ApiSlice } from './slices/api.slice';
import createAuthSlice, { AuthSlice } from './slices/auth.slice';
import createCameraSlice, { type CameraSlice } from './slices/camera.slice';
import createExerciseSlice, { ExerciseSlice } from './slices/exercise.slice';
import createEyeTrackingSlice, { type EyeTrackingSlice } from './slices/eye-tracking.slice';
import createScreenTimeSlice, { type ScreenTimeSlice } from './slices/screen-time.slice';
import createSocketSlice, { SocketSlice } from './slices/socket.slice';

// Combined store state
export type AppStoreState = ApiSlice &
	AuthSlice &
	CameraSlice &
	ScreenTimeSlice &
	EyeTrackingSlice &
	SocketSlice &
	SocketSlice &
	ExerciseSlice;

export const useAppStore = create<AppStoreState>()(
	devtools(
		persist(
			immer((...a) => ({
				...createCameraSlice(...a),
				...createScreenTimeSlice(...a),
				...createEyeTrackingSlice(...a),
				...createAuthSlice(...a),
				...createApiSlice(...a),
				...createSocketSlice(...a),
				...createExerciseSlice(...a),
			})),
			{
				name: 'a-eye-scan-storage',
				version: 2,
				// storage: customEncryptedStorage,
				storage: createJSONStorage(() => localStorage),
				merge: (persistedState, currentState) => deepMerge(currentState, persistedState),
				partialize: (state) => ({
					...state,
					camera: {
						...state.camera,
						// Exclude runtime camera state from persistence
						isCameraActive: false,
						isTrackingActive: false,
						loading: false,
						cameraError: null,
						trackingError: null,
					},
				}),
			}
		)
	)
);

export const useBoundStore = create<AppStoreState>((...a) => ({
	...createCameraSlice(...a),
	...createScreenTimeSlice(...a),
	...createEyeTrackingSlice(...a),
	...createAuthSlice(...a),
	...createApiSlice(...a),
	...createSocketSlice(...a),
	...createExerciseSlice(...a),
}));

export const useBearStore = create<AppStoreState>()(
	persist(
		(...a) => ({
			...createCameraSlice(...a),
			...createScreenTimeSlice(...a),
			...createEyeTrackingSlice(...a),
			...createAuthSlice(...a),
			...createApiSlice(...a),
			...createSocketSlice(...a),
			...createExerciseSlice(...a),
		}),
		{
			name: 'food-storage', // name of the item in the storage (must be unique)
			storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
			partialize: (state) => ({
				...state,
				camera: {
					...state.camera,
					isCameraActive: false,
					isTrackingActive: false,
					loading: false,
					cameraError: null,
					trackingError: null,
				},
			}),
		}
	)
);
export default useAppStore;
