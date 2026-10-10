import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Import slices
import { deepMerge } from '@/utils/deepMerge';
import { createJSONStorage } from 'zustand/middleware';
import { storage } from './index-db-storage';
import createApiSlice, { ApiSlice } from './slices/api.slice';
import createCameraSlice, { type CameraSlice } from './slices/camera.slice';
import createEyeTrackingSlice, { type EyeTrackingSlice } from './slices/eye-tracking.slice';
import createScreenTimeSlice, { type ScreenTimeSlice } from './slices/screen-time.slice';
import createSocketSlice, { SocketSlice } from './slices/socket.slice';

// Combined store state
export type AppStoreState = ApiSlice &
	CameraSlice &
	ScreenTimeSlice &
	EyeTrackingSlice &
	SocketSlice &
	SocketSlice ;

export const useIndexAppStore = create<AppStoreState>()(
	devtools(
		persist(
			immer((...a) => ({
				...createCameraSlice(...a),
				...createScreenTimeSlice(...a),
				...createEyeTrackingSlice(...a),
				...createApiSlice(...a),
				...createSocketSlice(...a),
			})),
			{
				name: 'a-eye-scan-storage2',
				version: 1,
				skipHydration: false,
				storage: createJSONStorage(() => storage),
				merge: (persistedState, currentState) => deepMerge(currentState, persistedState),
			}
		)
	)
);

export default useIndexAppStore;
