import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { getActiveSigningKey } from '../../utils/gpg-keyring'
import { getCurrentProfile } from '../../utils/current-user'
import { generateKeyWithSigner } from '../../utils/signer-service'
import { createSignerAccessToken } from '../../utils/signer-jwt'
import { gpgKeys, profiles, users } from '../../db/schema'
import { requireAuthSession, setSessionProfile } from '../../utils/auth-session'

const bodySchema = z.object({
  handle: z.string().trim().min(3).max(80),
  display_name: z.string().trim().min(1).max(120),
  locale: z.enum(['fr', 'en']).optional(),
  bio: z.string().trim().max(2000).optional(),
  avatar_url: z.string().trim().url().optional(),
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
  const current = await getCurrentProfile(event).catch(() => null)
  if (current) {
    const activeKey = await getActiveSigningKey(current.userId)
    if (current.onboardingCompletedAt && activeKey)
      throw createError({ statusCode: 409, statusMessage: 'Onboarding already completed' })

    const signerToken = createSignerAccessToken({
      sub: current.userId,
      profile_id: current.profileId,
      allowed_fingerprint: null,
      scope: ['keys.generate'],
    })
    const key = await generateKeyWithSigner(parsed.data.display_name || current.displayName, parsed.data.handle || current.handle, {
      bearerToken: signerToken,
    })
    await db.update(gpgKeys).set({ isDefault: false, updatedAt: new Date() }).where(eq(gpgKeys.userId, current.userId))
    const [createdKey] = await db.insert(gpgKeys).values({
      userId: current.userId,
      fingerprint: key.fingerprint,
      keyId: key.key_id,
      algorithm: key.algorithm,
      status: 'active',
      isDefault: true,
    }).returning({ id: gpgKeys.id, fingerprint: gpgKeys.fingerprint })

    if (!createdKey)
      throw createError({ statusCode: 500, statusMessage: 'Unable to provision signing key' })

    await db.update(users).set({
      displayName: parsed.data.display_name,
      updatedAt: new Date(),
    }).where(eq(users.id, current.userId))

    await db.update(profiles).set({
      locale: parsed.data.locale ?? current.locale ?? 'fr',
      bio: parsed.data.bio ?? null,
      avatarUrl: parsed.data.avatar_url ?? null,
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

  const signerToken = createSignerAccessToken({
    sub: session.user.userId,
    profile_id: null,
    allowed_fingerprint: null,
    scope: ['keys.generate'],
  })
  const key = await generateKeyWithSigner(parsed.data.display_name, parsed.data.handle, {
    bearerToken: signerToken,
  })
  const result = await db.transaction(async (tx) => {
    await tx.update(users).set({
      displayName: parsed.data.display_name,
      updatedAt: new Date(),
    }).where(eq(users.id, session.user.userId))

    const [createdProfile] = await tx.insert(profiles).values({
      userId: session.user.userId,
      locale: parsed.data.locale ?? 'fr',
      bio: parsed.data.bio ?? null,
      avatarUrl: parsed.data.avatar_url ?? null,
      keyFingerprint: key.fingerprint,
      onboardingCompletedAt: new Date(),
      onboardingVersion: 'v1',
    }).returning({ id: profiles.id })
    if (!createdProfile)
      throw createError({ statusCode: 500, statusMessage: 'Unable to create profile during onboarding' })

    const [createdKey] = await tx.insert(gpgKeys).values({
      userId: session.user.userId,
      fingerprint: key.fingerprint,
      keyId: key.key_id,
      algorithm: key.algorithm,
      status: 'active',
      isDefault: true,
    }).returning({ id: gpgKeys.id, fingerprint: gpgKeys.fingerprint })
    if (!createdKey)
      throw createError({ statusCode: 500, statusMessage: 'Unable to provision onboarding key' })

    return {
      userId: session.user.userId,
      profileId: createdProfile.id,
      keyId: createdKey.id,
      fingerprint: createdKey.fingerprint,
    }
  })

  await setSessionProfile(session.sessionId, result.profileId)
  return { status: 'completed', ...result }
})
