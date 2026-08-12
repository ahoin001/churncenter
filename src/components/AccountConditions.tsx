import type { AccountConditions, FeeWaiverAction, MonthlyFeeKind, OpeningDepositKind } from '@/domain/types'
import {
  COMMON_MIN_BALANCE_AMOUNTS,
  COMMON_MONTHLY_FEE_AMOUNTS,
  COMMON_OPENING_DEPOSIT_AMOUNTS,
  FEE_WAIVER_OPTIONS,
  MONTHLY_FEE_OPTIONS,
  OPENING_DEPOSIT_OPTIONS,
} from '@/domain/fees'
import { SelectField, TextField, TextAreaField } from './Field'
import { StatusChip } from './StatusChip'
import { assessFeeRisk } from '@/domain/fees'
import { cn } from '@/lib/cn'

type AccountConditionsEditorProps = {
  value: AccountConditions
  onChange: (next: AccountConditions) => void
  className?: string
  compact?: boolean
}

function AmountSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: number
  options: number[]
  onChange: (value: number) => void
}) {
  const preset = options.includes(value) ? String(value) : 'custom'
  return (
    <div className="space-y-2">
      <SelectField
        label={label}
        value={preset}
        onChange={(e) => {
          if (e.target.value === 'custom') return
          onChange(Number(e.target.value))
        }}
      >
        {options.map((amount) => (
          <option key={amount} value={amount}>
            {amount === 0 ? '$0' : `$${amount.toLocaleString('en-US')}`}
          </option>
        ))}
        <option value="custom">Custom…</option>
      </SelectField>
      {preset === 'custom' ? (
        <TextField
          label={`${label} (custom $)`}
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
        />
      ) : null}
    </div>
  )
}

export function AccountConditionsEditor({
  value,
  onChange,
  className,
  compact = false,
}: AccountConditionsEditorProps) {
  const patch = (partial: Partial<AccountConditions>) => onChange({ ...value, ...partial })
  const showWaiver =
    value.monthlyFeeKind === 'waivable' || value.monthlyFeeKind === 'flat_monthly'
  const showOpeningAmount =
    value.openingDepositKind === 'required' || value.openingDepositKind === 'recommended'
  const showMonthlyAmount =
    value.monthlyFeeKind === 'flat_monthly' || value.monthlyFeeKind === 'waivable'

  return (
    <div className={cn('space-y-4', className)}>
      <div className={cn('grid gap-3', compact ? 'sm:grid-cols-1' : 'sm:grid-cols-2')}>
        <SelectField
          label="Opening deposit"
          value={value.openingDepositKind}
          onChange={(e) =>
            patch({ openingDepositKind: e.target.value as OpeningDepositKind })
          }
        >
          {OPENING_DEPOSIT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Monthly fee"
          value={value.monthlyFeeKind}
          onChange={(e) => {
            const monthlyFeeKind = e.target.value as MonthlyFeeKind
            patch({
              monthlyFeeKind,
              waiverAction:
                monthlyFeeKind === 'none' || monthlyFeeKind === 'unknown'
                  ? 'none'
                  : value.waiverAction,
              waiverSatisfied:
                monthlyFeeKind === 'none' ? true : value.waiverSatisfied,
            })
          }}
        >
          {MONTHLY_FEE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
      </div>

      {showOpeningAmount ? (
        <AmountSelect
          label="Opening deposit amount"
          value={value.openingDepositAmount}
          options={COMMON_OPENING_DEPOSIT_AMOUNTS}
          onChange={(openingDepositAmount) => patch({ openingDepositAmount })}
        />
      ) : null}

      {showMonthlyAmount ? (
        <AmountSelect
          label="Monthly fee amount"
          value={value.monthlyFeeAmount}
          options={COMMON_MONTHLY_FEE_AMOUNTS}
          onChange={(monthlyFeeAmount) => patch({ monthlyFeeAmount })}
        />
      ) : null}

      {value.monthlyFeeKind === 'waivable' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="How to waive the fee"
            value={value.waiverAction}
            onChange={(e) => patch({ waiverAction: e.target.value as FeeWaiverAction })}
          >
            {FEE_WAIVER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Waiver status this cycle"
            value={value.waiverSatisfied ? 'met' : 'open'}
            onChange={(e) => patch({ waiverSatisfied: e.target.value === 'met' })}
          >
            <option value="open">Not met yet — watch for fees</option>
            <option value="met">Met — fee should be waived</option>
          </SelectField>
        </div>
      ) : null}

      {showWaiver &&
      (value.waiverAction === 'min_balance' ||
        value.waiverAction === 'min_balance_or_dd' ||
        value.waiverAction === 'combined_balances') ? (
        <AmountSelect
          label="Minimum balance to avoid fee"
          value={value.minBalanceToAvoidFee}
          options={COMMON_MIN_BALANCE_AMOUNTS}
          onChange={(minBalanceToAvoidFee) => patch({ minBalanceToAvoidFee })}
        />
      ) : null}

      {value.monthlyFeeKind === 'waivable' ? (
        <TextField
          label="Waiver details"
          placeholder="e.g. $500 direct deposit, or 10 debit purchases"
          value={value.waiverDetail}
          onChange={(e) => patch({ waiverDetail: e.target.value })}
        />
      ) : null}

      <TextAreaField
        label="Other fee notes"
        placeholder="ATM fees, paper statement fees, inactivity, early close…"
        value={value.otherFeeNotes}
        onChange={(e) => patch({ otherFeeNotes: e.target.value })}
      />
    </div>
  )
}

export function FeeGlanceChips({
  conditions,
  className,
}: {
  conditions: AccountConditions | undefined
  className?: string
}) {
  const risk = assessFeeRisk(conditions)
  if (risk.chips.length === 0) return null
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {risk.chips.map((chip) => (
        <StatusChip key={chip.label} label={chip.label} tone={chip.tone} />
      ))}
    </div>
  )
}

export function FeeRiskBanner({
  conditions,
}: {
  conditions: AccountConditions | undefined
}) {
  const risk = assessFeeRisk(conditions)
  if (risk.level === 'clear') return null

  const toneClass =
    risk.level === 'risk'
      ? 'bg-cc-danger-soft text-cc-danger'
      : risk.level === 'watch'
        ? 'bg-cc-warn-soft text-cc-warn'
        : 'bg-cc-bg-soft text-cc-ink-secondary'

  return (
    <div className={cn('rounded-cc-md px-4 py-3 text-sm font-medium', toneClass)}>
      {risk.summary}
    </div>
  )
}
