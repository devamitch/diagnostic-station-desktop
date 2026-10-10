'use client';

import { useEyeTracking } from '@/hooks/useEyeTracking';
import { useMetricsPosting } from '@/hooks/useMetricsPosting';
import { usePathname } from '@/i18n/navigation';
import React, { createContext, ReactNode, useContext, useEffect, useRef } from 'react';

type EyeTrackingContextType = ReturnType<typeof useEyeTracking>;

const EyeTrackingContext = createContext<EyeTrackingContextType | undefined>(undefined);

export const useEyeTrackingContext = () => {
	const context = useContext(EyeTrackingContext);
	if (context === undefined) {
		throw new Error('useEyeTrackingContext must be used within an EyeTrackingProvider');
	}
	return context;
};

interface EyeTrackingProviderProps {
	children: ReactNode;
}

export const EyeTrackingProvider: React.FC<EyeTrackingProviderProps> = ({ children }) => {
	const eyeTracking = useEyeTracking();
	const pathname = usePathname();
	const previousPathnameRef = useRef(pathname);
	useMetricsPosting();
	// **Simple navigation handling**
	useEffect(() => {
		if (previousPathnameRef.current !== pathname) {
			console.log('[EyeTrackingProvider] Route changed, preserving camera');
			sessionStorage.setItem('isNavigating', 'true');

			setTimeout(() => {
				sessionStorage.removeItem('isNavigating');
			}, 500);

			previousPathnameRef.current = pathname;
		}
	}, [pathname]);

	return (
		<EyeTrackingContext.Provider value={eyeTracking}>{children}</EyeTrackingContext.Provider>
	);
};
