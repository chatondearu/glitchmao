import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getCurrentProfile } from '../utils/current-user'
import { getDb } from '../utils/db'
import { profiles, users } from '../db/schema'

const bodySchema = z.object({
  display_name: z.string().trim().min(1).max(120),
  bio: z.string().trim().max(2000).optional(),
  avatar_url: z.string().trim().url().optional(),
  key_fingerprint: z.string().trim().max(120).optional(),
})

export default defineEventHandler(async (event) => {
  const current = await getCurrentProfile()
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
  await db.transaction(async (tx) => {
    await tx.update(users).set({
      displayName: parsed.data.display_name,
      updatedAt: new Date(),
    }).where(eq(users.id, current.userId))

    await tx.update(profiles).set({
      bio: parsed.data.bio ?? null,
      avatarUrl: parsed.data.avatar_url ?? null,
      keyFingerprint: parsed.data.key_fingerprint ?? null,
      updatedAt: new Date(),
    }).where(eq(profiles.id, current.profileId))
  })

  return { status: 'updated' }
})
