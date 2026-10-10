import DOMPurify from 'dompurify';

export const SECURITY_CONFIG = {
	maxInputLength: 1000,
	maxTextareaLength: 5000,
	maxEmailLength: 255,
	maxUrlLength: 2048,
	allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
	allowedDocTypes: ['application/pdf', 'text/csv', 'application/msword'],
	maxFileSize: 10 * 1024 * 1024, // 10MB
} as const;

export const sanitizeHTML = (dirty: string): string => {
	if (!dirty) return '';

	return DOMPurify.sanitize(dirty, {
		ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
		ALLOWED_ATTR: ['href', 'title', 'target'],
		ALLOW_DATA_ATTR: false,
		FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
		FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
	});
};

/**
 * Sanitize plain text input - removes all HTML and dangerous characters
 */
export const sanitizeText = (input: string, maxLength?: number): string => {
	if (!input) return '';

	const limit = maxLength || SECURITY_CONFIG.maxInputLength;

	return input
		.trim()
		.replace(/<[^>]*>/g, '') // Remove all HTML tags
		.replace(/[<>]/g, '') // Remove angle brackets
		.replace(/javascript:/gi, '') // Remove javascript: protocol
		.replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
		.replace(/data:/gi, '') // Remove data: protocol
		.replace(/vbscript:/gi, '') // Remove vbscript: protocol
		.slice(0, limit);
};

export const sanitizeTextarea = (input: string): string => {
	return sanitizeText(input, SECURITY_CONFIG.maxTextareaLength);
};

export const sanitizeForSQL = (input: string): string => {
	if (!input) return '';

	return input
		.replace(/['";\\]/g, '') // Remove quotes and backslashes
		.replace(/--/g, '') // Remove SQL comments
		.replace(/\/\*/g, '') // Remove multi-line comment start
		.replace(/\*\//g, '') // Remove multi-line comment end
		.replace(/\bUNION\b/gi, '') // Remove UNION keyword
		.replace(/\bSELECT\b/gi, '') // Remove SELECT keyword
		.replace(/\bINSERT\b/gi, '') // Remove INSERT keyword
		.replace(/\bUPDATE\b/gi, '') // Remove UPDATE keyword
		.replace(/\bDELETE\b/gi, '') // Remove DELETE keyword
		.replace(/\bDROP\b/gi, '') // Remove DROP keyword
		.replace(/\bEXEC\b/gi, '') // Remove EXEC keyword
		.replace(/xp_/gi, '') // Remove extended stored procedures
		.slice(0, SECURITY_CONFIG.maxInputLength);
};

export const validateEmail = (email: string): string | null => {
	if (!email) return null;

	const sanitized = email.toLowerCase().trim().slice(0, SECURITY_CONFIG.maxEmailLength);

	const emailRegex =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

	if (!emailRegex.test(sanitized)) {
		return null;
	}

	if (sanitized.includes('..') || sanitized.startsWith('.') || sanitized.endsWith('.')) {
		return null;
	}

	return sanitized;
};

export const validateURL = (url: string): string | null => {
	if (!url) return null;

	try {
		const sanitized = url.trim().slice(0, SECURITY_CONFIG.maxUrlLength);
		const urlObj = new URL(sanitized);

		// Only allow http and https protocols
		if (!['http:', 'https:'].includes(urlObj.protocol)) {
			return null;
		}

		// Block localhost and private IPs in production
		if (process.env.NODE_ENV === 'production') {
			const hostname = urlObj.hostname.toLowerCase();
			if (
				hostname === 'localhost' ||
				hostname === '127.0.0.1' ||
				hostname.startsWith('192.168.') ||
				hostname.startsWith('10.') ||
				hostname.match(/^172\.(1[6-9]|2\d|3[01])\./)
			) {
				return null;
			}
		}

		return sanitized;
	} catch {
		return null;
	}
};

export const validatePhone = (phone: string): string | null => {
	if (!phone) return null;

	const cleaned = phone.replace(/[^\d+]/g, '');

	const phoneRegex = /^\+?\d{10,15}$/;

	if (!phoneRegex.test(cleaned)) {
		return null;
	}

	return cleaned;
};

export const validatePassword = (
	password: string
): {
	isValid: boolean;
	strength: 'weak' | 'medium' | 'strong' | 'very-strong';
	errors: string[];
} => {
	const errors: string[] = [];
	let score = 0;

	if (!password) {
		return { isValid: false, strength: 'weak', errors: ['Password is required'] };
	}

	if (password.length < 8) {
		errors.push('Password must be at least 8 characters long');
	} else if (password.length >= 12) {
		score += 2;
	} else {
		score += 1;
	}

	if (!/[a-z]/.test(password)) {
		errors.push('Password must contain lowercase letters');
	} else {
		score += 1;
	}

	if (!/[A-Z]/.test(password)) {
		errors.push('Password must contain uppercase letters');
	} else {
		score += 1;
	}

	if (!/\d/.test(password)) {
		errors.push('Password must contain numbers');
	} else {
		score += 1;
	}

	if (!/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(password)) {
		errors.push('Password must contain special characters');
	} else {
		score += 1;
	}

	const commonPatterns = [
		/^123/,
		/^abc/i,
		/password/i,
		/qwerty/i,
		/admin/i,
		/^(.)\1+$/, // Repeated characters
	];

	if (commonPatterns.some((pattern) => pattern.test(password))) {
		errors.push('Password contains common patterns');
		score = Math.max(0, score - 2);
	}

	const isValid = errors.length === 0;

	let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
	if (isValid) {
		if (score >= 6) strength = 'very-strong';
		else if (score >= 5) strength = 'strong';
		else if (score >= 4) strength = 'medium';
	}

	return { isValid, strength, errors };
};

export const sanitizeFilename = (filename: string): string => {
	if (!filename) return 'file';

	return filename
		.replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe characters
		.replace(/\.{2,}/g, '.') // Remove multiple dots (path traversal)
		.replace(/^\.+/, '') // Remove leading dots
		.slice(0, 255); // Limit length
};

export const validateFileType = (
	file: File,
	allowedTypes: string[] = [
		...SECURITY_CONFIG.allowedImageTypes,
		...SECURITY_CONFIG.allowedDocTypes,
	]
): boolean => {
	if (!file || !file.type) return false;
	return allowedTypes.includes(file.type);
};

export const validateFileSize = (
	file: File,
	maxSize: number = SECURITY_CONFIG.maxFileSize
): boolean => {
	if (!file) return false;
	return file.size <= maxSize;
};

export const validateInteger = (input: any, min?: number, max?: number): number | null => {
	const num = parseInt(String(input), 10);

	if (isNaN(num) || !isFinite(num)) {
		return null;
	}

	if (min !== undefined && num < min) {
		return null;
	}

	if (max !== undefined && num > max) {
		return null;
	}

	return num;
};

export const validateFloat = (input: any, min?: number, max?: number): number | null => {
	const num = parseFloat(String(input));

	if (isNaN(num) || !isFinite(num)) {
		return null;
	}

	if (min !== undefined && num < min) {
		return null;
	}

	if (max !== undefined && num > max) {
		return null;
	}

	return num;
};

export const validateJSON = <T = any>(jsonString: string, maxSize: number = 10000): T | null => {
	if (!jsonString || jsonString.length > maxSize) {
		return null;
	}

	try {
		const parsed = JSON.parse(jsonString);

		if (
			typeof parsed === 'object' &&
			parsed !== null &&
			('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed)
		) {
			console.error('Potential prototype pollution detected');
			return null;
		}

		return parsed;
	} catch {
		return null;
	}
};

export const detectInjectionPatterns = (input: string): boolean => {
	if (!input) return false;

	const suspiciousPatterns = [
		/<script/i, // XSS
		/javascript:/i, // XSS
		/on\w+\s*=/i, // Event handlers
		/union.*select/i, // SQL injection
		/insert.*into/i, // SQL injection
		/delete.*from/i, // SQL injection
		/update.*set/i, // SQL injection
		/drop.*table/i, // SQL injection
		/exec\s*\(/i, // Command injection
		/eval\s*\(/i, // Code injection
		/__proto__/i, // Prototype pollution
		/\.\.\//, // Path traversal
		/\$\{/, // Template injection
		/<iframe/i, // Iframe injection
		/base64/i, // Potential encoded attack
	];

	return suspiciousPatterns.some((pattern) => pattern.test(input));
};

export const deepSanitizeObject = (obj: any, maxDepth: number = 10): any => {
	if (maxDepth <= 0) {
		console.warn('Max depth reached in deep sanitization');
		return null;
	}

	if (obj === null || obj === undefined) {
		return obj;
	}

	if (typeof obj === 'string') {
		return sanitizeText(obj);
	}

	if (typeof obj === 'number' || typeof obj === 'boolean') {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => deepSanitizeObject(item, maxDepth - 1));
	}

	if (typeof obj === 'object') {
		const sanitized: any = {};

		for (const [key, value] of Object.entries(obj)) {
			// Skip prototype pollution vectors
			if (['__proto__', 'constructor', 'prototype'].includes(key)) {
				continue;
			}

			// Sanitize key
			const cleanKey = sanitizeText(key, 100);

			// Sanitize value recursively
			sanitized[cleanKey] = deepSanitizeObject(value, maxDepth - 1);
		}

		return sanitized;
	}

	return obj;
};

export const inputSanitizer = {
	sanitizeHTML,
	sanitizeText,
	sanitizeTextarea,
	sanitizeForSQL,
	validateEmail,
	validateURL,
	validatePhone,
	validatePassword,
	sanitizeFilename,
	validateFileType,
	validateFileSize,
	validateInteger,
	validateFloat,
	validateJSON,
	detectInjectionPatterns,
	deepSanitizeObject,
	SECURITY_CONFIG,
};

export default inputSanitizer;
