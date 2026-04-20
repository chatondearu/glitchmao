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

function runGpgVerify(signaturePath: string, contentPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('gpg', ['--verify', signaturePath, contentPath])
    child.on('close', (code) => {
      resolve(code === 0)
    })
    child.on('error', () => {
      resolve(false)
    })
  })
}
