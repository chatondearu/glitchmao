import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireAuthSession } from '../../utils/auth-session'
import { getDb } from '../../utils/db'
import { authCredentials, users } from '../../db/schema'
import { createPasswordHash } from '../../utils/password'

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
})

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Invalid password setup payload' })

  const db = getDb()
  const [existing] = await db.select({ userId: authCredentials.userId })
    .from(authCredentials)
    .where(eq(authCredentials.userId, session.user.userId))
    .limit(1)

  if (existing)
    throw createError({ statusCode: 409, statusMessage: 'Password already configured for this account' })

  const { hash, salt } = createPasswordHash(parsed.data.password)
  await db.transaction(async (tx) => {
    await tx.insert(authCredentials).values({
      userId: session.user.userId,
      passwordHash: hash,
      passwordSalt: salt,
    })

    await tx.update(users).set({
      email: parsed.data.email,
      updatedAt: new Date(),
    }).where(eq(users.id, session.user.userId))
  })

  return { status: 'password_configured' }
})
