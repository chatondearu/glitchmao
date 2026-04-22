import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../utils/db'
import { profiles, users } from '../db/schema'
import { requireAuthSession, setSessionProfile } from '../utils/auth-session'

const bodySchema = z.object({
  display_name: z.string().trim().min(1).max(120).optional(),
  locale: z.enum(['fr', 'en']).optional(),
  bio: z.string().trim().max(2000).optional(),
  avatar_url: z.string().trim().url().optional(),
  key_fingerprint: z.string().trim().max(120).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event)
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
    if (parsed.data.display_name) {
      await tx.update(users).set({
        displayName: parsed.data.display_name,
        updatedAt: new Date(),
      }).where(eq(users.id, session.user.userId))
    }

    const [createdProfile] = await tx.insert(profiles).values({
      userId: session.user.userId,
      locale: parsed.data.locale ?? 'fr',
      bio: parsed.data.bio ?? null,
      avatarUrl: parsed.data.avatar_url ?? null,
      keyFingerprint: parsed.data.key_fingerprint ?? null,
    }).returning({ id: profiles.id, locale: profiles.locale, bio: profiles.bio, avatarUrl: profiles.avatarUrl, keyFingerprint: profiles.keyFingerprint })

    const [currentUser] = await tx.select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
    }).from(users).where(eq(users.id, session.user.userId)).limit(1)

    return {
      userId: currentUser.id,
      profileId: createdProfile.id,
      handle: currentUser.handle,
      displayName: currentUser.displayName,
      locale: createdProfile.locale,
      bio: createdProfile.bio,
      avatarUrl: createdProfile.avatarUrl,
      keyFingerprint: createdProfile.keyFingerprint,
    }
  })

  await setSessionProfile(session.sessionId, result.profileId)
  return { profile: result }
})
