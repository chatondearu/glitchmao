import { spawn } from 'node:child_process'
import { eq, and } from 'drizzle-orm'
import { getDb } from './db'
import { gpgKeyCompromiseEvents, gpgKeys } from '../db/schema'

export interface GeneratedGpgKey {
  fingerprint: string
  keyId: string
  algorithm: string | null
}

function runCommand(command: string, args: string[], input?: string): Promise<{ stdout: string, stderr: string }> {
  const config = useRuntimeConfig()
  const gpgEnv = config.gpgHome
    ? { ...process.env, GNUPGHOME: config.gpgHome }
    : process.env

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env: gpgEnv })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => (stdout += chunk.toString()))
    child.stderr.on('data', chunk => (stderr += chunk.toString()))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0)
        return resolve({ stdout, stderr })
      reject(new Error(stderr.trim() || `Command failed: ${command}`))
    })
    if (input)
      child.stdin.end(input)
  })
}

export async function generateDefaultGpgKey(userDisplayName: string, userHandle: string): Promise<GeneratedGpgKey> {
  const config = useRuntimeConfig()
  const domain = config.gpgDefaultKeyDomain || 'glitchmao.local'
  const name = userDisplayName || config.gpgDefaultKeyName || 'GlitchMao User'
  const email = `${userHandle}@${domain}`
  const batch = `
%no-protection
Key-Type: RSA
Key-Length: 3072
Name-Real: ${name}
Name-Email: ${email}
Expire-Date: 0
%commit
`
  await runCommand('gpg', ['--batch', '--generate-key'], batch)
  const { stdout } = await runCommand('gpg', ['--list-secret-keys', '--with-colons', email])
  const line = stdout.split('\n').find(row => row.startsWith('fpr:'))
  const keyLine = stdout.split('\n').find(row => row.startsWith('sec:'))
  if (!line || !keyLine)
    throw new Error('Unable to retrieve generated GPG key fingerprint')

  const fingerprint = line.split(':')[9] ?? ''
  const keyId = fingerprint.slice(-16)
  const algorithm = keyLine.split(':')[3] || null
  return { fingerprint, keyId, algorithm }
}

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
