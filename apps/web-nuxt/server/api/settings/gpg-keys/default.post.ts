import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getCurrentProfile } from '../../../utils/current-user'
import { getDb } from '../../../utils/db'
import { setDefaultKey } from '../../../utils/gpg-keyring'
import { gpgKeys } from '../../../db/schema'

const bodySchema = z.object({
  key_id: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  const current = await getCurrentProfile()
  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'No profile found' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid key id' })
  }

  const db = getDb()
  const [key] = await db
    .select({ id: gpgKeys.id, status: gpgKeys.status })
    .from(gpgKeys)
    .where(and(eq(gpgKeys.id, parsed.data.key_id), eq(gpgKeys.userId, current.userId)))
    .limit(1)

  if (!key)
    throw createError({ statusCode: 404, statusMessage: 'Key not found' })
  if (key.status !== 'active')
    throw createError({ statusCode: 400, statusMessage: 'Compromised key cannot be default' })

  await setDefaultKey(current.userId, key.id)
  return { status: 'updated' }
})
