import type { H3Event } from 'h3'
import { createError } from 'h3'
import { getCurrentProfile } from './current-user'
import { getActiveSigningKey } from './gpg-keyring'

export interface ActiveSigningContext {
  userId: string
  profileId: string
  handle: string
  displayName: string
  signingKeyId: string
  fingerprint: string
  keyId: string | null
}

export async function resolveActiveSigningContext(event: H3Event): Promise<ActiveSigningContext> {
  const currentProfile = await getCurrentProfile(event)
  if (!currentProfile) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Onboarding is required before signing',
    })
  }

  const activeSigningKey = await getActiveSigningKey(currentProfile.userId)
  if (!activeSigningKey) {
    throw createError({
      statusCode: 403,
      statusMessage: 'No active default GPG key available',
    })
  }

  const fingerprint = activeSigningKey.fingerprint || activeSigningKey.keyId
  if (!fingerprint) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No signing identity configured',
    })
  }

  return {
    userId: currentProfile.userId,
    profileId: currentProfile.profileId,
    handle: currentProfile.handle,
    displayName: currentProfile.displayName,
    signingKeyId: activeSigningKey.id,
    fingerprint,
    keyId: activeSigningKey.keyId ?? null,
  }
}
