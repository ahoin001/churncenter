/** Local-only ledger transfer via URL hash (no backend). */

export const TRANSFER_MAX_ENVELOPE_CHARS = 60_000
export const TRANSFER_HASH_KEY = 'transfer'

const PREFIX_COMPRESSED = 'cc1.'
const PREFIX_RAW = 'cc1u.'

export type EncodeTransferResult =
  | {
      ok: true
      envelope: string
      compressed: boolean
      charLength: number
    }
  | {
      ok: false
      reason: 'too_large' | 'encode_failed'
      charLength?: number
      detail?: string
    }

export type DecodeTransferResult =
  | { ok: true; json: string }
  | { ok: false; error: string }

function bytesToBase64Url(bytes: Uint8Array): string {
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const padLen = (4 - (padded.length % 4)) % 4
  const b64 = padded + '='.repeat(padLen)
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i)
  return out
}

function supportsCompression(): boolean {
  return typeof CompressionStream === 'function' && typeof DecompressionStream === 'function'
}

async function compressDeflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(
    new CompressionStream('deflate-raw'),
  )
  const buffer = await new Response(stream).arrayBuffer()
  return new Uint8Array(buffer)
}

async function decompressDeflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(
    new DecompressionStream('deflate-raw'),
  )
  const buffer = await new Response(stream).arrayBuffer()
  return new Uint8Array(buffer)
}

function textEncoder() {
  return new TextEncoder()
}

function textDecoder() {
  return new TextDecoder()
}

/** Build a versioned envelope from ledger JSON. */
export async function encodeTransferPayload(json: string): Promise<EncodeTransferResult> {
  try {
    const rawBytes = textEncoder().encode(json)

    if (supportsCompression()) {
      const compressed = await compressDeflateRaw(rawBytes)
      const envelope = PREFIX_COMPRESSED + bytesToBase64Url(compressed)
      if (envelope.length > TRANSFER_MAX_ENVELOPE_CHARS) {
        return { ok: false, reason: 'too_large', charLength: envelope.length }
      }
      return {
        ok: true,
        envelope,
        compressed: true,
        charLength: envelope.length,
      }
    }

    const envelope = PREFIX_RAW + bytesToBase64Url(rawBytes)
    if (envelope.length > TRANSFER_MAX_ENVELOPE_CHARS) {
      return { ok: false, reason: 'too_large', charLength: envelope.length }
    }
    return {
      ok: true,
      envelope,
      compressed: false,
      charLength: envelope.length,
    }
  } catch (error) {
    return {
      ok: false,
      reason: 'encode_failed',
      detail: error instanceof Error ? error.message : 'Unknown encode error',
    }
  }
}

/** Decode a cc1 / cc1u envelope back to JSON text. */
export async function decodeTransferEnvelope(envelope: string): Promise<DecodeTransferResult> {
  try {
    const trimmed = envelope.trim()
    if (trimmed.startsWith(PREFIX_COMPRESSED)) {
      if (!supportsCompression()) {
        return { ok: false, error: 'This browser cannot decompress transfer links. Use a JSON file instead.' }
      }
      const bytes = base64UrlToBytes(trimmed.slice(PREFIX_COMPRESSED.length))
      const inflated = await decompressDeflateRaw(bytes)
      return { ok: true, json: textDecoder().decode(inflated) }
    }
    if (trimmed.startsWith(PREFIX_RAW)) {
      const bytes = base64UrlToBytes(trimmed.slice(PREFIX_RAW.length))
      return { ok: true, json: textDecoder().decode(bytes) }
    }
    return { ok: false, error: 'Unrecognized transfer link format.' }
  } catch {
    return { ok: false, error: 'Could not read this transfer link. It may be truncated or damaged.' }
  }
}

export function buildTransferUrl(
  origin: string,
  pathname: string,
  envelope: string,
): string {
  const basePath = pathname.endsWith('/') ? pathname : `${pathname.replace(/\/$/, '')}/`
  // Prefer app root path so Router lands cleanly
  const path = pathname === '/' || pathname === '' ? '/' : basePath
  const root = origin.replace(/\/$/, '')
  return `${root}${path === '/' ? '/' : path}#${TRANSFER_HASH_KEY}=${envelope}`
}

/** Extract envelope from `location.hash` (`#transfer=...`). */
export function parseTransferHash(hash: string): string | null {
  if (!hash) return null
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  // Support `transfer=...` and accidental `?` leftovers after hash
  const params = new URLSearchParams(raw.includes('=') ? raw : '')
  const fromParams = params.get(TRANSFER_HASH_KEY)
  if (fromParams) return fromParams
  if (raw.startsWith(`${TRANSFER_HASH_KEY}=`)) {
    return decodeURIComponent(raw.slice(TRANSFER_HASH_KEY.length + 1))
  }
  return null
}

export function clearTransferHash(): void {
  if (typeof window === 'undefined') return
  const { pathname, search } = window.location
  window.history.replaceState(null, '', `${pathname}${search}`)
}

export function formatTransferSize(charLength: number): string {
  if (charLength < 1000) return `${charLength} chars`
  return `${(charLength / 1000).toFixed(1)}k chars`
}
