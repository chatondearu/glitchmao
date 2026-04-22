import { asc, eq } from 'drizzle-orm'
import { getAuthSession } from '../../utils/auth-session'
import { getDb } from '../../utils/db'
import { authCredentials, profiles, users } from '../../db/schema'
import { getActiveProfilePermissions } from '../../utils/permissions'

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event)
  if (!session)
    return { authenticated: false }

  const db = getDb()
  const [authState] = await db.select({
    hasPassword: authCredentials.userId,
    email: users.email,
  })
    .from(users)
    .leftJoin(authCredentials, eq(authCredentials.userId, users.id))
    .where(eq(users.id, session.user.userId))
    .limit(1)

  const items = await db.select({
    profileId: profiles.id,
    bio: profiles.bio,
    avatarUrl: profiles.avatarUrl,
    keyFingerprint: profiles.keyFingerprint,
    onboardingCompletedAt: profiles.onboardingCompletedAt,
  }).from(profiles).where(eq(profiles.userId, session.user.userId)).orderBy(asc(profiles.createdAt))

  const permissions = await getActiveProfilePermissions(event)

  return {
    authenticated: true,
    user: session.user,
    activeProfileId: session.profile?.profileId ?? null,
    email: authState?.email ?? null,
    hasPassword: Boolean(authState?.hasPassword),
    permissions,
    profiles: items,
  }
})
