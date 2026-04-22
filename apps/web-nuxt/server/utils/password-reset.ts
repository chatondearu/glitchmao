import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { getDb } from './db'
import { passwordResetTokens } from '../db/schema'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

export function hashPasswordResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createPasswordResetToken(userId: string) {
  const db = getDb()
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashPasswordResetToken(token)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash,
    expiresAt,
  })

  return { token, expiresAt }
}

export async function consumePasswordResetToken(token: string) {
  const db = getDb()
  const hashed = hashPasswordResetToken(token)
  const [row] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
    })
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.tokenHash, hashed),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date()),
    ))
    .limit(1)

  if (!row)
    return null

  await db.update(passwordResetTokens).set({
    usedAt: new Date(),
  }).where(eq(passwordResetTokens.id, row.id))

  return row
}
