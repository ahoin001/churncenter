import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Surface, RevealText } from '@/components'
import { useChurnStore } from '@/data/store'
import {
  clearTransferHash,
  decodeTransferEnvelope,
  formatTransferSize,
} from '@/data/transfer'

type Props = {
  envelope: string
  onDismiss: () => void
}

export function TransferReceivePage({ envelope, onDismiss }: Props) {
  const navigate = useNavigate()
  const importJson = useChurnStore((s) => s.importJson)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [json, setJson] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await decodeTransferEnvelope(envelope)
      if (cancelled) return
      if (!result.ok) {
        setError(result.error)
        setStatus('error')
        return
      }
      setJson(result.json)
      setStatus('ready')
    })()
    return () => {
      cancelled = true
    }
  }, [envelope])

  function finishDismiss(goHome: boolean) {
    clearTransferHash()
    onDismiss()
    if (goHome) navigate('/', { replace: true })
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-cc-bg px-4 text-cc-ink">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <header className="space-y-2 text-center">
          <RevealText as="h1" className="cc-display">
            Restore ledger?
          </RevealText>
          <RevealText as="p" className="cc-body text-cc-ink-secondary" delay={0.05}>
            A transfer link landed on this device. Restoring replaces everything stored here
            locally.
          </RevealText>
        </header>

        <Surface className="space-y-4" padding="lg">
          {status === 'loading' ? (
            <p className="cc-body text-cc-muted">Reading transfer link…</p>
          ) : null}

          {status === 'error' ? (
            <>
              <p className="cc-body text-cc-danger">{error}</p>
              <p className="cc-caption">
                If the link was pasted through a chat app, it may have been truncated — use Export
                JSON / Import JSON in Settings instead.
              </p>
              <Button variant="secondary" onClick={() => finishDismiss(false)}>
                Dismiss
              </Button>
            </>
          ) : null}

          {status === 'ready' && json ? (
            <>
              <p className="cc-body text-cc-ink-secondary">
                Payload about {formatTransferSize(envelope.length)}. This will replace banks,
                offers, enrollments, and preferences on this browser.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={busy}
                  onClick={() => {
                    setBusy(true)
                    const result = importJson(json)
                    setBusy(false)
                    if (!result.ok) {
                      setError(result.error)
                      setStatus('error')
                      return
                    }
                    finishDismiss(true)
                  }}
                >
                  Restore
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => finishDismiss(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : null}
        </Surface>
      </div>
    </div>
  )
}
