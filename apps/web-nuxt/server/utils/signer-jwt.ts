import { createHmac, randomUUID } from 'node:crypto'
import { createError } from 'h3'

interface SignerTokenPayload {
  sub: string
  profile_id: string | null
  allowed_fingerprint: string | null
  scope: string[]
}

function toBase64Url(input: string) {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function getSignerSecurityConfig() {
  const config = useRuntimeConfig()
  return {
    mode: config.signerSecurityMode as 'secure' | 'insecure_local',
    jwtSecret: config.signerJwtSecret,
    ttlSec: Number(config.signerJwtTtlSec || '60'),
  }
}

export function createSignerAccessToken(payload: SignerTokenPayload) {
  const signerConfig = getSignerSecurityConfig()
  if (signerConfig.mode === 'insecure_local')
    return null

  if (!signerConfig.jwtSecret?.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage: 'SIGNER_JWT_SECRET is required in secure mode',
    })
  }

  const now = Math.floor(Date.now() / 1000)
  const claims = {
    sub: payload.sub,
    profile_id: payload.profile_id,
    allowed_fingerprint: payload.allowed_fingerprint,
    scope: payload.scope,
    iat: now,
    exp: now + Math.max(10, signerConfig.ttlSec),
    jti: randomUUID(),
  }

  const encodedHeader = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const encodedClaims = toBase64Url(JSON.stringify(claims))
  const signingInput = `${encodedHeader}.${encodedClaims}`
  const signature = createHmac('sha256', signerConfig.jwtSecret).update(signingInput).digest('base64url')

  return `${signingInput}.${signature}`
}
