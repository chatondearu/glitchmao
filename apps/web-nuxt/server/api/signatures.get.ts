import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../utils/db'
import { signatures, users } from '../db/schema'

const querySchema = z.object({
  source_type: z.enum(['image', 'pdf', 'text', 'markdown', 'plain_text']).optional(),
  profile_id: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filters' })
  }

  const db = getDb()
  const filters = [
    parsed.data.source_type ? eq(signatures.sourceType, parsed.data.source_type) : undefined,
    parsed.data.profile_id ? eq(signatures.profileId, parsed.data.profile_id) : undefined,
    parsed.data.from ? gte(signatures.createdAt, new Date(parsed.data.from)) : undefined,
    parsed.data.to ? lte(signatures.createdAt, new Date(parsed.data.to)) : undefined,
  ].filter(Boolean)

  const rows = await db
    .select({
      id: signatures.id,
      contentHash: signatures.contentHash,
      creatorId: signatures.creatorId,
      sourceType: signatures.sourceType,
      status: signatures.status,
      createdAt: signatures.createdAt,
      profileId: signatures.profileId,
      verificationUrl: signatures.verificationUrl,
      handle: users.handle,
      displayName: users.displayName,
    })
    .from(signatures)
    .leftJoin(users, eq(signatures.userId, users.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(signatures.createdAt))
    .limit(parsed.data.limit)

  return {
    items: rows,
    count: rows.length,
  }
})
