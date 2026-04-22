import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { authCredentials, users } from '../../db/schema'
import { createPasswordHash } from '../../utils/password'
import { createAuthSession } from '../../utils/auth-session'

const bodySchema = z.object({
  handle: z.string().trim().min(3).max(80),
  email: z.string().trim().email(),
  display_name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Invalid registration payload' })

  const db = getDb()
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.handle, parsed.data.handle)).limit(1)
  if (existing.length)
    throw createError({ statusCode: 409, statusMessage: 'Handle already exists' })
  const existingEmail = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1)
  if (existingEmail.length)
    throw createError({ statusCode: 409, statusMessage: 'Email already exists' })

  const { hash, salt } = createPasswordHash(parsed.data.password)
  const [createdUser] = await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({
      handle: parsed.data.handle,
      email: parsed.data.email.toLowerCase(),
      displayName: parsed.data.display_name,
    }).returning({ id: users.id, handle: users.handle, displayName: users.displayName })

    await tx.insert(authCredentials).values({
      userId: user.id,
      passwordHash: hash,
      passwordSalt: salt,
    })

    return [user]
  })

  await createAuthSession(event, createdUser.id, null)
  return {
    user: {
      userId: createdUser.id,
      handle: createdUser.handle,
      displayName: createdUser.displayName,
    },
  }
})
