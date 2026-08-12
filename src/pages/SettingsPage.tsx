import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Surface,
  TextField,
  ThemeSegmented,
  RevealText,
  Stagger,
  StaggerItem,
} from '@/components'
import { useChurnStore } from '@/data/store'
import type { ThemeMode } from '@/lib/theme'
import {
  buildTransferUrl,
  encodeTransferPayload,
  formatTransferSize,
} from '@/data/transfer'

export function SettingsPage() {
  const data = useChurnStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <RevealText as="h1" className="cc-display">
          Settings
        </RevealText>
        <RevealText as="p" className="cc-body mt-2 text-cc-ink-secondary" delay={0.05}>
          Local-first controls. Your ledger lives on this device.
        </RevealText>
      </div>

      <Stagger className="space-y-6" delayChildren={0.08}>
        <StaggerItem>
          <Surface className="space-y-4" padding="lg">
            <h2 className="cc-title">Appearance</h2>
            <p className="cc-caption">Clearwater night desk stays soft — no neon cockpit.</p>
            <ThemeSegmented
              value={data.preferences.themeMode}
              onChange={(mode: ThemeMode) => data.setPreference('themeMode', mode)}
            />
          </Surface>
        </StaggerItem>

        <StaggerItem>
          <Surface className="space-y-4" padding="lg">
            <h2 className="cc-title">Preferences</h2>
            <p className="cc-caption">
              Pay schedule lives on{' '}
              <Link className="font-semibold text-cc-accent-ink" to="/profile">
                Profile
              </Link>
              . Liquid cash below helps Watch soft-check savings offers.
            </p>
            <TextField
              label="Cash available to park ($)"
              type="number"
              min={0}
              step={100}
              value={data.preferences.liquidCapital || ''}
              placeholder="50000"
              onChange={(e) =>
                data.setPreference(
                  'liquidCapital',
                  Math.max(0, Number(e.target.value) || 0),
                )
              }
            />
            <p className="cc-caption">
              Total liquid money you could put into bonuses. We subtract capital already locked
              in active chases and nudge (never block) when a new offer needs more.
            </p>
            <TextField
              label="Default cooldown (months)"
              type="number"
              value={data.preferences.defaultCooldownMonths}
              onChange={(e) =>
                data.setPreference('defaultCooldownMonths', Number(e.target.value) || 12)
              }
            />
            <TextField
              label="Reminder lead days"
              type="number"
              value={data.preferences.reminderLeadDays}
              onChange={(e) =>
                data.setPreference('reminderLeadDays', Number(e.target.value) || 7)
              }
            />
            <TextField
              label="Default clawback (days after bonus)"
              type="number"
              value={data.preferences.defaultClawbackDays}
              onChange={(e) =>
                data.setPreference('defaultClawbackDays', Number(e.target.value) || 90)
              }
            />
          </Surface>
        </StaggerItem>

        <StaggerItem>
          <Surface className="space-y-4" padding="lg">
            <h2 className="cc-title">Move to another device</h2>
            <p className="cc-body text-cc-ink-secondary">
              No account. Copy a transfer link for a typical ledger, or use a JSON file when the
              link would be too large (attachments, long notes). Opening a link asks before
              replacing data on the other device.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={async () => {
                  setMessage(null)
                  const json = data.exportJson()
                  const encoded = await encodeTransferPayload(json)
                  if (!encoded.ok) {
                    if (encoded.reason === 'too_large') {
                      setMessage(
                        `Ledger too large for a link (${formatTransferSize(encoded.charLength ?? 0)}). Export JSON instead.`,
                      )
                      return
                    }
                    setMessage(encoded.detail ?? 'Could not build transfer link.')
                    return
                  }
                  const base = import.meta.env.BASE_URL || '/'
                  const url = buildTransferUrl(window.location.origin, base, encoded.envelope)
                  try {
                    await navigator.clipboard.writeText(url)
                    setMessage(
                      `Transfer link copied (${formatTransferSize(encoded.charLength)}${encoded.compressed ? ', compressed' : ''}). Open it on the other device.`,
                    )
                  } catch {
                    setMessage('Clipboard blocked — export JSON instead, or copy from the address bar after pasting manually.')
                    window.prompt('Copy this transfer link:', url)
                  }
                }}
              >
                Copy transfer link
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const json = data.exportJson()
                  const blob = new Blob([json], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `churncenter-backup-${new Date().toISOString().slice(0, 10)}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                  setMessage('Backup downloaded')
                }}
              >
                Export JSON
              </Button>
              <Button variant="ghost" onClick={() => fileRef.current?.click()}>
                Import JSON
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  const result = data.importJson(text)
                  setMessage(result.ok ? 'Import complete' : result.error)
                  e.target.value = ''
                }}
              />
            </div>
            {message ? <p className="cc-caption text-cc-accent-ink">{message}</p> : null}
          </Surface>
        </StaggerItem>

        <StaggerItem>
          <Surface className="space-y-4" padding="lg">
            <h2 className="cc-title">Demo data</h2>
            <p className="cc-body text-cc-ink-secondary">
              Optional sample ledger with Chase, Ally, Capital One, and an E*TRADE-style savings
              bonus — useful to explore Today, Active, and requirement windows before you enter
              real offers. Remove it anytime; your preferences stay put.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  data.loadDemo()
                  setMessage('Demo data loaded')
                }}
              >
                Load demo data
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (
                    confirm(
                      'Remove demo / chase data? Banks, offers, enrollments, and activity will be cleared. Preferences stay.',
                    )
                  ) {
                    data.clearDemoData()
                    setMessage('Demo data removed')
                  }
                }}
              >
                Remove demo data
              </Button>
            </div>
          </Surface>
        </StaggerItem>

        <StaggerItem>
          <Surface className="space-y-4" padding="lg">
            <h2 className="cc-title">Reset</h2>
            <p className="cc-caption">
              Full wipe clears preferences too. Export a backup first if you might want it back.
            </p>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm('Clear all local ChurnCenter data, including preferences?')) {
                  data.resetAll()
                  setMessage('All local data reset')
                }
              }}
            >
              Reset all data
            </Button>
          </Surface>
        </StaggerItem>

        <StaggerItem>
          <Surface padding="lg">
            <p className="cc-caption">
              Design system gallery:{' '}
              <Link className="font-semibold text-cc-accent-ink" to="/dev/ui">
                /dev/ui
              </Link>
            </p>
          </Surface>
        </StaggerItem>
      </Stagger>
    </div>
  )
}
