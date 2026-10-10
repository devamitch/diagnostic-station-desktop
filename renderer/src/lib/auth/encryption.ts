// "use server"

import CryptoJS from 'crypto-js';

// Encryption key from environment variable
const key = 'default-fallback-key-for-development-only';

// Encrypt data
export function encrypt(data: string): string {
	return CryptoJS.AES.encrypt(data, key).toString();
}

// Decrypt data
export function decrypt(encryptedData: string): string {
	const bytes = CryptoJS.AES.decrypt(encryptedData, key);
	return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Hashes a password with a salt
 */
export async function hashPassword(password: string): Promise<string> {
	try {
		// Generate a random salt
		const salt = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);

		// Hash the password with PBKDF2
		const iterations = 10000;
		const keySize = 64;
		const hash = CryptoJS.PBKDF2(password, salt, {
			keySize: keySize / 4, // keySize is in words (4 bytes)
			iterations: iterations,
			hasher: CryptoJS.algo.SHA512,
		}).toString(CryptoJS.enc.Hex);

		// Format: iterations:salt:hash
		return `${iterations}:${salt}:${hash}`;
	} catch (error) {
		console.error('Password hashing error:', error);
		throw new Error('Failed to hash password');
	}
}

/**
 * Verifies a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	try {
		const [iterations, salt, key] = hash.split(':');
		const iterCount = Number.parseInt(iterations, 10);

		// Hash the password with the same parameters
		const computedHash = CryptoJS.PBKDF2(password, salt, {
			keySize: key.length / 8, // Convert hex length to bytes, then to words
			iterations: iterCount,
			hasher: CryptoJS.algo.SHA512,
		}).toString(CryptoJS.enc.Hex);

		// Compare the hashes
		return computedHash === key;
	} catch (error) {
		console.error('Password verification error:', error);
		throw new Error('Failed to verify password');
	}
}

/**
 * Generates a secure random token
 */
export function generateToken(length = 32): string {
	return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex);
}
