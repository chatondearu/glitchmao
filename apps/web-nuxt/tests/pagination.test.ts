import { describe, expect, it } from 'vitest'
import { decodeSignaturesCursor, encodeSignaturesCursor } from '../server/utils/pagination'

describe('signatures cursor pagination', () => {
  it('encodes and decodes a cursor payload', () => {
    const raw = { createdAt: '2026-04-21T10:00:00.000Z', id: 'abc-123' }
    const cursor = encodeSignaturesCursor(raw)
    expect(decodeSignaturesCursor(cursor)).toEqual(raw)
  })

  it('throws for invalid cursor payload', () => {
    expect(() => decodeSignaturesCursor('e30')).toThrowError('Invalid cursor payload')
  })
})
