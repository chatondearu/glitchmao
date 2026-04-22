import type { H3Event } from 'h3'
import { and, asc, eq } from 'drizzle-orm'
import { getDb } from './db'
import { profiles } from '../db/schema'
import { requireAuthSession, setSessionProfile } from './auth-session'

export async function getCurrentProfile(event: H3Event) {
  const session = await requireAuthSession(event)
  const db = getDb()
  const [selectedProfile] = await db
    .select({
      profileId: profiles.id,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      keyFingerprint: profiles.keyFingerprint,
      onboardingCompletedAt: profiles.onboardingCompletedAt,
      onboardingVersion: profiles.onboardingVersion,
    })
    .from(profiles)
    .where(session.profile
      ? and(eq(profiles.id, session.profile.profileId), eq(profiles.userId, session.user.userId))
      : eq(profiles.userId, session.user.userId))
    .limit(1)

  if (selectedProfile) {
    return {
      userId: session.user.userId,
      profileId: selectedProfile.profileId,
      handle: session.user.handle,
      displayName: session.user.displayName,
      bio: selectedProfile.bio,
      avatarUrl: selectedProfile.avatarUrl,
      keyFingerprint: selectedProfile.keyFingerprint,
      onboardingCompletedAt: selectedProfile.onboardingCompletedAt,
      onboardingVersion: selectedProfile.onboardingVersion,
    }
  }

  const [fallbackProfile] = await db
    .select({
      profileId: profiles.id,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      keyFingerprint: profiles.keyFingerprint,
      onboardingCompletedAt: profiles.onboardingCompletedAt,
      onboardingVersion: profiles.onboardingVersion,
    })
    .from(profiles)
    .where(eq(profiles.userId, session.user.userId))
    .orderBy(asc(profiles.createdAt))
    .limit(1)

  if (!fallbackProfile)
    return null

  await setSessionProfile(session.sessionId, fallbackProfile.profileId)

  return {
    userId: session.user.userId,
    profileId: fallbackProfile.profileId,
    handle: session.user.handle,
    displayName: session.user.displayName,
    bio: fallbackProfile.bio,
    avatarUrl: fallbackProfile.avatarUrl,
    keyFingerprint: fallbackProfile.keyFingerprint,
    onboardingCompletedAt: fallbackProfile.onboardingCompletedAt,
    onboardingVersion: fallbackProfile.onboardingVersion,
  }
}
