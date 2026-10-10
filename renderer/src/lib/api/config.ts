
import { BASEURL } from '@/constants/env';
import { z } from 'zod';

// Request validation schema with stronger typing
export const requestSchema = z.object({
  url: z.string(),
  method: z.enum(['get', 'post', 'put', 'delete', 'patch', 'head', 'options']).optional(),
   params: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()])
  ).optional(),
  data: z.unknown().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  timeout: z.number().optional(),
  withCredentials: z.boolean().optional(),
  responseType: z.enum(['arraybuffer', 'blob', 'document', 'json', 'text', 'stream']).optional(),
});


// Response validation schema creator
export const createResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		success: z.boolean(),
		message: z.string().optional(),
		data: dataSchema,
		meta: z.record(z.string(), z.string()).optional(),
	});

// Common configuration for all API clients
export const apiConfig = {
	baseURL: BASEURL,
	defaultHeaders: {
		Accept: 'application/json',
		'Content-Type': 'application/json',
	},
	timeout: 30000, // 30 seconds default timeout
	retryConfig: {
		maxRetries: 3,
		retryDelay: (count: number) => Math.min(1000 * 2 ** count, 10000), // Exponential backoff
		retryCondition: (status: number | undefined) => !status || status >= 500,
	},
};

// Environment detection
export const isServer = typeof window === 'undefined';
export const isClient = !isServer;

// Error types
export const ErrorTypes = {
	NETWORK: 'network_error',
	SERVER: 'server_error',
	UNAUTHORIZED: 'unauthorized',
	FORBIDDEN: 'forbidden',
	NOT_FOUND: 'not_found',
	VALIDATION: 'validation_error',
	TIMEOUT: 'timeout',
	UNKNOWN: 'unknown_error',
} as const;

export type ErrorType = (typeof ErrorTypes)[keyof typeof ErrorTypes];

// API error structure
export interface ApiErrorDetails {
	type: ErrorType;
	status?: number;
	message: string;
	errors?: Record<string, string[]>;
	originalError?: unknown;
}

