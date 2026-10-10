import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { deepMerge } from '@/utils/deepMerge';
import { customEncryptedStorage } from './encryption';
import createAuthSlice, { AuthSlice } from './slices/auth.slice';

export type AuthStoreState = AuthSlice;

export const useAuthStore = create<AuthStoreState>()(
	devtools(
		persist(
			immer((...a) => ({
				...createAuthSlice(...a),
			})),
			{
				name: 'auth-storage',
				version: 2,
				// storage: customEncryptedStorage,
				storage: customEncryptedStorage,
				merge: (persistedState, currentState) => deepMerge(currentState, persistedState),
			}
		)
	)
);

export default useAuthStore;
