import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getCurrentProfile } from '../../utils/current-user'
import { getDb } from '../../utils/db'
import { profiles } from '../../db/schema'

const bodySchema = z.object({
  locale: z.enum(['fr', 'en']),
})

export default defineEventHandler(async (event) => {
  const current = await getCurrentProfile(event)
  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'No profile found' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join(', '),
    })
  }

  const db = getDb()
  await db.update(profiles).set({
    locale: parsed.data.locale,
    updatedAt: new Date(),
  }).where(eq(profiles.id, current.profileId))

  return { status: 'updated', locale: parsed.data.locale }
})
