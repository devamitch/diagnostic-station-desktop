import {
	SECURITY_CONFIG,
	detectInjectionPatterns,
	sanitizeText,
	sanitizeTextarea,
	validateEmail,
	validatePassword,
	validatePhone,
	validateURL,
} from '@/lib/utils/inputSanitizer';
import { Eye, EyeOff } from 'lucide-react';
import React, { ChangeEvent, FocusEvent, useCallback, useMemo, useState } from 'react';
import styles from './input.module.css';

type InputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';

interface BaseInputProps {
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	className?: string;
	label?: string;
	error?: string;
	maxLength?: number;
	autoComplete?: string;
	name?: string;
	id?: string;
}

interface TextInputProps extends BaseInputProps {
	type?: Extract<InputType, 'text' | 'email' | 'tel' | 'url'>;
	validateOnBlur?: boolean;
	showStrength?: boolean;
}

interface PasswordInputProps extends Omit<BaseInputProps, 'type'> {
	showStrength?: boolean;
	confirmPassword?: boolean;
}

interface TextareaProps extends BaseInputProps {
	rows?: number;
	cols?: number;
	resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

interface NumberInputProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
	value: number | '';
	onChange: (value: number | '') => void;
	min?: number;
	max?: number;
	step?: number;
	allowDecimals?: boolean;
}

// ====================  TEXT INPUT ====================

export const TextInput: React.FC<TextInputProps> = ({
	value,
	onChange,
	onBlur,
	type = 'text',
	placeholder,
	disabled = false,
	required = false,
	className = '',
	label,
	error,
	maxLength,
	validateOnBlur = true,
	autoComplete = 'off',
	name,
	id,
}) => {
	const [internalError, setInternalError] = useState<string>('');
	const [isTouched, setIsTouched] = useState(false);

	const effectiveMaxLength = useMemo(() => {
		if (maxLength) return maxLength;
		if (type === 'email') return SECURITY_CONFIG.maxEmailLength;
		if (type === 'url') return SECURITY_CONFIG.maxUrlLength;
		return SECURITY_CONFIG.maxInputLength;
	}, [type, maxLength]);

	const handleChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const rawValue = e.target.value;

			// Detect injection attempts
			if (detectInjectionPatterns(rawValue)) {
				setInternalError('Invalid characters detected');
				return;
			}

			// Sanitize based on type
			let sanitized: string | null = rawValue;

			switch (type) {
				case 'email':
					// Don't validate on every keystroke, just sanitize
					sanitized = rawValue.toLowerCase().trim().slice(0, effectiveMaxLength);
					break;
				case 'tel':
					// Allow only numbers, +, -, (, ), and spaces during typing
					sanitized = rawValue.replace(/[^0-9+\-() ]/g, '').slice(0, 20);
					break;
				case 'url':
					sanitized = rawValue.trim().slice(0, effectiveMaxLength);
					break;
				default:
					sanitized = sanitizeText(rawValue, effectiveMaxLength);
			}

			if (sanitized !== null) {
				onChange(sanitized);
				setInternalError('');
			}
		},
		[type, onChange, effectiveMaxLength]
	);

	// Handle blur with validation
	const handleBlur = useCallback(
		(e: FocusEvent<HTMLInputElement>) => {
			setIsTouched(true);

			if (!validateOnBlur) {
				onBlur?.();
				return;
			}

			const currentValue = e.target.value;

			// Skip validation if empty and not required
			if (!currentValue && !required) {
				onBlur?.();
				return;
			}

			// Validate based on type
			let isValid = true;
			let errorMsg = '';

			switch (type) {
				case 'email':
					const validEmail = validateEmail(currentValue);
					if (!validEmail && currentValue) {
						isValid = false;
						errorMsg = 'Please enter a valid email address';
					}
					break;
				case 'tel':
					const validPhone = validatePhone(currentValue);
					if (!validPhone && currentValue) {
						isValid = false;
						errorMsg = 'Please enter a valid phone number';
					}
					break;
				case 'url':
					const validUrl = validateURL(currentValue);
					if (!validUrl && currentValue) {
						isValid = false;
						errorMsg = 'Please enter a valid URL';
					}
					break;
			}

			if (required && !currentValue) {
				isValid = false;
				errorMsg = 'This field is required';
			}

			setInternalError(errorMsg);
			onBlur?.();
		},
		[validateOnBlur, required, type, onBlur]
	);

	const displayError = error || (isTouched ? internalError : '');

	return (
		<div className={`${styles['input-wrapper']} ${className}`}>
			{label && (
				<label htmlFor={id || name} className={styles['input-label']}>
					{label}
					{required && <span className={styles['required-asterisk']}> *</span>}
				</label>
			)}

			<input
				type={type}
				id={id || name}
				name={name}
				value={value}
				onChange={handleChange}
				onBlur={handleBlur}
				placeholder={placeholder}
				disabled={disabled}
				required={required}
				maxLength={effectiveMaxLength}
				autoComplete={autoComplete}
				className={`${styles.input} ${displayError ? styles.error : ''}`}
				aria-invalid={!!displayError}
				aria-describedby={displayError ? `${id || name}-error` : undefined}
			/>

			{displayError && (
				<span id={`${id || name}-error`} className={styles['error-message']} role="alert">
					{displayError}
				</span>
			)}
		</div>
	);
};

// ====================  PASSWORD INPUT ====================

export const PasswordInput: React.FC<PasswordInputProps> = ({
	value,
	onChange,
	onBlur,
	placeholder = 'Enter password',
	disabled = false,
	required = true,
	className = '',
	label = 'Password',
	error,
	maxLength = 128,
	showStrength = true,
	autoComplete = 'current-password',
	name = 'password',
	id,
}) => {
	const [showPassword, setShowPassword] = useState(false);
	const [isTouched, setIsTouched] = useState(false);

	// Calculate password strength
	const passwordValidation = useMemo(() => {
		if (!value || !showStrength) return null;
		return validatePassword(value);
	}, [value, showStrength]);

	// Handle change with sanitization
	const handleChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const rawValue = e.target.value;

			// Sanitize password (remove only obviously dangerous patterns)
			const sanitized = rawValue
				.replace(/<[^>]*>/g, '') // Remove HTML tags
				.replace(/[<>]/g, '') // Remove angle brackets
				.slice(0, maxLength);

			onChange(sanitized);
		},
		[onChange, maxLength]
	);

	const handleBlur = useCallback(() => {
		setIsTouched(true);
		onBlur?.();
	}, [onBlur]);

	const togglePasswordVisibility = useCallback(() => {
		setShowPassword((prev) => !prev);
	}, []);

	const displayError =
		error ||
		(isTouched && passwordValidation && !passwordValidation.isValid
			? passwordValidation.errors[0]
			: '');

	return (
		<div className={`${styles['input-wrapper']} ${styles['password-wrapper']} ${className}`}>
			{label && (
				<label htmlFor={id || name} className={styles['input-label']}>
					{label}
					{required && <span className={styles['required-asterisk']}> *</span>}
				</label>
			)}

			<div className={styles['passwordinput-container']}>
				<input
					type={showPassword ? 'text' : 'password'}
					id={id || name}
					name={name}
					value={value}
					onChange={handleChange}
					onBlur={handleBlur}
					placeholder={placeholder}
					disabled={disabled}
					required={required}
					maxLength={maxLength}
					autoComplete={autoComplete}
					className={`${styles.input} ${styles.passwordinput} ${displayError ? styles.error : ''}`}
					aria-invalid={!!displayError}
					aria-describedby={displayError ? `${id || name}-error` : undefined}
				/>

				<button
					type="button"
					onClick={togglePasswordVisibility}
					className={styles['password-toggle']}
					aria-label={showPassword ? 'Hide password' : 'Show password'}
					tabIndex={-1}
				>
					{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
				</button>
			</div>

			{/* Password strength indicator */}
			{showStrength && value && passwordValidation && (
				<div className={styles['password-strength-container']}>
					<div className={styles['password-strength-bar']}>
						<div
							className={`${styles['strength-indicator']} ${styles[`strength-${passwordValidation.strength}`]}`}
							style={{
								width: `${
									passwordValidation.strength === 'very-strong'
										? 100
										: passwordValidation.strength === 'strong'
											? 75
											: passwordValidation.strength === 'medium'
												? 50
												: 25
								}%`,
							}}
						/>
					</div>
					<span className={`${styles['strength-text']} ${styles[`strength-${passwordValidation.strength}`]}`}>
						{passwordValidation.strength.replace('-', ' ')}
					</span>
				</div>
			)}

			{displayError && (
				<span id={`${id || name}-error`} className={styles['error-message']} role="alert">
					{displayError}
				</span>
			)}

			{/* Password requirements */}
			{showStrength && isTouched && value && !passwordValidation?.isValid && (
				<ul className={styles['password-requirements']}>
					{passwordValidation?.errors.map((err, idx) => (
						<li key={idx} className={styles['requirement-error']}>
							{err}
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

// ====================  TEXTAREA ====================

export const Textarea: React.FC<TextareaProps> = ({
	value,
	onChange,
	onBlur,
	placeholder,
	disabled = false,
	required = false,
	className = '',
	label,
	error,
	maxLength,
	rows = 4,
	cols,
	resize = 'vertical',
	autoComplete = 'off',
	name,
	id,
}) => {
	const [internalError, setInternalError] = useState<string>('');
	const [isTouched, setIsTouched] = useState(false);

	const effectiveMaxLength = maxLength || SECURITY_CONFIG.maxTextareaLength;

	// Handle change with sanitization
	const handleChange = useCallback(
		(e: ChangeEvent<HTMLTextAreaElement>) => {
			const rawValue = e.target.value;

			// Detect injection attempts
			if (detectInjectionPatterns(rawValue)) {
				setInternalError('Invalid characters detected');
				return;
			}

			// Sanitize textarea content
			const sanitized = sanitizeTextarea(rawValue);

			if (sanitized.length <= effectiveMaxLength) {
				onChange(sanitized);
				setInternalError('');
			}
		},
		[onChange, effectiveMaxLength]
	);

	const handleBlur = useCallback(() => {
		setIsTouched(true);

		if (required && !value) {
			setInternalError('This field is required');
		} else {
			setInternalError('');
		}

		onBlur?.();
	}, [value, required, onBlur]);

	const displayError = error || (isTouched ? internalError : '');
	const charCount = value.length;

	return (
		<div className={`${styles['input-wrapper']} ${styles['textarea-wrapper']} ${className}`}>
			{label && (
				<label htmlFor={id || name} className={styles['input-label']}>
					{label}
					{required && <span className={styles['required-asterisk']}> *</span>}
				</label>
			)}

			<textarea
				id={id || name}
				name={name}
				value={value}
				onChange={handleChange}
				onBlur={handleBlur}
				placeholder={placeholder}
				disabled={disabled}
				required={required}
				maxLength={effectiveMaxLength}
				rows={rows}
				cols={cols}
				autoComplete={autoComplete}
				className={`${styles['-textarea']} ${displayError ? styles.error : ''}`}
				style={{ resize }}
				aria-invalid={!!displayError}
				aria-describedby={displayError ? `${id || name}-error` : undefined}
			/>

			<div className={styles['textarea-footer']}>
				<span className={styles['char-count']}>
					{charCount} / {effectiveMaxLength}
				</span>
			</div>

			{displayError && (
				<span id={`${id || name}-error`} className={styles['error-message']} role="alert">
					{displayError}
				</span>
			)}
		</div>
	);
};

// ====================  NUMBER INPUT ====================

export const NumberInput: React.FC<NumberInputProps> = ({
	value,
	onChange,
	onBlur,
	placeholder,
	disabled = false,
	required = false,
	className = '',
	label,
	error,
	min,
	max,
	step = 1,
	allowDecimals = false,
	name,
	id,
}) => {
	const [internalError, setInternalError] = useState<string>('');
	const [isTouched, setIsTouched] = useState(false);

	const handleChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const rawValue = e.target.value;

			// Allow empty value
			if (rawValue === '') {
				onChange('');
				setInternalError('');
				return;
			}

			// Validate number format
			const numberRegex = allowDecimals ? /^-?\d*\.?\d*$/ : /^-?\d*$/;

			if (!numberRegex.test(rawValue)) {
				return; // Don't update if invalid format
			}

			const numValue = allowDecimals ? parseFloat(rawValue) : parseInt(rawValue, 10);

			if (isNaN(numValue)) {
				return;
			}

			// Check min/max
			if (min !== undefined && numValue < min) {
				setInternalError(`Value must be at least ${min}`);
			} else if (max !== undefined && numValue > max) {
				setInternalError(`Value must be at most ${max}`);
			} else {
				setInternalError('');
			}

			onChange(numValue);
		},
		[onChange, min, max, allowDecimals]
	);

	const handleBlur = useCallback(() => {
		setIsTouched(true);

		if (required && (value === '' || value === null || value === undefined)) {
			setInternalError('This field is required');
		}

		onBlur?.();
	}, [value, required, onBlur]);

	const displayError = error || (isTouched ? internalError : '');

	return (
		<div className={`${styles['input-wrapper']} ${styles['number-wrapper']} ${className}`}>
			{label && (
				<label htmlFor={id || name} className={styles['input-label']}>
					{label}
					{required && <span className={styles['required-asterisk']}> *</span>}
				</label>
			)}

			<input
				type="number"
				id={id || name}
				name={name}
				value={value}
				onChange={handleChange}
				onBlur={handleBlur}
				placeholder={placeholder}
				disabled={disabled}
				required={required}
				min={min}
				max={max}
				step={step}
				className={`${styles.input} ${styles.numberinput} ${displayError ? styles.error : ''}`}
				aria-invalid={!!displayError}
				aria-describedby={displayError ? `${id || name}-error` : undefined}
			/>

			{displayError && (
				<span id={`${id || name}-error`} className={styles['error-message']} role="alert">
					{displayError}
				</span>
			)}
		</div>
	);
};

export default {
	TextInput,
	PasswordInput,
	Textarea,
	NumberInput,
};
