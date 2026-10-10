import { BASEURL } from '@/constants/env';
import { TOKELESS_URLS } from '@/constants/urls';
import {
	deepSanitizeObject,
	detectInjectionPatterns,
	sanitizeText,
} from '@/lib/utils/inputSanitizer';
import axios, {
	AxiosError,
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
	CancelTokenSource,
} from 'axios';
import { isEmpty } from 'ramda';
import { toast } from 'sonner';
import { z } from 'zod';
import { getHeaders } from './headers';

// ==================== TYPES ====================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		success: z.boolean(),
		message: z.string(),
		data: dataSchema,
	});

export type ApiResponse<T> = {
	success: boolean;
	message: string;
	data: T;
};

// ==================== CONFIGURATION ====================

const API_CONFIG = {
	timeout: 30000, // 30 seconds
	maxRetries: 3,
	retryDelay: 1000,
	maxRequestSize: 10 * 1024 * 1024, // 10MB
	rateLimitWindow: 60000, // 1 minute
	maxRequestsPerWindow: 100,
} as const;

// ==================== REQUEST MANAGER ====================

const createRequestManager = () => {
	const cancelSources = new Map<string, CancelTokenSource>();

	return {
		createCancelToken: (requestId: string): CancelTokenSource => {
			// Cancel existing request with same ID
			const existing = cancelSources.get(requestId);
			if (existing) {
				existing.cancel('Request canceled by new request');
				cancelSources.delete(requestId);
			}

			// Create new cancel token
			const source = axios.CancelToken.source();
			cancelSources.set(requestId, source);
			return source;
		},

		cancelRequest: (requestId: string): void => {
			const source = cancelSources.get(requestId);
			if (source) {
				source.cancel('Request canceled by user');
				cancelSources.delete(requestId);
			}
		},

		cancelAll: (): void => {
			cancelSources.forEach((source) => {
				source.cancel('All requests canceled');
			});
			cancelSources.clear();
		},

		cleanup: (): void => {
			cancelSources.clear();
		},
	};
};

// ==================== RATE LIMITER ====================

const createRateLimiter = () => {
	const requests = new Map<string, number[]>();

	return {
		checkLimit: (key: string): boolean => {
			const now = Date.now();
			const timestamps = requests.get(key) || [];

			// Remove old timestamps outside the window
			const validTimestamps = timestamps.filter(
				(ts) => now - ts < API_CONFIG.rateLimitWindow
			);

			if (validTimestamps.length >= API_CONFIG.maxRequestsPerWindow) {
				const oldestRequest = validTimestamps[0];
				const waitTime = API_CONFIG.rateLimitWindow - (now - oldestRequest);
				toast.error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)}s`);
				return false;
			}

			validTimestamps.push(now);
			requests.set(key, validTimestamps);
			return true;
		},

		reset: (key: string): void => {
			requests.delete(key);
		},

		cleanup: (): void => {
			requests.clear();
		},
	};
};

// ==================== SECURITY LOGGER ====================

const createSecurityLogger = () => {
	const logSecurityEvent = (event: {
		type: string;
		severity: 'low' | 'medium' | 'high' | 'critical';
		details: any;
	}) => {
		const logEntry = {
			...event,
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			url: window.location.href,
		};

		// In production, send to your logging service
		if (process.env.NODE_ENV === 'production') {
			console.warn('[SECURITY EVENT]', logEntry);
			// Send to monitoring service (CloudWatch, Datadog, etc.)
		} else {
			console.warn('[SECURITY EVENT]', logEntry);
		}
	};

	return {
		logInjectionAttempt: (url: string, data: any) => {
			logSecurityEvent({
				type: 'INJECTION_ATTEMPT',
				severity: 'high',
				details: { url, data },
			});
		},

		logAuthFailure: (url: string, error: any) => {
			logSecurityEvent({
				type: 'AUTH_FAILURE',
				severity: 'medium',
				details: { url, error },
			});
		},

		logSuspiciousActivity: (url: string, reason: string) => {
			logSecurityEvent({
				type: 'SUSPICIOUS_ACTIVITY',
				severity: 'high',
				details: { url, reason },
			});
		},

		logRateLimitExceeded: (url: string) => {
			logSecurityEvent({
				type: 'RATE_LIMIT_EXCEEDED',
				severity: 'medium',
				details: { url },
			});
		},
	};
};

// ==================== ERROR HANDLER ====================

const handleApiError = (error: unknown): never => {
	if (axios.isCancel(error)) {
		throw error;
	}

	if (error instanceof AxiosError) {
		const statusCode = error.response?.status || 500;
		const errorMessage =
			error.response?.data?.message || error.message || 'An unexpected error occurred';
		const requestUrl = error.config?.url || '';

		// Log security-relevant errors
		if (statusCode === 401 || statusCode === 403) {
			securityLogger.logAuthFailure(requestUrl, errorMessage);
		}

		// User-friendly error messages
		switch (statusCode) {
			case 400:
				toast.error('Invalid request. Please check your input.');
				break;
			case 401:
				toast.error('Your session has expired. Please log in again.');
				// Handle logout in your auth store
				break;
			case 403:
				toast.error('You do not have permission to perform this action');
				break;
			case 404:
				toast.error('The requested resource was not found');
				break;
			case 422:
				toast.error('Validation error. Please check your input.');
				break;
			case 429:
				toast.error('Too many requests. Please slow down.');
				break;
			case 500:
			case 502:
			case 503:
				toast.error('Server error. Please try again later.');
				break;
			default:
				toast.error(errorMessage);
		}
	} else {
		toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
	}

	throw error;
};

// ==================== VALIDATORS ====================

const validateRequestData = (data: any): boolean => {
	if (!data) return true;

	// Check data size
	const dataSize = new Blob([JSON.stringify(data)]).size;
	if (dataSize > API_CONFIG.maxRequestSize) {
		toast.error('Request data too large');
		return false;
	}

	// Check for injection patterns in string values
	const checkValue = (value: any): boolean => {
		if (typeof value === 'string') {
			if (detectInjectionPatterns(value)) {
				securityLogger.logInjectionAttempt('request-data', value);
				toast.error('Invalid characters detected in request');
				return false;
			}
		} else if (typeof value === 'object' && value !== null) {
			return Object.values(value).every(checkValue);
		}
		return true;
	};

	return checkValue(data);
};

const validateUrl = (url: string): boolean => {
	// Check for path traversal
	if (url.includes('../') || url.includes('..\\')) {
		securityLogger.logSuspiciousActivity(url, 'Path traversal attempt');
		return false;
	}

	// Check for null bytes
	if (url.includes('\0')) {
		securityLogger.logSuspiciousActivity(url, 'Null byte in URL');
		return false;
	}

	return true;
};

// ==================== MAIN API CLIENT ====================

// Initialize singletons
const requestManager = createRequestManager();
const rateLimiter = createRateLimiter();
const securityLogger = createSecurityLogger();

const createApiClient = () => {
	const client: AxiosInstance = axios.create({
		baseURL: BASEURL,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-Requested-With': 'XMLHttpRequest', // CSRF protection
		},
		timeout: API_CONFIG.timeout,
	});

	// ==================== INTERCEPTORS ====================

	// Request interceptor
	client.interceptors.request.use(
		async (config) => {
			const url = config.url || '';

			// Validate URL
			if (!validateUrl(url)) {
				throw new Error('Invalid URL detected');
			}

			// Rate limiting
			const rateLimitKey = `${config.method}-${url}`;
			if (!rateLimiter.checkLimit(rateLimitKey)) {
				securityLogger.logRateLimitExceeded(url);
				throw new Error('Rate limit exceeded');
			}

			// Add auth headers for protected routes
			if (!Object.values(TOKELESS_URLS).includes(url as any)) {
				const headers = getHeaders();
				if (isEmpty(headers)) {
					throw new Error('Token is missing for protected route.');
				}

				config.headers = {
					...config.headers,
					...headers,
				};
			}

			// Add request ID for tracking
			config.headers['X-Request-ID'] =
				`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

			// Handle FormData
			if (config.data instanceof FormData) {
				delete config.headers['Content-Type']; // Let browser set it
			} else if (config.data && typeof config.data === 'object') {
				// Validate and sanitize request data
				if (!validateRequestData(config.data)) {
					throw new Error('Invalid request data');
				}

				// Deep sanitize request data (defense in depth)
				config.data = deepSanitizeObject(config.data);
			}

			return config;
		},
		(error) => Promise.reject(handleApiError(error))
	);

	// Response interceptor
	client.interceptors.response.use(
		(response: AxiosResponse) => {
			// Validate response structure
			if (response.data && typeof response.data === 'object') {
				// Sanitize response data (defense in depth)
				response.data = deepSanitizeObject(response.data);
			}

			return response;
		},
		async (error: AxiosError) => {
			// Handle token refresh logic here if needed
			if (error.response?.status === 401) {
				// Attempt token refresh
				// const refreshToken = getRefreshToken();
				// if (refreshToken) {
				//   try {
				//     await refreshAccessToken();
				//     return client.request(error.config!);
				//   } catch (refreshError) {
				//     // Logout user
				//   }
				// }
			}

			return Promise.reject(handleApiError(error));
		}
	);

	// ==================== REQUEST METHODS ====================

	const request = async <T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
		try {
			const requestId = `${config.method || 'get'}-${config.url}-${Date.now()}`;
			const source = requestManager.createCancelToken(requestId);

			const response = await client.request<T>({
				...config,
				cancelToken: source.token,
			});

			return response;
		} catch (error) {
			throw handleApiError(error);
		}
	};

	return {
		// Generic request
		request,

		// GET request
		get: async <T = any>(url: string, config?: Omit<AxiosRequestConfig, 'url' | 'method'>) => {
			return request<T>({ ...config, url, method: 'GET' });
		},

		// POST request
		post: async <T = any, D = any>(
			url: string,
			data?: D,
			config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>
		) => {
			return request<T>({ ...config, url, method: 'POST', data });
		},

		// PUT request
		put: async <T = any, D = any>(
			url: string,
			data?: D,
			config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>
		) => {
			return request<T>({ ...config, url, method: 'PUT', data });
		},

		// PATCH request
		patch: async <T = any, D = any>(
			url: string,
			data?: D,
			config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>
		) => {
			return request<T>({ ...config, url, method: 'PATCH', data });
		},

		// DELETE request
		delete: async <T = any>(
			url: string,
			config?: Omit<AxiosRequestConfig, 'url' | 'method'>
		) => {
			return request<T>({ ...config, url, method: 'DELETE' });
		},

		// File upload with validation
		uploadFile: async <T = any>(
			url: string,
			file: File,
			options?: {
				onProgress?: (percentage: number) => void;
				additionalData?: Record<string, any>;
				maxSize?: number;
				allowedTypes?: string[];
			}
		) => {
			// Validate file size
			const maxSize = options?.maxSize || 10 * 1024 * 1024; // 10MB default
			if (file.size > maxSize) {
				toast.error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
				throw new Error('File too large');
			}

			// Validate file type
			const allowedTypes = options?.allowedTypes || [
				'image/jpeg',
				'image/png',
				'image/gif',
				'image/webp',
				'application/pdf',
			];

			if (!allowedTypes.includes(file.type)) {
				toast.error('File type not allowed');
				throw new Error('Invalid file type');
			}

			// Sanitize filename
			const sanitizedFilename = sanitizeText(file.name, 255);

			const formData = new FormData();
			formData.append('file', file, sanitizedFilename);

			// Add additional data with sanitization
			if (options?.additionalData) {
				Object.entries(options.additionalData).forEach(([key, value]) => {
					const sanitizedKey = sanitizeText(key, 100);
					const sanitizedValue = typeof value === 'string' ? sanitizeText(value) : value;
					formData.append(sanitizedKey, sanitizedValue);
				});
			}

			return request<T>({
				url,
				method: 'POST',
				data: formData,
				headers: {
					'Content-Type': 'multipart/form-data',
				},
				onUploadProgress: options?.onProgress
					? (progressEvent) => {
							const percentCompleted = Math.round(
								(progressEvent.loaded * 100) / (progressEvent.total || 1)
							);
							options.onProgress?.(percentCompleted);
						}
					: undefined,
			});
		},

		// Multiple files upload
		uploadMultipleFiles: async <T = any>(
			url: string,
			files: File[],
			options?: {
				onProgress?: (percentage: number) => void;
				additionalData?: Record<string, any>;
				fieldName?: string;
				maxSize?: number;
				allowedTypes?: string[];
			}
		) => {
			const maxSize = options?.maxSize || 10 * 1024 * 1024;
			const allowedTypes = options?.allowedTypes || [
				'image/jpeg',
				'image/png',
				'image/gif',
				'image/webp',
				'application/pdf',
			];

			// Validate all files
			for (const file of files) {
				if (file.size > maxSize) {
					toast.error(`File ${file.name} exceeds size limit`);
					throw new Error('File too large');
				}

				if (!allowedTypes.includes(file.type)) {
					toast.error(`File ${file.name} has invalid type`);
					throw new Error('Invalid file type');
				}
			}

			const formData = new FormData();
			const fieldName = options?.fieldName || 'files';

			files.forEach((file) => {
				const sanitizedFilename = sanitizeText(file.name, 255);
				formData.append(fieldName, file, sanitizedFilename);
			});

			if (options?.additionalData) {
				Object.entries(options.additionalData).forEach(([key, value]) => {
					const sanitizedKey = sanitizeText(key, 100);
					const sanitizedValue = typeof value === 'string' ? sanitizeText(value) : value;
					formData.append(sanitizedKey, sanitizedValue);
				});
			}

			return request<T>({
				url,
				method: 'POST',
				data: formData,
				headers: {
					'Content-Type': 'multipart/form-data',
				},
				onUploadProgress: options?.onProgress
					? (progressEvent) => {
							const percentCompleted = Math.round(
								(progressEvent.loaded * 100) / (progressEvent.total || 1)
							);
							options.onProgress?.(percentCompleted);
						}
					: undefined,
			});
		},

		// Cancel specific request
		cancelRequest: (requestId: string) => {
			requestManager.cancelRequest(requestId);
		},

		// Cancel all requests
		cancelAll: () => {
			requestManager.cancelAll();
		},

		// Cleanup resources
		cleanup: () => {
			requestManager.cleanup();
			rateLimiter.cleanup();
		},
	};
};

// ==================== EXPORT ====================

const api = createApiClient();

export default api;
export const isAxiosError = axios.isAxiosError;
export { securityLogger };
