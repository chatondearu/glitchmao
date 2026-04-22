import { createError } from 'h3'
import nodemailer from 'nodemailer'

interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

interface SendMailInput {
  to: string
  subject: string
  text: string
}

function getSmtpConfig(): SmtpConfig {
  const config = useRuntimeConfig()
  return {
    host: config.smtpHost,
    port: Number(config.smtpPort || 587),
    secure: config.smtpSecure === 'true',
    user: config.smtpUser,
    pass: config.smtpPass,
    from: config.smtpFrom,
  }
}

export async function sendTextMail(input: SendMailInput) {
  const smtp = getSmtpConfig()
  if (!smtp.host || !smtp.from)
    throw createError({ statusCode: 500, statusMessage: 'SMTP is not configured' })

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user && smtp.pass
      ? {
          user: smtp.user,
          pass: smtp.pass,
        }
      : undefined,
  })

  try {
    await transporter.sendMail({
      from: smtp.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    })
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'Unable to deliver email via SMTP' })
  }
}
