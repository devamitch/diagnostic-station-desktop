'use client';
import useTranslationData from '@/hooks/use-translation-data';
import { useRegisterUser } from '@/hooks/use-user';
import { Link, useRouter } from '@/i18n/navigation';
import { ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import styles from './RegisterForm.module.css';
import { AppleSignInButton } from '../apple-sign-in-button';
import { TextInput, PasswordInput } from '@/components/base/inputs';

export default function RegisterForm() {
	const { registerFormText } = useTranslationData();
	const { form, mutation, onSubmit, isPending } = useRegisterUser();
	const router = useRouter();

	// Watch confirmPassword for matching validation
	const passwordValue = form.watch('password');
	const confirmPasswordValue = form.watch('confirmPassword');

	return (
		<FormProvider {...form}>
			<div className={styles.container}>
				<div className={styles.header}>
					<ChevronLeft
						size={36}
						className={styles.chevron}
						onClick={() => router.back()}
						style={{ cursor: 'pointer' }}
					/>
					<h2 className={styles.title}>{registerFormText.title}</h2>
					<div className={styles.placeholder} />
				</div>

				<div className={styles.formWrapper}>
					<div className={styles.welcomeHeader}>
						<h2 className={styles.welcomeTitle}>{registerFormText.title}</h2>
						<p className={styles.subtitle}>{registerFormText.subtitle}</p>
					</div>
					<form onSubmit={onSubmit} className={styles.form}>
						{/* Name Field */}
						<TextInput
							type="text"
							id="name"
							name="name"
							label={registerFormText.nameLabel}
							placeholder={registerFormText.namePlaceholder}
							value={(form.watch('name') as string) || ''}
							onChange={(value) => form.setValue('name', value, { shouldValidate: true })}
							onBlur={() => form.trigger('name')}
							error={form.formState.errors.name?.message}
							disabled={isPending}
							required
							autoComplete="name"
						/>

						{/* Email Field */}
						<TextInput
							type="email"
							id="email"
							name="email"
							label={registerFormText.emailLabel}
							placeholder={registerFormText.emailPlaceholder}
							value={(form.watch('email') as string) || ''}
							onChange={(value) => form.setValue('email', value, { shouldValidate: true })}
							onBlur={() => form.trigger('email')}
							error={form.formState.errors.email?.message}
							disabled={isPending}
							required
							autoComplete="email"
						/>

						{/* Password Field */}
						<PasswordInput
							id="password"
							name="password"
							label={registerFormText.passwordLabel}
							placeholder={registerFormText.passwordPlaceholder}
							value={(form.watch('password') as string) || ''}
							onChange={(value) => form.setValue('password', value, { shouldValidate: true })}
							onBlur={() => form.trigger('password')}
							error={form.formState.errors.password?.message}
							disabled={isPending}
							required
							showStrength={true}
							autoComplete="new-password"
						/>

						{/* Confirm Password Field */}
						<PasswordInput
							id="confirmPassword"
							name="confirmPassword"
							label={registerFormText.confirmPasswordLabel}
							placeholder={registerFormText.confirmPasswordPlaceholder}
							value={(form.watch('confirmPassword') as string) || ''}
							onChange={(value) => form.setValue('confirmPassword', value, { shouldValidate: true })}
							onBlur={() => form.trigger('confirmPassword')}
							error={form.formState.errors.confirmPassword?.message}
							disabled={isPending}
							required
							showStrength={false}
							autoComplete="new-password"
						/>

						{/* Terms Checkbox */}
						<div className={styles.checkboxGroup}>
							<input
								id="acceptTerms"
								type="checkbox"
								className={styles.checkbox}
								disabled={isPending}
								{...form.register('acceptTerms', {
									required: 'You must accept the terms to continue',
								})}
							/>
							<label htmlFor="acceptTerms" className={styles.checkboxLabel}>
								{registerFormText.termsCheckboxText}{' '}
								<Link href="/terms-and-services" className={styles.link}>
									{registerFormText.termsLinkText}
								</Link>{' '}
								{registerFormText.andText}{' '}
								<Link href="/privacy-policy" className={styles.link}>
									{registerFormText.privacyLinkText}
								</Link>
							</label>
						</div>
						{form.formState.errors.acceptTerms && (
							<div className={styles.errorText}>
								<AlertCircle size={16} />
								<span>{form.formState.errors.acceptTerms.message}</span>
							</div>
						)}

						{/* Submit Button */}
						<button
							type="submit"
							className={`${styles.button} ${
								mutation.isPending || isPending ? styles.buttonLoading : ''
							}`}
							disabled={mutation.isPending || isPending}
						>
							{isPending || mutation.isPending ? (
								<>
									<Loader2 className={styles.spinner} size={20} />
									{registerFormText.loadingButtonText}
								</>
							) : (
								registerFormText.submitButtonText
							)}
						</button>
					</form>
					<div className={styles.socialDivider}>
						<div className={styles.dividerLine}></div>
						<span className={styles.dividerText}>
							{registerFormText.socialDividerText}
						</span>
						<div className={styles.dividerLine}></div>
					</div>{' '}
					<AppleSignInButton />
					<div className={styles.linkContainer}>
						{registerFormText.signInLinkText}{' '}
						<Link href="/signin" className={styles.link}>
							{registerFormText.signInText}
						</Link>
					</div>
				</div>
			</div>
		</FormProvider>
	);
}