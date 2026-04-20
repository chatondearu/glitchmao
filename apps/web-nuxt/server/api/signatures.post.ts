import { z } from 'zod'
import { getDbPool } from '../utils/db'

const bodySchema = z.object({
  content_hash: z.string().trim().length(64),
  signature: z.string().trim().min(1),
  creator_id: z.string().trim().min(1),
  verification_url: z.string().trim().url(),
  status: z.enum(['AUTHENTIQUE', 'CORROMPU/INCONNU']).default('AUTHENTIQUE'),
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

  const pool = getDbPool()
  const { rows } = await pool.query<{ id: string }>(
    `
      INSERT INTO signatures (content_hash, signature, creator_id, verification_url, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [
      parsed.data.content_hash,
      parsed.data.signature,
      parsed.data.creator_id,
      parsed.data.verification_url,
      parsed.data.status,
    ],
  )

  return {
    id: rows[0]?.id,
    status: 'stored',
  }
})
