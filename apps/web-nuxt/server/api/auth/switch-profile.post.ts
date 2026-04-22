import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireAuthSession, setSessionProfile } from '../../utils/auth-session'
import { getDb } from '../../utils/db'
import { profiles } from '../../db/schema'

const bodySchema = z.object({
  profile_id: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Invalid profile switch payload' })

  const db = getDb()
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(
      eq(profiles.id, parsed.data.profile_id),
      eq(profiles.userId, session.user.userId),
    ))
    .limit(1)

  if (!profile)
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  await setSessionProfile(session.sessionId, profile.id)
  return { status: 'switched', profileId: profile.id }
})
