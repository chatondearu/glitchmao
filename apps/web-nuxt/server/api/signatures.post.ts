import { z } from 'zod'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '../utils/db'
import { requireWritePermission } from '../utils/permissions'
import { resolveStorageProvider } from '../utils/storage'
import { signHashWithSigner } from '../utils/signer-service'
import { resolveActiveSigningContext } from '../utils/signing-context'
import { createSignerAccessToken } from '../utils/signer-jwt'
import { signatures } from '../db/schema'

const bodySchema = z.object({
  content_hash: z.string().trim().length(64),
  creator_id: z.string().trim().min(1).optional(),
  source_type: z.enum(['image', 'pdf', 'text', 'markdown', 'plain_text']).default('plain_text'),
  content_mime_type: z.string().trim().min(1).max(120).optional(),
  verification_url: z.string().trim().url().optional(),
  status: z.enum(['AUTHENTIQUE', 'CORROMPU/INCONNU']).default('AUTHENTIQUE'),
  storage_provider: z.enum(['none', 's3', 'custom']).default('none'),
  storage_object_url: z.string().trim().url().optional(),
})

function buildPublicId(contentHash: string, timestampMs: number) {
  return `${timestampMs}${contentHash.slice(-4)}`
}

export default defineEventHandler(async (event) => {
  await requireWritePermission(event)
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(issue => issue.message).join(', '),
    })
  }

  const db = getDb()
  const signingContext = await resolveActiveSigningContext(event)

  try {
    const [existing] = await db
      .select({
        id: signatures.id,
        publicId: signatures.publicId,
        verificationUrl: signatures.verificationUrl,
      })
      .from(signatures)
      .where(eq(signatures.contentHash, parsed.data.content_hash))
      .orderBy(desc(signatures.createdAt))
      .limit(1)

    if (existing) {
      return {
        id: existing.publicId,
        internal_id: existing.id,
        status: 'already_exists',
        verification_url: existing.verificationUrl,
      }
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('public_id'))
      throw error

    const [legacyExisting] = await db
      .select({
        id: signatures.id,
        verificationUrl: signatures.verificationUrl,
      })
      .from(signatures)
      .where(eq(signatures.contentHash, parsed.data.content_hash))
      .orderBy(desc(signatures.createdAt))
      .limit(1)

    if (legacyExisting) {
      return {
        id: legacyExisting.id,
        internal_id: legacyExisting.id,
        status: 'already_exists',
        verification_url: legacyExisting.verificationUrl,
      }
    }
  }

  const runtimeStorageProvider = resolveStorageProvider()
  const signerToken = createSignerAccessToken({
    sub: signingContext.userId,
    profile_id: signingContext.profileId,
    allowed_fingerprint: signingContext.fingerprint,
    scope: ['sign'],
  })

  const generatedSignature = await signHashWithSigner(parsed.data.content_hash, signingContext.fingerprint, {
    bearerToken: signerToken,
  })
  const timestampMs = Date.now()
  const baseValues = {
    publicId: buildPublicId(parsed.data.content_hash, timestampMs),
    contentHash: parsed.data.content_hash,
    signature: generatedSignature,
    creatorId: parsed.data.creator_id ?? signingContext.handle ?? 'anonymous',
    userId: signingContext.userId,
    profileId: signingContext.profileId,
    sourceType: parsed.data.source_type,
    contentMimeType: parsed.data.content_mime_type ?? null,
    verificationUrl: parsed.data.verification_url ?? 'pending',
    status: parsed.data.status,
    storageProvider: parsed.data.storage_provider ?? runtimeStorageProvider,
    storageObjectUrl: parsed.data.storage_object_url ?? null,
    signingKeyId: signingContext.signingKeyId,
    signingKeyFingerprint: signingContext.fingerprint,
  }

  let created: { id: string, publicId: string } | undefined
  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidatePublicId = buildPublicId(parsed.data.content_hash, timestampMs + attempt)
      const [inserted] = await db.insert(signatures).values({
        ...baseValues,
        publicId: candidatePublicId,
      }).onConflictDoNothing().returning({ id: signatures.id, publicId: signatures.publicId })

      if (inserted) {
        created = inserted
        break
      }
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('public_id'))
      throw error

    const [legacyInserted] = await db.insert(signatures).values(baseValues).returning({ id: signatures.id })
    if (legacyInserted) {
      created = {
        id: legacyInserted.id,
        publicId: legacyInserted.id,
      }
    }
  }

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Unable to allocate public signature id' })
  }

  const config = useRuntimeConfig()
  const verificationUrl = parsed.data.verification_url
    ?? `${config.verificationBaseUrl}?id=${created.publicId}`

  await db.update(signatures).set({ verificationUrl }).where(eq(signatures.id, created.id))

  return {
    id: created.publicId,
    internal_id: created.id,
    status: 'stored',
    verification_url: verificationUrl,
  }
})
