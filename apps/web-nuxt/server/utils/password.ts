import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

export function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync(password, salt, KEY_LENGTH)

  return {
    salt,
    hash: derivedKey.toString('hex'),
  }
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const derivedKey = scryptSync(password, salt, KEY_LENGTH)
  const expected = Buffer.from(expectedHash, 'hex')
  if (expected.length !== derivedKey.length)
    return false

  return timingSafeEqual(derivedKey, expected)
}
