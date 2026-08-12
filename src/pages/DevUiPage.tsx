import {
  Button,
  Chip,
  Surface,
  StatusChip,
  TideGauge,
  EmptyState,
  ThemeSegmented,
} from '@/components'
import { Sparkle } from '@phosphor-icons/react'
import { useChurnStore } from '@/data/store'

/** Internal Clearwater component gallery */
export function DevUiPage() {
  const themeMode = useChurnStore((s) => s.preferences.themeMode)
  const setPreference = useChurnStore((s) => s.setPreference)

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="cc-display">UI gallery</h1>
        <p className="cc-body mt-2 text-cc-ink-secondary">
          Clearwater primitives — tune tokens and motion catalog, not one-off styles.
        </p>
      </div>

      <Surface className="space-y-4" padding="lg">
        <h2 className="cc-title">Theme</h2>
        <ThemeSegmented
          value={themeMode}
          onChange={(mode) => setPreference('themeMode', mode)}
        />
      </Surface>

      <Surface className="space-y-4" padding="lg">
        <h2 className="cc-title">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </Surface>

      <Surface className="space-y-4" padding="lg">
        <h2 className="cc-title">Chips & status</h2>
        <div className="flex flex-wrap gap-2">
          <Chip selected>Selected</Chip>
          <Chip>Idle</Chip>
          <StatusChip label="Meeting reqs" tone="accent" />
          <StatusChip label="Hold open" tone="warn" />
          <StatusChip label="Complete" tone="success" />
        </div>
      </Surface>

      <Surface className="space-y-4" padding="lg">
        <h2 className="cc-title">Tide gauge</h2>
        <TideGauge value={0.64} label="Direct deposit · $180 left" />
        <TideGauge value={1} label="Spend met" celebrate />
      </Surface>

      <EmptyState
        icon={<Sparkle size={22} weight="light" />}
        title="Empty states stay soft"
        body="No harsh voids — teach the next action with calm copy."
        actionLabel="Got it"
        onAction={() => undefined}
      />
    </div>
  )
}
