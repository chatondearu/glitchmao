import { z } from 'zod'
import { desc, eq } from 'drizzle-orm'
import type { VerificationResult } from '../utils/verify'
import { getDb } from '../utils/db'
import { signatures } from '../db/schema'
import { verifyGpgSignature } from '../utils/verify'

const querySchema = z.object({
  hash: z.string().trim().min(64).max(64),
})

export default defineEventHandler(async (event): Promise<VerificationResult> => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid hash query parameter',
    })
  }

  const db = getDb()
  const rows = await db
    .select({
      signature: signatures.signature,
      contentHash: signatures.contentHash,
    })
    .from(signatures)
    .where(eq(signatures.contentHash, parsed.data.hash))
    .orderBy(desc(signatures.createdAt))
    .limit(1)

  if (!rows.length) {
    return {
      status: 'CORROMPU/INCONNU',
      details: 'No signature record found for this hash',
    }
  }

  const row = rows[0]
  const signatureOk = await verifyGpgSignature(row.signature, row.contentHash)

  return signatureOk
    ? { status: 'AUTHENTIQUE', details: 'Hash and signature are valid' }
    : { status: 'CORROMPU/INCONNU', details: 'Signature verification failed' }
})
