'use client';

import PictureInMode from '@/components/layout/PictureInMode/PictureInMode';
import { usePathname } from '@/i18n/navigation';
import useAppStore from '@/store';
import { useEffect, useState } from 'react';

/**
 * Wrapper component that conditionally renders PictureInMode
 * only when user is authenticated and on dashboard routes
 */
export function ConditionalPictureInMode() {
	const pathname = usePathname();
	const hasTokenOrIsLoggedIn = useAppStore((state) => !!state.auth.token);
	const [shouldRender, setShouldRender] = useState(false);

	useEffect(() => {
		// Only render if authenticated and not on auth pages
		const isAuthPage = pathname?.includes('/signin') || pathname?.includes('/register');
		setShouldRender(hasTokenOrIsLoggedIn && !isAuthPage);
	}, [hasTokenOrIsLoggedIn, pathname]);

	if (!shouldRender) {
		return null;
	}

	return <PictureInMode />;
}
