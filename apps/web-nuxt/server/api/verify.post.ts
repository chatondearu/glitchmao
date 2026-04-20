import type { VerificationResult } from '../utils/verify'
import { getDbPool } from '../utils/db'
import { computeSha256, verifyGpgSignature } from '../utils/verify'

export default defineEventHandler(async (event): Promise<VerificationResult> => {
  const form = await readMultipartFormData(event)
  if (!form) {
    throw createError({ statusCode: 400, statusMessage: 'Multipart form-data is required' })
  }

  const fileEntry = form.find(entry => entry.name === 'file')
  if (!fileEntry?.data) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file field in upload' })
  }

  const computedHash = computeSha256(fileEntry.data)
  const pool = getDbPool()

  const { rows } = await pool.query<{
    id: string
    signature: string
    content_hash: string
  }>(
    `
      SELECT id, signature, content_hash
      FROM signatures
      WHERE content_hash = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [computedHash],
  )

  if (!rows.length) {
    return {
      status: 'CORROMPU/INCONNU',
      details: 'No known signature for the uploaded content',
    }
  }

  const row = rows[0]
  const signatureOk = await verifyGpgSignature(row.signature, row.content_hash)
  const status = signatureOk ? 'AUTHENTIQUE' : 'CORROMPU/INCONNU'
  const details = signatureOk ? 'Uploaded content matches a valid signature' : 'Stored signature is invalid'

  await pool.query(
    `
      UPDATE signatures
      SET last_verification_at = NOW(), status = $2
      WHERE id = $1
    `,
    [row.id, status],
  )

  return { status, details }
})
