import { z } from 'zod'
import { getDb } from '../utils/db'
import { profiles, users } from '../db/schema'

const bodySchema = z.object({
  handle: z.string().trim().min(3).max(80),
  display_name: z.string().trim().min(1).max(120),
  bio: z.string().trim().max(2000).optional(),
  avatar_url: z.string().trim().url().optional(),
  key_fingerprint: z.string().trim().max(120).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join(', '),
    })
  }

  const db = getDb()
  const result = await db.transaction(async (tx) => {
    const [createdUser] = await tx.insert(users).values({
      handle: parsed.data.handle,
      displayName: parsed.data.display_name,
    }).returning({ id: users.id, handle: users.handle, displayName: users.displayName })

    const [createdProfile] = await tx.insert(profiles).values({
      userId: createdUser.id,
      bio: parsed.data.bio ?? null,
      avatarUrl: parsed.data.avatar_url ?? null,
      keyFingerprint: parsed.data.key_fingerprint ?? null,
    }).returning({ id: profiles.id, bio: profiles.bio, avatarUrl: profiles.avatarUrl, keyFingerprint: profiles.keyFingerprint })

    return {
      userId: createdUser.id,
      profileId: createdProfile.id,
      handle: createdUser.handle,
      displayName: createdUser.displayName,
      bio: createdProfile.bio,
      avatarUrl: createdProfile.avatarUrl,
      keyFingerprint: createdProfile.keyFingerprint,
    }
  })

  return { profile: result }
})
