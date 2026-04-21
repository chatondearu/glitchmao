import { eq } from 'drizzle-orm'
import { getDb } from './db'
import { profiles, users } from '../db/schema'

export async function getCurrentProfile() {
  const db = getDb()
  const [row] = await db
    .select({
      userId: users.id,
      profileId: profiles.id,
      handle: users.handle,
      displayName: users.displayName,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      keyFingerprint: profiles.keyFingerprint,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .limit(1)

  return row ?? null
}
