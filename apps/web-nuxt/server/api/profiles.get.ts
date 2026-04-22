import { asc, eq } from 'drizzle-orm'
import { getDb } from '../utils/db'
import { requireAuthSession } from '../utils/auth-session'
import { profiles, users } from '../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event)
  const db = getDb()
  const items = await db
    .select({
      profileId: profiles.id,
      userId: users.id,
      locale: profiles.locale,
      handle: users.handle,
      displayName: users.displayName,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.userId, session.user.userId))
    .orderBy(asc(users.displayName))

  return { items }
})
