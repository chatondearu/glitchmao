import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getCurrentProfile } from '../../../../utils/current-user'
import { getDb } from '../../../../utils/db'
import { compromiseKey } from '../../../../utils/gpg-keyring'
import { requireKeyManagementPermission } from '../../../../utils/permissions'
import { gpgKeys } from '../../../../db/schema'

const bodySchema = z.object({
  reason: z.enum(['user_report', 'suspected_leak', 'other']).default('user_report'),
  note: z.string().trim().max(500).optional(),
})

export default defineEventHandler(async (event) => {
  await requireKeyManagementPermission(event)
  const current = await getCurrentProfile(event)
  if (!current)
    throw createError({ statusCode: 404, statusMessage: 'No profile found' })

  const keyId = getRouterParam(event, 'id')
  if (!keyId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing key id' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }

  const db = getDb()
  const [key] = await db
    .select({ id: gpgKeys.id })
    .from(gpgKeys)
    .where(and(eq(gpgKeys.id, keyId), eq(gpgKeys.userId, current.userId)))
    .limit(1)
  if (!key)
    throw createError({ statusCode: 404, statusMessage: 'Key not found' })

  await compromiseKey(key.id, parsed.data.reason, parsed.data.note)
  return { status: 'compromised' }
})
