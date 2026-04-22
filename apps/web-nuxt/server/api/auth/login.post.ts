import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { authCredentials, profiles, users } from '../../db/schema'
import { verifyPassword } from '../../utils/password'
import { createAuthSession } from '../../utils/auth-session'

const bodySchema = z.object({
  handle: z.string().trim().min(3).max(80),
  password: z.string().min(8).max(128),
  profile_id: z.string().uuid().optional(),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Invalid login payload' })

  const db = getDb()
  const [authRow] = await db
    .select({
      userId: users.id,
      handle: users.handle,
      displayName: users.displayName,
      passwordHash: authCredentials.passwordHash,
      passwordSalt: authCredentials.passwordSalt,
    })
    .from(users)
    .innerJoin(authCredentials, eq(authCredentials.userId, users.id))
    .where(eq(users.handle, parsed.data.handle))
    .limit(1)

  if (!authRow || !verifyPassword(parsed.data.password, authRow.passwordSalt, authRow.passwordHash))
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  let sessionProfileId: string | null = null
  if (parsed.data.profile_id) {
    const [profile] = await db.select({ id: profiles.id }).from(profiles).where(and(
      eq(profiles.id, parsed.data.profile_id),
      eq(profiles.userId, authRow.userId),
    )).limit(1)
    if (!profile)
      throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
    sessionProfileId = profile.id
  }
  else {
    const [profile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, authRow.userId)).orderBy(asc(profiles.createdAt)).limit(1)
    sessionProfileId = profile?.id ?? null
  }

  await createAuthSession(event, authRow.userId, sessionProfileId)

  return {
    user: {
      userId: authRow.userId,
      handle: authRow.handle,
      displayName: authRow.displayName,
    },
    activeProfileId: sessionProfileId,
  }
})
