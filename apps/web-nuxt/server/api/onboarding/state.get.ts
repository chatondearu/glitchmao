import { and, eq } from 'drizzle-orm'
import { getCurrentProfile } from '../../utils/current-user'
import { getDb } from '../../utils/db'
import { gpgKeys } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const profile = await getCurrentProfile(event).catch(() => null)
  if (!profile) {
    return {
      onboardingRequired: true,
      hasProfile: false,
      hasActiveDefaultKey: false,
    }
  }

  const db = getDb()
  const [activeKey] = await db
    .select({ id: gpgKeys.id })
    .from(gpgKeys)
    .where(and(
      eq(gpgKeys.userId, profile.userId),
      eq(gpgKeys.isDefault, true),
      eq(gpgKeys.status, 'active'),
    ))
    .limit(1)

  return {
    onboardingRequired: !profile.onboardingCompletedAt || !activeKey,
    hasProfile: true,
    hasActiveDefaultKey: Boolean(activeKey),
  }
})
