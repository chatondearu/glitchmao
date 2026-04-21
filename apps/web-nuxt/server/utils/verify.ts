import { createHash } from 'node:crypto'

export interface VerificationResult {
  status: 'AUTHENTIQUE' | 'CORROMPU/INCONNU'
  details: string
}

export function computeSha256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex')
}
