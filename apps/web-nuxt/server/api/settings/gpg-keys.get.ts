import { and, desc, eq } from 'drizzle-orm'
import { getCurrentProfile } from '../../utils/current-user'
import { getDb } from '../../utils/db'
import { gpgKeys } from '../../db/schema'

export default defineEventHandler(async () => {
  const current = await getCurrentProfile()
  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'No profile found' })
  }

  const db = getDb()
  const items = await db
    .select({
      id: gpgKeys.id,
      fingerprint: gpgKeys.fingerprint,
      keyId: gpgKeys.keyId,
      algorithm: gpgKeys.algorithm,
      status: gpgKeys.status,
      isDefault: gpgKeys.isDefault,
      createdAt: gpgKeys.createdAt,
      updatedAt: gpgKeys.updatedAt,
    })
    .from(gpgKeys)
    .where(eq(gpgKeys.userId, current.userId))
    .orderBy(desc(gpgKeys.isDefault), desc(gpgKeys.createdAt))

  const activeKey = items.find(item => item.isDefault && item.status === 'active') ?? null

  return {
    items,
    hasActiveDefaultKey: Boolean(activeKey),
  }
})
