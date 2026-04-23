import { desc, eq } from 'drizzle-orm'
import type { VerificationResult } from '../utils/verify'
import { getDb } from '../utils/db'
import { signatures } from '../db/schema'
import { computeSha256 } from '../utils/verify'
import { verifySignatureWithSigner } from '../utils/signer-service'

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
  const db = getDb()
  const rows = await db
    .select({
      id: signatures.id,
      signature: signatures.signature,
      contentHash: signatures.contentHash,
    })
    .from(signatures)
    .where(eq(signatures.contentHash, computedHash))
    .orderBy(desc(signatures.createdAt))
    .limit(1)

  if (!rows.length) {
    return {
      status: 'CORROMPU/INCONNU',
      details: 'No known signature for the uploaded content',
    }
  }

  const row = rows[0]
  if (!row) {
    return {
      status: 'CORROMPU/INCONNU',
      details: 'No known signature for the uploaded content',
    }
  }
  const signatureOk = await verifySignatureWithSigner(row.signature, row.contentHash)
  const status = signatureOk ? 'AUTHENTIQUE' : 'CORROMPU/INCONNU'
  const details = signatureOk ? 'Uploaded content matches a valid signature' : 'Stored signature is invalid'

  await db
    .update(signatures)
    .set({
      lastVerificationAt: new Date(),
      status,
    })
    .where(eq(signatures.id, row.id))

  return { status, details }
})
