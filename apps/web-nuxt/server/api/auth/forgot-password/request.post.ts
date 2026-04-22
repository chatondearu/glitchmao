import { or, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../../utils/db'
import { users } from '../../../db/schema'
import { createPasswordResetToken } from '../../../utils/password-reset'
import { sendTextMail } from '../../../utils/smtp-mailer'

const bodySchema = z.object({
  identifier: z.string().trim().min(1).max(255),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Invalid forgot password payload' })

  const db = getDb()
  const [user] = await db.select({
    id: users.id,
    email: users.email,
    handle: users.handle,
  }).from(users).where(or(
    eq(users.handle, parsed.data.identifier),
    eq(users.email, parsed.data.identifier.toLowerCase()),
  )).limit(1)

  if (!user?.email)
    return { status: 'request_received' }

  const { token } = await createPasswordResetToken(user.id)
  const config = useRuntimeConfig()
  const resetUrl = `${config.passwordResetBaseUrl}?token=${encodeURIComponent(token)}`
  await sendTextMail({
    to: user.email,
    subject: 'GlitchMao password reset',
    text: [
      'A password reset was requested for your GlitchMao account.',
      `Handle: ${user.handle}`,
      '',
      `Reset link: ${resetUrl}`,
      '',
      'This link expires in 1 hour.',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
  })

  return { status: 'request_received' }
})
