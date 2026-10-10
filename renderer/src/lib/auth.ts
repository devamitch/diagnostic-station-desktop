import { SignJWT, jwtVerify } from "jose"
import type { NextRequest } from "next/server"

// Use the environment variable for JWT secret
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development_only")

export interface User {
  id: string
  name: string
  email: string
  role: string
  [key: string]: any
}

/**
 * Creates a JWT token
 */
export async function createToken(payload: User, expiresIn = "24h"): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)
}

/**
 * Verifies a JWT token
 */
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as User
  } catch (error) {
    return null
  }
}

/**
 * Checks if the user is authenticated
 */
export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("auth_token")?.value

  if (!token) {
    return false
  }

  const payload = await verifyToken(token)
  return !!payload
}

/**
 * Gets the current user from the request
 */
export async function getCurrentUser(req: NextRequest): Promise<User | null> {
  const token = req.cookies.get("auth_token")?.value

  if (!token) {
    return null
  }

  return verifyToken(token)
}

