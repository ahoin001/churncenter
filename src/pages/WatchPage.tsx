import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  EmptyState,
  Surface,
  StatusChip,
  TextField,
  TextAreaField,
  SelectField,
  BankSearchField,
  RevealText,
  Stagger,
  StaggerItem,
  AnimatedMoney,
  AccountConditionsEditor,
  DdFeasibilityBanner,
} from '@/components'
import { useChurnStore } from '@/data/store'
import { createId } from '@/lib/id'
import type {
  AccountConditions,
  OfferRequirementBlueprint,
  RequirementType,
  RequirementWindowAnchor,
} from '@/domain/types'
import { createDefaultAccountConditions } from '@/domain/fees'
import { formatShortDate } from '@/lib/format'
import { assessDdFeasibility, suggestOpenDate } from '@/domain/payProfile'

type DraftReq = {
  id: string
  type: RequirementType
  amount: string
  days: string
  windowDays: string
  windowAnchor: RequirementWindowAnchor
  label: string
}

function defaultLabel(type: RequirementType) {
  switch (type) {
    case 'direct_deposit':
      return 'Qualifying direct deposits'
    case 'spend':
      return 'Spend requirement'
    case 'balance_days':
      return 'Balance hold'
    case 'initial_fund':
      return 'Opening deposit'
    case 'wait':
      return 'Wait period'
    default:
      return 'Custom requirement'
  }
}

function emptyDraft(type: RequirementType = 'initial_fund'): DraftReq {
  return {
    id: createId('bp'),
    type,
    amount: type === 'balance_days' || type === 'initial_fund' ? '20000' : '500',
    days: type === 'balance_days' || type === 'wait' ? '45' : '',
    windowDays: type === 'initial_fund' || type === 'direct_deposit' || type === 'spend' ? '30' : '',
    windowAnchor: type === 'balance_days' || type === 'wait' ? 'after_previous' : 'open',
    label: defaultLabel(type),
  }
}

function draftToBlueprint(draft: DraftReq): OfferRequirementBlueprint {
  const amount = Number(draft.amount) || 0
  const days = Number(draft.days) || 0
  const windowDays = Number(draft.windowDays) || undefined
  const usesAmount =
    draft.type === 'direct_deposit' ||
    draft.type === 'spend' ||
    draft.type === 'initial_fund' ||
    draft.type === 'balance_days' ||
    draft.type === 'custom'
  const usesDays =
    draft.type === 'balance_days' || draft.type === 'wait' || draft.type === 'custom'

  return {
    id: draft.id,
    type: draft.type,
    label: draft.label.trim() || defaultLabel(draft.type),
    targetAmount: usesAmount && amount > 0 ? amount : undefined,
    targetDays: usesDays && days > 0 ? days : undefined,
    windowDays,
    windowAnchor: draft.windowAnchor,
    notes: '',
  }
}

export function WatchPage() {
  const data = useChurnStore()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)

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
        </div>
        <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Close' : 'Add offer'}
        </Button>
      </div>

      {showCreate ? <OfferCreateForm onDone={() => setShowCreate(false)} /> : null}

      {items.length === 0 ? (
        <EmptyState
          title="Watchlist is clear"
          body="Add an offer with its bonus, capital, expiry, and requirement windows — or load sample data from Settings to explore the flow."
          actionLabel="Add offer"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <Stagger as="ul" className="space-y-3" delayChildren={0.08}>
          {items.map(({ watch, offer, institution }) => (
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
                {watch.notes ? <p className="cc-body text-cc-ink-secondary">{watch.notes}</p> : null}
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
          ))}
        </Stagger>
      )}
    </div>
  )
}

function OfferCreateForm({ onDone }: { onDone: () => void }) {
  const data = useChurnStore()
  const [institutionId, setInstitutionId] = useState(data.institutions[0]?.id ?? '')
  const [bankError, setBankError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [bonus, setBonus] = useState('300')
  const [capital, setCapital] = useState('0')
  const [expiresAt, setExpiresAt] = useState('')
  const [reqs, setReqs] = useState<DraftReq[]>([emptyDraft('direct_deposit')])
  const [notes, setNotes] = useState('')
  const [accountConditions, setAccountConditions] = useState<AccountConditions>(
    createDefaultAccountConditions(),
  )

  const updateReq = (id: string, patch: Partial<DraftReq>) => {
    setReqs((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return (
    <Surface className="space-y-4" padding="lg">
      {data.institutions.length > 0 ? (
        <SelectField
          label="Bank"
          value={institutionId}
          onChange={(e) => {
            setInstitutionId(e.target.value)
            setBankError(null)
          }}
        >
          {data.institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </SelectField>
      ) : (
        <p className="cc-caption">Add a bank below to attach this offer.</p>
      )}

      <div className="space-y-2 rounded-cc-md bg-cc-bg-soft/60 p-3 ring-1 ring-cc-hairline">
        <p className="text-sm font-semibold text-cc-ink-secondary">Need another bank?</p>
        <BankSearchField
          compact
          owned={data.institutions}
          defaultCooldownMonths={data.preferences.defaultCooldownMonths}
          onAdd={(draft) => {
            const result = data.addInstitution(draft)
            if (!result.ok) {
              setBankError(result.error)
              return { ok: false, error: result.error }
            }
            setInstitutionId(result.id)
            setBankError(null)
            return { ok: true }
          }}
        />
        {bankError ? <p className="text-sm font-medium text-cc-danger">{bankError}</p> : null}
      </div>

      <TextField label="Offer title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField
          label="Bonus $"
          type="number"
          value={bonus}
          onChange={(e) => setBonus(e.target.value)}
        />
        <TextField
          label="Capital required $"
          type="number"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
        />
        <TextField
          label="Offer expires"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-cc-ink">Requirements</p>
            <p className="cc-caption">
              Order matters — “after prior step” starts when the previous requirement completes.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            type="button"
            onClick={() =>
              setReqs((list) => [
                ...list,
                emptyDraft(list.length === 0 ? 'initial_fund' : 'balance_days'),
              ])
            }
          >
            Add step
          </Button>
        </div>

        {reqs.map((req, index) => (
          <div
            key={req.id}
            className="space-y-3 rounded-cc-md bg-cc-bg-soft/60 p-3 ring-1 ring-cc-hairline"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-cc-ink-secondary">Step {index + 1}</p>
              {reqs.length > 1 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setReqs((list) => list.filter((r) => r.id !== req.id))}
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <TextField
              label="Label"
              value={req.label}
              onChange={(e) => updateReq(req.id, { label: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Type"
                value={req.type}
                onChange={(e) => {
                  const type = e.target.value as RequirementType
                  updateReq(req.id, {
                    type,
                    label: defaultLabel(type),
                    windowAnchor:
                      type === 'balance_days' || type === 'wait'
                        ? 'after_previous'
                        : 'open',
                  })
                }}
              >
                <option value="direct_deposit">Direct deposit</option>
                <option value="spend">Spend</option>
                <option value="balance_days">Balance days</option>
                <option value="initial_fund">Initial fund</option>
                <option value="wait">Wait</option>
                <option value="custom">Custom</option>
              </SelectField>
              <SelectField
                label="Window starts"
                value={req.windowAnchor}
                onChange={(e) =>
                  updateReq(req.id, {
                    windowAnchor: e.target.value as RequirementWindowAnchor,
                  })
                }
              >
                <option value="open">From account open</option>
                <option value="after_previous" disabled={index === 0}>
                  After prior step
                </option>
                <option value="absolute">Absolute date (set on enroll)</option>
              </SelectField>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField
                label={
                  req.type === 'balance_days' ? 'Min balance $' : 'Target amount $'
                }
                type="number"
                value={req.amount}
                onChange={(e) => updateReq(req.id, { amount: e.target.value })}
              />
              <TextField
                label="Hold / wait days"
                type="number"
                value={req.days}
                onChange={(e) => updateReq(req.id, { days: e.target.value })}
              />
              <TextField
                label="Complete within (days)"
                type="number"
                value={req.windowDays}
                onChange={(e) => updateReq(req.id, { windowDays: e.target.value })}
                placeholder={
                  req.type === 'balance_days' || req.type === 'wait'
                    ? 'Defaults to hold days'
                    : ''
                }
              />
            </div>
          </div>
        ))}
      </div>

      <TextAreaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className="space-y-3 rounded-cc-md bg-cc-bg-soft/60 p-3 ring-1 ring-cc-hairline">
        <div>
          <p className="text-sm font-semibold text-cc-ink">Account fees & conditions</p>
          <p className="cc-caption mt-1">
            Set these now so they carry into the enrollment when you chase the offer.
          </p>
        </div>
        <AccountConditionsEditor
          compact
          value={accountConditions}
          onChange={setAccountConditions}
        />
      </div>

      <Button
        onClick={() => {
          if (!institutionId) {
            setBankError('Add or select a bank first.')
            return
          }
          if (!title.trim()) return
          const blueprints = reqs.map(draftToBlueprint)
          const offerId = data.upsertOffer({
            institutionId,
            title: title.trim(),
            bonusAmount: Number(bonus) || 0,
            capitalRequired: Number(capital) || 0,
            expiresAt: expiresAt || null,
            url: '',
            regionNotes: '',
            effortScore: 3,
            requirements: blueprints,
            accountConditions,
          })
          data.addWatchlist(offerId, notes, expiresAt || null)
          onDone()
        }}
      >
        Save to watchlist
      </Button>
    </Surface>
  )
}
