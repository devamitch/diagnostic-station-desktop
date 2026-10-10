'use client';

import { useRouter } from '@/i18n/navigation';
import { useEffect } from 'react';

export function ClientNavigationHandler() {
	const router = useRouter();

	useEffect(() => {
		if (typeof window === 'undefined' || !(window as any).ipc) return;

		const handleClientNavigation = (_event: any, urlPath: string) => {
			console.log('[ClientNavigationHandler] Navigating to:', urlPath);

			// Use Next.js router for client-side navigation
			router.push(`/${urlPath}`);
		};

		// Listen for navigation events from Electron
		const ipc = (window as any).ipc;
		const cleanup = ipc.on?.('navigate-client-side', handleClientNavigation);

		return () => {
			if (typeof cleanup === 'function') {
				cleanup();
			}
		};
	}, [router]);

	return null;
}
