import React from 'react';
import useAppStore from '.';

// Global hydration state
let isHydrated = false;

export const useHydrated = () => {
	const [hydrated, setHydrated] = React.useState(false);
	// In your hook
	// or loading state

	React.useEffect(() => {
		useAppStore.persist.rehydrate();
		isHydrated = true;
		setHydrated(true);
	}, []);

	return hydrated;
};

// // Wrapper hook that ensures store is hydrated
// export const useAppStoreHydrated = () => {
// 	const hydrated = useHydrated();

// 	// Return store only after hydration
// 	if (!hydrated) {
// 		return null;
// 	}

// 	return useAppStore();
// };
