'use client';

import QuoteLoader, { LOADING_QUOTES } from '@/components/layout/PictureInMode/QuoteLoader';
import { useRouter } from '@/i18n/navigation';
import useAppStore from '@/store';
import { AuthState } from '@/store/slices/auth.slice';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Toaster } from 'sonner';

const authUserContext = createContext<AuthState | undefined>(undefined);

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
	const user = useAppStore((state) => state.auth.user);
	const isLoading = useAppStore((state) => state.auth.isLoading);
	const isAuthenticated = useAppStore((state) => state.auth.isAuthenticated);
	const token = useAppStore((state) => state.auth.token);
	const refreshToken = useAppStore((state) => state.auth.refreshToken);
	const error = useAppStore((state) => state.auth.error);
	const loginAttempts = useAppStore((state) => state.auth.loginAttempts);
	const router = useRouter();
	const [loadingQuote, setLoadingQuote] = useState('');
	const [showLoading, setShowLoading] = useState(true);

	const hasTokenOrIsLoggedIn = !!token || isAuthenticated;

	useEffect(() => {
		const randomQuote = LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)];
		setLoadingQuote(randomQuote);
		const timer = setTimeout(() => setShowLoading(false), 1200);
		return () => clearTimeout(timer);
	}, []);

	if (showLoading) {
		return <QuoteLoader quote={loadingQuote} />;
	}

	return (
		<authUserContext.Provider
			value={{
				user: user ?? null,
				isAuthenticated: !!isAuthenticated,
				isLoading: !!isLoading,
				token,
				refreshToken,
				error,
				loginAttempts,
			}}
		>
			{children}
			<Toaster />
			{showLoading && <QuoteLoader quote={loadingQuote} />}
		</authUserContext.Provider>
	);
}

export const useAuth = () => {
	const context = useContext(authUserContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthUserProvider');
	}
	return context;
};
