import { z } from 'zod'
import type { VerificationResult } from '../utils/verify'
import { getDbPool } from '../utils/db'
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

  const pool = getDbPool()
  const { rows } = await pool.query<{
    signature: string
    content_hash: string
  }>(
    `
      SELECT signature, content_hash
      FROM signatures
      WHERE content_hash = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [parsed.data.hash],
  )

  if (!rows.length) {
    return {
      status: 'CORROMPU/INCONNU',
      details: 'No signature record found for this hash',
    }
  }

  const row = rows[0]
  const signatureOk = await verifyGpgSignature(row.signature, row.content_hash)

  return signatureOk
    ? { status: 'AUTHENTIQUE', details: 'Hash and signature are valid' }
    : { status: 'CORROMPU/INCONNU', details: 'Signature verification failed' }
})
