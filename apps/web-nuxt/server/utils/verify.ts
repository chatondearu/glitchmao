import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const sleep = promisify(setTimeout)

export interface VerificationResult {
  status: 'AUTHENTIQUE' | 'CORROMPU/INCONNU'
  details: string
}

export function computeSha256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex')
}

export async function verifyGpgSignature(signature: string, contentHash: string): Promise<boolean> {
  const nonce = Math.random().toString(36).slice(2)
  const sigPath = join(tmpdir(), `glitchmao-${nonce}.asc`)
  const hashPath = join(tmpdir(), `glitchmao-${nonce}.txt`)

  await writeFile(sigPath, signature, 'utf8')
  await writeFile(hashPath, contentHash, 'utf8')

  try {
    const ok = await runGpgVerify(sigPath, hashPath)
    return ok
  }
  finally {
    await sleep(1)
    await Promise.allSettled([unlink(sigPath), unlink(hashPath)])
  }
}

export async function signGpgHash(contentHash: string, keyId: string): Promise<string> {
  const nonce = Math.random().toString(36).slice(2)
  const hashPath = join(tmpdir(), `glitchmao-${nonce}.txt`)
  await writeFile(hashPath, contentHash, 'utf8')

  try {
    return await runGpgSign(hashPath, keyId)
  }
  finally {
    await sleep(1)
    await Promise.allSettled([unlink(hashPath)])
  }
}

function runGpgVerify(signaturePath: string, contentPath: string): Promise<boolean> {
  const config = useRuntimeConfig()
  const gpgEnv = config.gpgHome
    ? { ...process.env, GNUPGHOME: config.gpgHome }
    : process.env
  return new Promise((resolve) => {
    const child = spawn('gpg', ['--verify', signaturePath, contentPath], { env: gpgEnv })
    child.on('close', (code) => {
      resolve(code === 0)
    })
    child.on('error', () => {
      resolve(false)
    })
  })
}

function runGpgSign(contentPath: string, keyId: string): Promise<string> {
  const config = useRuntimeConfig()
  const gpgEnv = config.gpgHome
    ? { ...process.env, GNUPGHOME: config.gpgHome }
    : process.env
  return new Promise((resolve, reject) => {
    const child = spawn('gpg', [
      '--armor',
      '--batch',
      '--yes',
      '--pinentry-mode',
      'loopback',
      '--local-user',
      keyId,
      '--detach-sign',
      '--output',
      '-',
      contentPath,
    ], { env: gpgEnv })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => (stdout += chunk.toString()))
    child.stderr.on('data', chunk => (stderr += chunk.toString()))
    child.on('close', (code) => {
      if (code === 0 && stdout.trim())
        return resolve(stdout.trim())

      reject(new Error(stderr.trim() || 'Failed to generate GPG signature'))
    })
    child.on('error', (err) => {
      reject(err)
    })
  })
}
