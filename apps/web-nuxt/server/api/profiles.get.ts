import { asc, eq } from 'drizzle-orm'
import { getDb } from '../utils/db'
import { profiles, users } from '../db/schema'

export default defineEventHandler(async () => {
  const db = getDb()
  const items = await db
    .select({
      profileId: profiles.id,
      userId: users.id,
      handle: users.handle,
      displayName: users.displayName,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .orderBy(asc(users.displayName))

  return { items }
})
