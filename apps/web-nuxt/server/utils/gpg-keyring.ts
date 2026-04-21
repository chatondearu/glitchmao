import { eq, and } from 'drizzle-orm'
import { getDb } from './db'
import { gpgKeyCompromiseEvents, gpgKeys } from '../db/schema'

export async function getActiveSigningKey(userId: string) {
  const db = getDb()
  const [row] = await db
    .select()
    .from(gpgKeys)
    .where(and(eq(gpgKeys.userId, userId), eq(gpgKeys.isDefault, true), eq(gpgKeys.status, 'active')))
    .limit(1)
  return row ?? null
}

export async function setDefaultKey(userId: string, keyId: string) {
  const db = getDb()
  await db.transaction(async (tx) => {
    await tx.update(gpgKeys).set({ isDefault: false, updatedAt: new Date() }).where(eq(gpgKeys.userId, userId))
    await tx.update(gpgKeys).set({ isDefault: true, updatedAt: new Date() }).where(and(eq(gpgKeys.userId, userId), eq(gpgKeys.id, keyId)))
  })
}

export async function compromiseKey(keyId: string, reason: 'user_report' | 'suspected_leak' | 'other', note?: string | null) {
  const db = getDb()
  await db.transaction(async (tx) => {
    await tx.update(gpgKeys).set({ status: 'compromised', isDefault: false, updatedAt: new Date() }).where(eq(gpgKeys.id, keyId))
    await tx.insert(gpgKeyCompromiseEvents).values({
      gpgKeyId: keyId,
      reason,
      note: note ?? null,
    })
  })
}
