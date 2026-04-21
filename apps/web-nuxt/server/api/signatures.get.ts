import { and, desc, eq, gte, lt, lte, or } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../utils/db'
import { signatures, users } from '../db/schema'
import { decodeSignaturesCursor, encodeSignaturesCursor } from '../utils/pagination'

const querySchema = z.object({
  source_type: z.enum(['image', 'pdf', 'text', 'markdown', 'plain_text']).optional(),
  profile_id: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filters' })
  }

  const db = getDb()
  let decodedCursor: { createdAt: string, id: string } | null = null
  if (parsed.data.cursor) {
    try {
      decodedCursor = decodeSignaturesCursor(parsed.data.cursor)
    }
    catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid cursor' })
    }
  }

  const filters = [
    parsed.data.source_type ? eq(signatures.sourceType, parsed.data.source_type) : undefined,
    parsed.data.profile_id ? eq(signatures.profileId, parsed.data.profile_id) : undefined,
    parsed.data.from ? gte(signatures.createdAt, new Date(parsed.data.from)) : undefined,
    parsed.data.to ? lte(signatures.createdAt, new Date(parsed.data.to)) : undefined,
    decodedCursor
      ? or(
          lt(signatures.createdAt, new Date(decodedCursor.createdAt)),
          and(eq(signatures.createdAt, new Date(decodedCursor.createdAt)), lt(signatures.id, decodedCursor.id)),
        )
      : undefined,
  ].filter(Boolean)

  let rows: Array<{
    id: string
    cursorId: string
    contentHash: string
    creatorId: string
    sourceType: 'image' | 'pdf' | 'text' | 'markdown' | 'plain_text'
    status: 'AUTHENTIQUE' | 'CORROMPU/INCONNU'
    createdAt: Date
    profileId: string | null
    verificationUrl: string
    handle: string | null
    displayName: string | null
  }>

  try {
    rows = await db
      .select({
        id: signatures.publicId,
        cursorId: signatures.id,
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
      .orderBy(desc(signatures.createdAt), desc(signatures.id))
      .limit(parsed.data.limit + 1)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('public_id'))
      throw error

    rows = await db
      .select({
        id: signatures.id,
        cursorId: signatures.id,
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
      .orderBy(desc(signatures.createdAt), desc(signatures.id))
      .limit(parsed.data.limit + 1)
  }

  const hasMore = rows.length > parsed.data.limit
  const limitedRows = hasMore ? rows.slice(0, parsed.data.limit) : rows
  const items = limitedRows.map(({ cursorId: _cursorId, ...item }) => item)
  const lastCursorRow = limitedRows[limitedRows.length - 1]
  const lastItem = items[items.length - 1]
  const nextCursor = hasMore && lastItem && lastCursorRow
    ? encodeSignaturesCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastCursorRow.cursorId })
    : null

  return {
    items,
    count: items.length,
    nextCursor,
  }
})
