import { Link } from 'react-router-dom'
import {
  Surface,
  TextField,
  SelectField,
  RevealText,
  Stagger,
  StaggerItem,
} from '@/components'
import { useChurnStore } from '@/data/store'
import type { PayFrequency } from '@/domain/types'
import { describePayProfile, isPayProfileReady } from '@/domain/payProfile'

export function ProfilePage() {
  const data = useChurnStore()
  const prefs = data.preferences
  const ready = isPayProfileReady(prefs)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <RevealText as="h1" className="cc-display">
          Profile
        </RevealText>
        <RevealText as="p" className="cc-body mt-2 text-cc-ink-secondary" delay={0.05}>
          Your pay rhythm helps us check whether a direct-deposit window can actually fit —
          using your real payroll timing, not workarounds.
        </RevealText>
      </div>

      <Stagger className="space-y-6" delayChildren={0.08}>
        <StaggerItem>
          <Surface className="space-y-4" padding="lg">
            <h2 className="cc-title">Direct deposit schedule</h2>
            {!ready ? (
              <p className="cc-body text-cc-ink-secondary">
                Set this so we can check DD windows before you open — and suggest a start date
                that catches your first paycheck early.
              </p>
            ) : (
              <p className="cc-body text-cc-accent-ink">{describePayProfile(prefs)}</p>
            )}

            <TextField
              label="Typical net DD amount ($)"
              type="number"
              min={0}
              step={50}
              value={prefs.payNetAmount || ''}
              placeholder="1200"
              onChange={(e) =>
                data.setPreference('payNetAmount', Math.max(0, Number(e.target.value) || 0))
              }
            />
            <SelectField
              label="Pay frequency"
              value={prefs.payFrequency}
              onChange={(e) =>
                data.setPreference('payFrequency', e.target.value as PayFrequency)
              }
            >
              <option value="unknown">Not sure yet</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly (every 2 weeks)</option>
              <option value="semimonthly">Semimonthly (twice a month)</option>
              <option value="monthly">Monthly</option>
            </SelectField>
            <TextField
              label="Next payday"
              type="date"
              value={prefs.nextPayday ?? ''}
              onChange={(e) =>
                data.setPreference('nextPayday', e.target.value ? e.target.value : null)
              }
            />
            <p className="cc-caption">
              Use the amount that usually counts as a qualifying payroll deposit for bonuses you
              chase. Update next payday after each check lands.
            </p>
          </Surface>
        </StaggerItem>

        <StaggerItem>
          <Surface padding="lg">
            <p className="cc-caption">
              Theme, cooldowns, and backups stay in{' '}
              <Link className="font-semibold text-cc-accent-ink" to="/settings">
                Settings
              </Link>
              .
            </p>
          </Surface>
        </StaggerItem>
      </Stagger>
    </div>
  )
}
