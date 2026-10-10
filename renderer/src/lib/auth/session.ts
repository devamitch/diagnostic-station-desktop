"use server"

import { cookies } from "next/headers"
import { decrypt, encrypt } from "./encryption"

// Session types
export interface UserSession {
  id: string
  email: string
  name: string
  role: string
  token: string
  refreshToken?: string
  expiresAt?: number
}

const SESSION_COOKIE_NAME = "maskwa_session"

// Server-side only functions
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  try {
    const decryptedSession = decrypt(sessionCookie.value)
    return JSON.parse(decryptedSession) as UserSession
  } catch (error) {
    console.error("Failed to decrypt session:", error)
    return null
  }
}

export async function setSession(session: UserSession): Promise<void> {
  const encryptedSession = encrypt(JSON.stringify(session))

  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: encryptedSession,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Set expiry based on session if available, otherwise default to 7 days
    maxAge: session.expiresAt ? Math.floor((session.expiresAt - Date.now()) / 1000) : 60 * 60 * 24 * 7,
  })
}

export async function clearSession(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME)
}

export async function refreshSession(refreshToken: string): Promise<UserSession | null> {
  // This would typically call your API to refresh the token
  // For now, we'll just return null to indicate failure
  return null
}

