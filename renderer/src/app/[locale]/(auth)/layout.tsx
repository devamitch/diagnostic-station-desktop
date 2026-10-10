'use client';
import { useRouter } from '@/i18n/navigation';
import useAppStore from '@/store';
import React, { useLayoutEffect } from 'react';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const hasTokenOrIsLoggedIn = useAppStore(
		(state) => !!state.auth.token || state.auth.isAuthenticated
	);

	useLayoutEffect(() => {
		if (hasTokenOrIsLoggedIn) {
			// router.push(`/dashboard`);
		}
	}, [hasTokenOrIsLoggedIn, router]);

	return children;
};

export default AuthLayout;
