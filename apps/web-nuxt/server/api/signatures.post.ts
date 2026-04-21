import { z } from 'zod'
import { getDb } from '../utils/db'
import { getCurrentProfile } from '../utils/current-user'
import { getActiveSigningKey } from '../utils/gpg-keyring'
import { resolveStorageProvider } from '../utils/storage'
import { signGpgHash } from '../utils/verify'
import { signatures } from '../db/schema'

const bodySchema = z.object({
  content_hash: z.string().trim().length(64),
  creator_id: z.string().trim().min(1).optional(),
  profile_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  source_type: z.enum(['image', 'pdf', 'text', 'markdown', 'plain_text']).default('plain_text'),
  content_mime_type: z.string().trim().min(1).max(120).optional(),
  verification_url: z.string().trim().url(),
  status: z.enum(['AUTHENTIQUE', 'CORROMPU/INCONNU']).default('AUTHENTIQUE'),
  storage_provider: z.enum(['none', 's3', 'custom']).default('none'),
  storage_object_url: z.string().trim().url().optional(),
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
  const currentProfile = await getCurrentProfile()
  if (!currentProfile) {
    throw createError({ statusCode: 403, statusMessage: 'Onboarding is required before signing' })
  }

  const activeSigningKey = await getActiveSigningKey(currentProfile.userId)
  if (!activeSigningKey) {
    throw createError({ statusCode: 403, statusMessage: 'No active default GPG key available' })
  }

  const runtimeStorageProvider = resolveStorageProvider()
  const config = useRuntimeConfig()

  const signingIdentity = activeSigningKey.fingerprint || activeSigningKey.keyId || config.gpgKeyId
  if (!signingIdentity) {
    throw createError({ statusCode: 500, statusMessage: 'No signing identity configured' })
  }

  const generatedSignature = await signGpgHash(parsed.data.content_hash, signingIdentity)
  const [created] = await db.insert(signatures).values({
    contentHash: parsed.data.content_hash,
    signature: generatedSignature,
    creatorId: parsed.data.creator_id ?? currentProfile?.handle ?? 'anonymous',
    userId: parsed.data.user_id ?? currentProfile?.userId ?? null,
    profileId: parsed.data.profile_id ?? currentProfile?.profileId ?? null,
    sourceType: parsed.data.source_type,
    contentMimeType: parsed.data.content_mime_type ?? null,
    verificationUrl: parsed.data.verification_url,
    status: parsed.data.status,
    storageProvider: parsed.data.storage_provider ?? runtimeStorageProvider,
    storageObjectUrl: parsed.data.storage_object_url ?? null,
    signingKeyId: activeSigningKey.id,
    signingKeyFingerprint: activeSigningKey.fingerprint,
  }).returning({ id: signatures.id })

  return {
    id: created?.id,
    status: 'stored',
  }
})
