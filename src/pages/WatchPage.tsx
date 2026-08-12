import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  EmptyState,
  Surface,
  StatusChip,
  TextField,
  TextAreaField,
  BankSearchField,
  RevealText,
  Stagger,
  StaggerItem,
  AnimatedMoney,
  AccountConditionsEditor,
  DdFeasibilityBanner,
} from '@/components'
import { useChurnStore } from '@/data/store'
import type { AccountConditions } from '@/domain/types'
import { createDefaultAccountConditions } from '@/domain/fees'
import { formatShortDate } from '@/lib/format'
import { assessDdFeasibility, suggestOpenDate } from '@/domain/payProfile'
import {
  DEAL_PATTERN_OPTIONS,
  buildRequirementsForPattern,
  defaultOfferTitle,
  previewCheckingActivity,
  previewSavingsFundHold,
  validateDealPattern,
  type DealPattern,
} from '@/domain/offerPresets'
import {
  assessCapitalFit,
  capitalFitMessage,
  selectLiquidAvailable,
} from '@/domain/capital'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'

export function WatchPage() {
  const data = useChurnStore()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const liquidAvailable = selectLiquidAvailable(data)

  const items = data.watchlist.map((w) => {
    const offer = data.offers.find((o) => o.id === w.offerId)
    const institution = offer
      ? data.institutions.find((i) => i.id === offer.institutionId)
      : undefined
    return { watch: w, offer, institution }
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <RevealText as="h1" className="cc-display">
            Watch
          </RevealText>
          <RevealText as="p" className="cc-body mt-2 text-cc-ink-secondary" delay={0.05}>
            Save interesting deals for later — enroll when the timing is right.
          </RevealText>
          {liquidAvailable !== null ? (
            <p className="cc-caption mt-2 text-cc-accent-ink">
              About {formatMoney(liquidAvailable)} free to park after active chases
            </p>
          ) : null}
        </div>
        <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Close' : 'Add offer'}
        </Button>
      </div>

      {showCreate ? <OfferCreateForm onDone={() => setShowCreate(false)} /> : null}

      {items.length === 0 && !showCreate ? (
        <EmptyState
          title="Watchlist is clear"
          body="Pick Savings or Checking, fill the required fields, and save. Notes and fees are optional. Sample data lives in Settings."
          actionLabel="Add offer"
          onAction={() => setShowCreate(true)}
        />
      ) : items.length === 0 ? null : (
        <Stagger as="ul" className="space-y-3" delayChildren={0.08}>
          {items.map(({ watch, offer, institution }) => {
            const fit = assessCapitalFit(liquidAvailable, offer?.capitalRequired ?? 0)
            const fitMsg = capitalFitMessage(
              fit,
              liquidAvailable,
              offer?.capitalRequired ?? 0,
            )
            return (
            <StaggerItem key={watch.id} as="li">
              <Surface className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{institution?.name ?? 'Bank'}</p>
                    <p className="cc-caption">{offer?.title ?? 'Offer removed'}</p>
                    {offer?.expiresAt ? (
                      <p className="cc-caption mt-1">
                        Expires {formatShortDate(offer.expiresAt)}
                      </p>
                    ) : null}
                  </div>
                  {offer ? (
                    <span className="inline-flex items-center rounded-cc-full bg-cc-accent-soft px-2.5 py-1 text-xs font-semibold text-cc-accent-ink">
                      <AnimatedMoney value={offer.bonusAmount} />
                    </span>
                  ) : (
                    <StatusChip label="—" tone="neutral" />
                  )}
                </div>
                {fitMsg ? (
                  <p className="rounded-cc-md bg-cc-warn-soft px-3 py-2 text-sm text-cc-ink-secondary">
                    {fitMsg}
                  </p>
                ) : null}
                {offer && offer.requirements.length > 0 ? (
                  <ul className="space-y-1">
                    {offer.requirements.map((r) => (
                      <li key={r.id} className="cc-caption text-cc-ink-secondary">
                        {r.label}
                        {r.windowAnchor === 'open' && r.windowDays
                          ? ` · within ${r.windowDays}d of open`
                          : null}
                        {r.windowAnchor === 'after_previous'
                          ? r.targetDays
                            ? ` · ${r.targetDays}d after prior step`
                            : ' · after prior step'
                          : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {offer?.termsNotes || watch.notes ? (
                  <p className="cc-caption text-cc-ink-secondary line-clamp-3">
                    {offer?.termsNotes || watch.notes}
                  </p>
                ) : null}
                {offer
                  ? (() => {
                      const dd = offer.requirements.find(
                        (r) =>
                          r.type === 'direct_deposit' &&
                          (r.targetAmount ?? 0) > 0 &&
                          (r.windowDays ?? 0) > 0,
                      )
                      if (!dd) return null
                      const target = dd.targetAmount ?? 0
                      const windowDays = dd.windowDays ?? 0
                      const feasibility = assessDdFeasibility(data.preferences, {
                        type: 'direct_deposit',
                        targetAmount: target,
                        currentAmount: 0,
                        windowDays,
                        startsAt: null,
                        deadlineAt: null,
                      })
                      const suggestion = suggestOpenDate(
                        data.preferences,
                        target,
                        windowDays,
                      )
                      return (
                        <DdFeasibilityBanner
                          feasibility={feasibility}
                          suggestion={suggestion}
                        />
                      )
                    })()
                  : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={!offer}
                    onClick={() => {
                      if (!offer) return
                      const id = data.enrollFromOffer(offer.id)
                      if (id) navigate(`/active/${id}`)
                    }}
                  >
                    Enroll
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => data.removeWatchlist(watch.id)}
                  >
                    Remove
                  </Button>
                </div>
              </Surface>
            </StaggerItem>
            )
          })}
        </Stagger>
      )}
    </div>
  )
}

function DealPatternPicker({
  value,
  onChange,
}: {
  value: DealPattern
  onChange: (pattern: DealPattern) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-cc-ink">Deal pattern</p>
      <div
        role="radiogroup"
        aria-label="Deal pattern"
        className="grid grid-cols-3 gap-1 rounded-cc-full bg-cc-bg-soft p-1 ring-1 ring-cc-hairline"
      >
        {DEAL_PATTERN_OPTIONS.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cn(
                'rounded-cc-full px-2 py-2 text-sm font-semibold transition-colors',
                selected
                  ? 'bg-cc-surface text-cc-ink shadow-cc-surface'
                  : 'text-cc-muted hover:text-cc-ink',
              )}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <p className="cc-caption">
        {DEAL_PATTERN_OPTIONS.find((o) => o.value === value)?.hint}
      </p>
    </div>
  )
}

function OfferCreateForm({ onDone }: { onDone: () => void }) {
  const data = useChurnStore()
  const [institutionId, setInstitutionId] = useState(data.institutions[0]?.id ?? '')
  const [bankError, setBankError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [bonus, setBonus] = useState('300')
  const [capital, setCapital] = useState('0')
  const [capitalTouched, setCapitalTouched] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [pattern, setPattern] = useState<DealPattern>('savings_fund_hold')
  const [fundAmount, setFundAmount] = useState('20000')
  const [fundWithinDays, setFundWithinDays] = useState('30')
  const [holdDays, setHoldDays] = useState('45')
  const [ddAmount, setDdAmount] = useState('500')
  const [ddDays, setDdDays] = useState('90')
  const [spendAmount, setSpendAmount] = useState('0')
  const [spendDays, setSpendDays] = useState('90')
  const [notes, setNotes] = useState('')
  const [accountConditions, setAccountConditions] = useState<AccountConditions>(
    createDefaultAccountConditions(),
  )

  const savings = {
    amount: Number(fundAmount) || 0,
    fundWithinDays: Number(fundWithinDays) || 0,
    holdDays: Number(holdDays) || 0,
  }
  const checking = {
    ddAmount: Number(ddAmount) || 0,
    ddDays: Number(ddDays) || 0,
    spendAmount: Number(spendAmount) || 0,
    spendDays: Number(spendDays) || 0,
  }

  useEffect(() => {
    if (pattern !== 'savings_fund_hold' || capitalTouched) return
    if (savings.amount > 0) setCapital(String(savings.amount))
  }, [pattern, savings.amount, capitalTouched])

  const bankName =
    data.institutions.find((i) => i.id === institutionId)?.name ?? 'Bank'
  const autoTitle = defaultOfferTitle(bankName, pattern)
  const capitalRequired = Number(capital) || 0
  const liquidAvailable = selectLiquidAvailable(data)
  const fit = assessCapitalFit(liquidAvailable, capitalRequired)
  const fitMsg = capitalFitMessage(fit, liquidAvailable, capitalRequired)

  const preview =
    pattern === 'savings_fund_hold'
      ? previewSavingsFundHold(savings)
      : pattern === 'checking_activity'
        ? previewCheckingActivity(checking)
        : 'Track with notes — no typed progress bars.'

  return (
    <Surface className="space-y-5" padding="lg">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-cc-ink">Required</p>
          <p className="cc-caption">Bank, pattern, and bonus — enough to start tracking.</p>
        </div>

        <BankSearchField
          compact
          label="Bank"
          owned={data.institutions}
          selectedId={institutionId || null}
          defaultCooldownMonths={data.preferences.defaultCooldownMonths}
          onSelect={(id) => {
            setInstitutionId(id)
            setBankError(null)
          }}
          onAdd={(draft) => {
            const result = data.addInstitution(draft)
            if (!result.ok) {
              setBankError(result.error)
              return { ok: false, error: result.error }
            }
            setInstitutionId(result.id)
            setBankError(null)
            return { ok: true, id: result.id }
          }}
        />
        {bankError ? <p className="text-sm font-medium text-cc-danger">{bankError}</p> : null}

        <DealPatternPicker
          value={pattern}
          onChange={(next) => {
            setPattern(next)
            setFormError(null)
            if (next === 'checking_activity') {
              setBonus((b) => (b === '500' || b === '20000' ? '300' : b))
            }
          }}
        />

        {pattern === 'savings_fund_hold' ? (
          <div className="space-y-3 rounded-cc-md bg-cc-bg-soft/60 p-3 ring-1 ring-cc-hairline">
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField
                label="Fund / hold amount $"
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
              />
              <TextField
                label="Fund within (days of open)"
                type="number"
                value={fundWithinDays}
                onChange={(e) => setFundWithinDays(e.target.value)}
              />
              <TextField
                label="Then hold for (days)"
                type="number"
                value={holdDays}
                onChange={(e) => setHoldDays(e.target.value)}
              />
            </div>
            <p className="text-sm font-medium text-cc-accent-ink">{preview}</p>
          </div>
        ) : null}

        {pattern === 'checking_activity' ? (
          <div className="space-y-3 rounded-cc-md bg-cc-bg-soft/60 p-3 ring-1 ring-cc-hairline">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Direct deposit $"
                type="number"
                value={ddAmount}
                onChange={(e) => setDdAmount(e.target.value)}
              />
              <TextField
                label="DD within days of open"
                type="number"
                value={ddDays}
                onChange={(e) => setDdDays(e.target.value)}
              />
              <TextField
                label="Debit spend $ (or 0)"
                type="number"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
              />
              <TextField
                label="Spend within days of open"
                type="number"
                value={spendDays}
                onChange={(e) => setSpendDays(e.target.value)}
              />
            </div>
            <p className="text-sm font-medium text-cc-accent-ink">{preview}</p>
          </div>
        ) : null}

        {pattern === 'simple_notes' ? (
          <p className="cc-caption rounded-cc-md bg-cc-bg-soft/60 p-3 ring-1 ring-cc-hairline">
            {preview}
          </p>
        ) : null}

        <TextField
          label="Bonus $"
          type="number"
          value={bonus}
          onChange={(e) => setBonus(e.target.value)}
        />
        <p className="cc-caption">Saves as “{autoTitle}”.</p>
      </div>

      <div className="space-y-4 border-t border-cc-hairline pt-5">
        <div>
          <p className="text-sm font-semibold text-cc-ink">Optional</p>
          <p className="cc-caption">Nice to have — skip anything you do not know yet.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Capital to park $"
            type="number"
            value={capital}
            onChange={(e) => {
              setCapitalTouched(true)
              setCapital(e.target.value)
            }}
          />
          <TextField
            label="Offer expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
        {fitMsg ? (
          <p className="rounded-cc-md bg-cc-bg-soft px-3 py-2 text-sm text-cc-ink-secondary ring-1 ring-cc-hairline">
            {fitMsg}
          </p>
        ) : liquidAvailable !== null && capitalRequired > 0 && fit === 'ok' ? (
          <p className="cc-caption text-cc-accent-ink">
            Fits your ~{formatMoney(liquidAvailable)} free capital.
          </p>
        ) : null}

        <TextAreaField
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Terms quirks, timing reminders, new-money rules…"
        />

        <div className="space-y-3 rounded-cc-md bg-cc-bg-soft/60 p-3 ring-1 ring-cc-hairline">
          <div>
            <p className="text-sm font-semibold text-cc-ink">Account fees & conditions</p>
            <p className="cc-caption mt-1">Carries into the enrollment when you chase.</p>
          </div>
          <AccountConditionsEditor
            compact
            value={accountConditions}
            onChange={setAccountConditions}
          />
        </div>
      </div>

      {formError ? <p className="text-sm font-medium text-cc-danger">{formError}</p> : null}

      <Button
        onClick={() => {
          if (!institutionId) {
            setBankError('Add or select a bank first.')
            return
          }
          const validation = validateDealPattern(pattern, {
            savings,
            checking,
          })
          if (validation) {
            setFormError(validation)
            return
          }
          if (!(Number(bonus) > 0) && pattern === 'simple_notes' && !notes.trim()) {
            setFormError('Add a bonus amount or a short note.')
            return
          }
          const requirements = buildRequirementsForPattern(pattern, { savings, checking })
          const offerId = data.upsertOffer({
            institutionId,
            title: autoTitle,
            bonusAmount: Number(bonus) || 0,
            capitalRequired,
            expiresAt: expiresAt || null,
            url: '',
            regionNotes: '',
            termsNotes: notes.trim(),
            effortScore: 3,
            requirements,
            accountConditions,
          })
          data.addWatchlist(offerId, '', expiresAt || null)
          onDone()
        }}
      >
        Save to watchlist
      </Button>
    </Surface>
  )
}
