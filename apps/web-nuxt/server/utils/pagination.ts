export interface SignaturesCursor {
  createdAt: string
  id: string
}

export function encodeSignaturesCursor(cursor: SignaturesCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

export function decodeSignaturesCursor(cursor: string): SignaturesCursor {
  const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as SignaturesCursor
  if (!decoded?.createdAt || !decoded?.id)
    throw new Error('Invalid cursor payload')

  return decoded
}
