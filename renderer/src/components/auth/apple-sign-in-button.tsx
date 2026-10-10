'use client';

import { useAppleSavedLogin } from '@/hooks/use-user';
import { useEffect, useState } from 'react';
import styles from './auth.module.css';

export function AppleLogo({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
		</svg>
	);
}

interface AppleSignInButtonProps {
	onClick?: () => void;
	isLoading?: boolean;
	disabled?: boolean;
}

export function AppleSignInButton(props: AppleSignInButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState({ type: '', message: '' });
	const appleSavedLoginMutation = useAppleSavedLogin();

	// ✅ Listen for IPC success event (optional fallback)
	useEffect(() => {
		if (typeof window !== 'undefined' && window.ipc) {
			const cleanup = window.ipc.on('apple-signin-success', (event: any, data: any) => {
				console.log('[AppleSignInButton] 🎉 IPC Success event:', data);
				appleSavedLoginMutation.mutate(data);
			});

			return cleanup;
		}
	}, [appleSavedLoginMutation]);

	const handleAppleSignIn = async () => {
		console.log('[AppleSignInButton] 🍎 Apple Sign-In button clicked');
		setIsLoading(true);
		setError({ type: '', message: '' });

		try {
			if (typeof window !== 'undefined' && window.ipc) {
				console.log('[AppleSignInButton] Calling window.ipc.appleSignIn()...');

				const result = await window.ipc.appleSignIn();

				console.log('[AppleSignInButton] 📥 Result received:', result);

				if (result.success) {
					console.log('[AppleSignInButton] ✅ Sign-in successful');
					console.log('[AppleSignInButton] User:', result.user);

					// ✅ Trigger the mutation with full result
					appleSavedLoginMutation.mutate(result);
				} else {
					console.error('[AppleSignInButton] ❌ Sign-in failed:', result.error);
					setError({
						type: 'apple_signin',
						message: result.error || 'Failed to sign in with Apple',
					});
				}
			} else {
				console.error('[AppleSignInButton] ❌ Not running in Electron');
				setError({
					type: 'apple_signin',
					message: 'This app must be run in Electron',
				});
			}
		} catch (error) {
			console.error('[AppleSignInButton] ❌ Exception during sign-in:', error);
			setError({
				type: 'apple_signin',
				message: error instanceof Error ? error.message : 'Failed to sign in with Apple',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<button
				onClick={handleAppleSignIn}
				disabled={appleSavedLoginMutation?.isPending || isLoading}
				className={styles['apple-signin-button']}
				aria-label="Sign in with Apple"
			>
				<AppleLogo className={styles['apple-signin-logo']} />
				<span className={styles['apple-signin-text']}>
					{appleSavedLoginMutation?.isPending || isLoading
						? 'Signing in...'
						: 'Sign in with Apple'}
				</span>
			</button>

			{/* Error Display */}
			{(error.message || appleSavedLoginMutation.isError) && (
				<div className={styles['error-message']}>
					<p>
						{error.message ||
							appleSavedLoginMutation.error?.message ||
							'Apple Sign-In failed'}
					</p>
				</div>
			)}
		</>
	);
}
