import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { createError, deleteCookie, getCookie, setCookie } from 'h3'
import { authSessions, profiles, users } from '../db/schema'
import { getDb } from './db'

export const AUTH_SESSION_COOKIE = 'gm_session'
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function buildSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  }
}

export interface AuthSessionUser {
  userId: string
  handle: string
  displayName: string
}

export interface AuthSessionProfile {
  profileId: string
  bio: string | null
  avatarUrl: string | null
  keyFingerprint: string | null
  onboardingCompletedAt: Date | null
  onboardingVersion: string
}

export interface AuthSessionContext {
  sessionId: string
  user: AuthSessionUser
  profile: AuthSessionProfile | null
}

export async function createAuthSession(event: H3Event, userId: string, profileId?: string | null) {
  const db = getDb()
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  const [inserted] = await db.insert(authSessions).values({
    userId,
    profileId: profileId ?? null,
    tokenHash: hashToken(token),
    expiresAt,
  }).returning({ id: authSessions.id })

  setCookie(event, AUTH_SESSION_COOKIE, token, buildSessionCookieOptions(expiresAt))

  return {
    id: inserted.id,
    expiresAt,
  }
}

export async function clearAuthSession(event: H3Event) {
  const token = getCookie(event, AUTH_SESSION_COOKIE)
  if (!token) {
    deleteCookie(event, AUTH_SESSION_COOKIE, { path: '/' })
    return
  }

  const db = getDb()
  await db.delete(authSessions).where(eq(authSessions.tokenHash, hashToken(token)))
  deleteCookie(event, AUTH_SESSION_COOKIE, { path: '/' })
}

export async function requireAuthSession(event: H3Event): Promise<AuthSessionContext> {
  const session = await getAuthSession(event)
  if (!session)
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  return session
}

export async function getAuthSession(event: H3Event): Promise<AuthSessionContext | null> {
  const token = getCookie(event, AUTH_SESSION_COOKIE)
  if (!token)
    return null

  const db = getDb()
  const [row] = await db
    .select({
      sessionId: authSessions.id,
      userId: users.id,
      handle: users.handle,
      displayName: users.displayName,
      profileId: profiles.id,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      keyFingerprint: profiles.keyFingerprint,
      onboardingCompletedAt: profiles.onboardingCompletedAt,
      onboardingVersion: profiles.onboardingVersion,
      expiresAt: authSessions.expiresAt,
    })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .leftJoin(profiles, and(
      eq(profiles.id, authSessions.profileId),
      eq(profiles.userId, users.id),
    ))
    .where(and(
      eq(authSessions.tokenHash, hashToken(token)),
      gt(authSessions.expiresAt, new Date()),
    ))
    .limit(1)

  if (!row) {
    deleteCookie(event, AUTH_SESSION_COOKIE, { path: '/' })
    return null
  }

  return {
    sessionId: row.sessionId,
    user: {
      userId: row.userId,
      handle: row.handle,
      displayName: row.displayName,
    },
    profile: row.profileId
      ? {
          profileId: row.profileId,
          bio: row.bio,
          avatarUrl: row.avatarUrl,
          keyFingerprint: row.keyFingerprint,
          onboardingCompletedAt: row.onboardingCompletedAt,
          onboardingVersion: row.onboardingVersion,
        }
      : null,
  }
}

export async function setSessionProfile(sessionId: string, profileId: string | null) {
  const db = getDb()
  await db.update(authSessions).set({
    profileId,
    updatedAt: new Date(),
  }).where(eq(authSessions.id, sessionId))
}
