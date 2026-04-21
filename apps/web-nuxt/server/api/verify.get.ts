import { z } from 'zod'
import { desc, eq, or } from 'drizzle-orm'
import type { VerificationResult } from '../utils/verify'
import { getDb } from '../utils/db'
import { signatures } from '../db/schema'
import { verifySignatureWithSigner } from '../utils/signer-service'

const querySchema = z.object({
  hash: z.string().trim().min(64).max(64).optional(),
  id: z.string().trim().min(8).max(64).optional(),
})

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event): Promise<VerificationResult> => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success || (!parsed.data.hash && !parsed.data.id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Provide either id or hash query parameter',
    })
  }

  const db = getDb()
  let rows: Array<{ signature: string, contentHash: string }>
  try {
    rows = await db
      .select({
        signature: signatures.signature,
        contentHash: signatures.contentHash,
      })
      .from(signatures)
      .where(
        parsed.data.id
          ? (
              uuidRegex.test(parsed.data.id)
                ? or(eq(signatures.publicId, parsed.data.id), eq(signatures.id, parsed.data.id))
                : eq(signatures.publicId, parsed.data.id)
            )
          : eq(signatures.contentHash, parsed.data.hash as string),
      )
      .orderBy(desc(signatures.createdAt))
      .limit(1)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('public_id'))
      throw error

    rows = await db
      .select({
        signature: signatures.signature,
        contentHash: signatures.contentHash,
      })
      .from(signatures)
      .where(
        parsed.data.id
          ? (uuidRegex.test(parsed.data.id) ? eq(signatures.id, parsed.data.id) : eq(signatures.contentHash, parsed.data.id))
          : eq(signatures.contentHash, parsed.data.hash as string),
      )
      .orderBy(desc(signatures.createdAt))
      .limit(1)
  }

  if (!rows.length) {
    return {
      status: 'CORROMPU/INCONNU',
      details: 'No signature record found for this hash',
    }
  }

  const row = rows[0]
  const signatureOk = await verifySignatureWithSigner(row.signature, row.contentHash)

  return signatureOk
    ? { status: 'AUTHENTIQUE', details: 'Hash and signature are valid' }
    : { status: 'CORROMPU/INCONNU', details: 'Signature verification failed' }
})
