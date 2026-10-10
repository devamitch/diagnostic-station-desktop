'use client';
import useTranslationData from '@/hooks/use-translation-data';
import { useLogin } from '@/hooks/use-user';
import { Link } from '@/i18n/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import styles from './LoginForm.module.css';
import { AppleSignInButton } from '../apple-sign-in-button';
import { TextInput, PasswordInput } from '@/components/base/inputs';

export default function LoginForm() {
	const { loginFormText } = useTranslationData();
	const { form, mutation: loginMutation, isPending, onSubmit } = useLogin();
	const [showResetForm, setShowResetForm] = useState(false);
	const [resetEmail, setResetEmail] = useState('');
	const [resetSuccess, setResetSuccess] = useState(false);
	const [resetError, setResetError] = useState('');
	const [isResetting, setIsResetting] = useState(false);

	// Email validation helper for reset form
	const isValidEmail = (email: string) => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	};

	// Password reset handler
	const handlePasswordReset = async (e: React.FormEvent) => {
		e.preventDefault();
		setResetError('');
		setResetSuccess(false);

		if (!resetEmail) {
			setResetError(loginFormText.validationErrors.emptyFields);
			return;
		}

		if (!isValidEmail(resetEmail)) {
			setResetError(loginFormText.validationErrors.invalidEmail);
			return;
		}

		setIsResetting(true);

		try {
			// TODO: Implement your password reset logic here
			// Example: await resetPassword(resetEmail);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			setResetSuccess(true);
			setTimeout(() => {
				setShowResetForm(false);
				setResetSuccess(false);
				setResetEmail('');
			}, 3000);
		} catch (error: any) {
			setResetError(error.message || 'Failed to send reset email. Please try again.');
		} finally {
			setIsResetting(false);
		}
	};

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h2 className={styles.title}>{loginFormText.signInButton}</h2>
				<div className={styles.placeholder} />
			</div>

			<div className={styles.formWrapper}>
				<div className={styles.welcomeHeader}>
					<h2 className={styles.WelcomeTitle}>{loginFormText.title}</h2>
					<p className={styles.subtitle}>{loginFormText.subtitle}</p>
				</div>

				{!showResetForm ? (
					<FormProvider {...form}>
						<form onSubmit={onSubmit} className={styles.form}>
							{/* Email Field */}
						<TextInput
							type="email"
							id="email"
							name="email"
							label={loginFormText.emailLabel}
							placeholder={loginFormText.emailPlaceholder}
							value={(form.watch('email') as string) || ''}
							onChange={(value) => form.setValue('email', value, { shouldValidate: true })}
							onBlur={() => form.trigger('email')}
							error={form.formState.errors.email?.message}
							disabled={isPending}
							required
							autoComplete="email"
						/>
						<PasswordInput
							id="password"
							name="password"
							label={loginFormText.passwordLabel}
							placeholder={loginFormText.passwordPlaceholder}
							value={(form.watch('password') as string) || ''}
							onChange={(value) => form.setValue('password', value, { shouldValidate: true })}
							onBlur={() => form.trigger('password')}
							error={form.formState.errors.password?.message}
							disabled={isPending}
							required
							showStrength={false}
							autoComplete="current-password"
						/>
							{/* Forgot Password Link */}
							<div className={styles.forgotPassword}>
								<button
									type="button"
									onClick={() => setShowResetForm(true)}
									className={styles.forgotLink}
									disabled={isPending}
								>
									{loginFormText.forgotPasswordText}
								</button>
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								className={`${styles.button} ${
									isPending || loginMutation.isPending ? styles.buttonLoading : ''
								}`}
								disabled={isPending || loginMutation.isPending}
							>
								{loginMutation.isPending || isPending ? (
									<>
										<Loader2 className={styles.spinner} size={20} />
										{loginFormText.loadingButtonText}
									</>
								) : (
									loginFormText.signInButton
								)}
							</button>

							{/* Social Divider */}
							<div className={styles.socialDivider}>
								<div className={styles.dividerLine}></div>
								<span className={styles.dividerText}>
									{loginFormText.socialDividerText}
								</span>
								<div className={styles.dividerLine}></div>
							</div>

							{/* Apple Sign In */}
							<AppleSignInButton/>

							{/* Create Account Link */}
							<div className={styles.linkContainer}>
								{loginFormText.createAccountText}{' '}
								<Link href="/register" className={styles.link}>
									{loginFormText.createAccountLink}
								</Link>
							</div>
						</form>
					</FormProvider>
				) : (
					/* Password Reset Form */
					<form onSubmit={handlePasswordReset} className={styles.form}>
						<h2 className={styles.resetTitle}>{loginFormText.resetTitle}</h2>
						<p className={styles.resetSubtitle}>{loginFormText.resetSubtitle}</p>

						{/* Success Message */}
						{resetSuccess && (
							<div className={styles.success}>
								<CheckCircle size={20} className={styles.successIconLarge} />
								<div className={styles.successContent}>
									<p className={styles.successTitle}>
										{loginFormText.resetSuccessTitle}
									</p>
									<p className={styles.successMessage}>
										{loginFormText.resetSuccessMessage}
									</p>
								</div>
							</div>
						)}

						{/* Reset Email Field */}
					<TextInput
						type="email"
						id="resetEmail"
						name="resetEmail"
						label={loginFormText.emailLabel}
						placeholder={loginFormText.emailPlaceholder}
						value={resetEmail}
						onChange={(value) => {
							setResetEmail(value);
							setResetError('');
						}}
						error={resetError}
						disabled={isResetting}
						required
						autoComplete="email"
					/>
						{/* Reset Actions */}
						<div className={styles.resetActions}>
							<button
								type="submit"
								className={`${styles.button} ${isResetting ? styles.buttonLoading : ''}`}
								disabled={isResetting}
							>
								{isResetting ? (
									<>
										<Loader2 className={styles.spinner} size={20} />
										{loginFormText.resetLoadingText}
									</>
								) : (
									loginFormText.sendResetButton
								)}
							</button>

							<button
								type="button"
								onClick={() => {
									setShowResetForm(false);
									setResetError('');
									setResetEmail('');
								}}
								className={styles.secondaryButton}
								disabled={isResetting}
							>
								{loginFormText.backToLoginButton}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}