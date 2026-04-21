import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { generateDefaultGpgKey, getActiveSigningKey } from '../../utils/gpg-keyring'
import { getCurrentProfile } from '../../utils/current-user'
import { gpgKeys, profiles, users } from '../../db/schema'

const bodySchema = z.object({
  handle: z.string().trim().min(3).max(80),
  display_name: z.string().trim().min(1).max(120),
  bio: z.string().trim().max(2000).optional(),
  avatar_url: z.string().trim().url().optional(),
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
  const current = await getCurrentProfile()
  if (current) {
    const activeKey = await getActiveSigningKey(current.userId)
    if (current.onboardingCompletedAt && activeKey)
      throw createError({ statusCode: 409, statusMessage: 'Onboarding already completed' })

    const key = await generateDefaultGpgKey(parsed.data.display_name || current.displayName, parsed.data.handle || current.handle)
    await db.update(gpgKeys).set({ isDefault: false, updatedAt: new Date() }).where(eq(gpgKeys.userId, current.userId))
    const [createdKey] = await db.insert(gpgKeys).values({
      userId: current.userId,
      fingerprint: key.fingerprint,
      keyId: key.keyId,
      algorithm: key.algorithm,
      status: 'active',
      isDefault: true,
    }).returning({ id: gpgKeys.id, fingerprint: gpgKeys.fingerprint })

    await db.update(profiles).set({
      keyFingerprint: createdKey.fingerprint,
      onboardingCompletedAt: new Date(),
      onboardingVersion: 'v1',
      updatedAt: new Date(),
    }).where(eq(profiles.id, current.profileId))

    return {
      userId: current.userId,
      profileId: current.profileId,
      keyId: createdKey.id,
      fingerprint: createdKey.fingerprint,
    }
  }

  const key = await generateDefaultGpgKey(parsed.data.display_name, parsed.data.handle)
  const result = await db.transaction(async (tx) => {
    const [createdUser] = await tx.insert(users).values({
      handle: parsed.data.handle,
      displayName: parsed.data.display_name,
    }).returning({ id: users.id, handle: users.handle, displayName: users.displayName })

    const [createdProfile] = await tx.insert(profiles).values({
      userId: createdUser.id,
      bio: parsed.data.bio ?? null,
      avatarUrl: parsed.data.avatar_url ?? null,
      keyFingerprint: key.fingerprint,
      onboardingCompletedAt: new Date(),
      onboardingVersion: 'v1',
    }).returning({ id: profiles.id })

    const [createdKey] = await tx.insert(gpgKeys).values({
      userId: createdUser.id,
      fingerprint: key.fingerprint,
      keyId: key.keyId,
      algorithm: key.algorithm,
      status: 'active',
      isDefault: true,
    }).returning({ id: gpgKeys.id, fingerprint: gpgKeys.fingerprint })

    return {
      userId: createdUser.id,
      profileId: createdProfile.id,
      keyId: createdKey.id,
      fingerprint: createdKey.fingerprint,
    }
  })

  return { status: 'completed', ...result }
})
