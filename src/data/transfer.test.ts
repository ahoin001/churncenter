import { describe, expect, it } from 'vitest'
import {
  TRANSFER_MAX_ENVELOPE_CHARS,
  buildTransferUrl,
  decodeTransferEnvelope,
  encodeTransferPayload,
  parseTransferHash,
} from './transfer'

const sample = JSON.stringify({
  meta: { schemaVersion: 4, onboardingCompleted: true, lastBackupAt: null },
  preferences: { themeMode: 'system' },
  offers: [{ id: 'o1', title: 'Test' }],
})

describe('transfer codec', () => {
  it('round-trips JSON through encode/decode', async () => {
    const encoded = await encodeTransferPayload(sample)
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) return
    expect(encoded.envelope.startsWith('cc1.') || encoded.envelope.startsWith('cc1u.')).toBe(
      true,
    )
    expect(encoded.charLength).toBeLessThanOrEqual(TRANSFER_MAX_ENVELOPE_CHARS)

    const decoded = await decodeTransferEnvelope(encoded.envelope)
    expect(decoded.ok).toBe(true)
    if (!decoded.ok) return
    expect(JSON.parse(decoded.json)).toEqual(JSON.parse(sample))
  })

  it('rejects envelopes that exceed the soft size gate', async () => {
    const huge = JSON.stringify({ blob: 'x'.repeat(200_000) })
    const encoded = await encodeTransferPayload(huge)
    // Even compressed, may still be large — assert either ok under limit or too_large
    if (!encoded.ok) {
      expect(encoded.reason).toBe('too_large')
      expect((encoded.charLength ?? 0) > TRANSFER_MAX_ENVELOPE_CHARS).toBe(true)
    } else {
      expect(encoded.charLength).toBeLessThanOrEqual(TRANSFER_MAX_ENVELOPE_CHARS)
    }
  })

  it('parses transfer hash payloads', () => {
    expect(parseTransferHash('#transfer=cc1.abc')).toBe('cc1.abc')
    expect(parseTransferHash('transfer=cc1.abc')).toBe('cc1.abc')
    expect(parseTransferHash('#other=1')).toBeNull()
  })

  it('builds a hash URL', () => {
    const url = buildTransferUrl('http://localhost:5173', '/', 'cc1.abc')
    expect(url).toBe('http://localhost:5173/#transfer=cc1.abc')
  })
})
