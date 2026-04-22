import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../../utils/db'
import { authCredentials } from '../../../db/schema'
import { consumePasswordResetToken } from '../../../utils/password-reset'
import { createPasswordHash } from '../../../utils/password'

const bodySchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(8).max(128),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Invalid reset password payload' })

  const consumed = await consumePasswordResetToken(parsed.data.token)
  if (!consumed)
    throw createError({ statusCode: 400, statusMessage: 'Reset token is invalid or expired' })

  const { hash, salt } = createPasswordHash(parsed.data.password)
  const db = getDb()
  const [existing] = await db.select({ userId: authCredentials.userId })
    .from(authCredentials)
    .where(eq(authCredentials.userId, consumed.userId))
    .limit(1)

  if (existing) {
    await db.update(authCredentials).set({
      passwordHash: hash,
      passwordSalt: salt,
      updatedAt: new Date(),
    }).where(eq(authCredentials.userId, consumed.userId))
  }
  else {
    await db.insert(authCredentials).values({
      userId: consumed.userId,
      passwordHash: hash,
      passwordSalt: salt,
    })
  }

  return { status: 'password_reset' }
})
