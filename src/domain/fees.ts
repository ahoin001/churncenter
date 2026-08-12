import type { AccountConditions } from './types'

export const OPENING_DEPOSIT_OPTIONS = [
  { value: 'unknown', label: 'Not sure yet' },
  { value: 'none', label: 'No opening deposit' },
  { value: 'recommended', label: 'Recommended (not required)' },
  { value: 'required', label: 'Required opening deposit' },
] as const

export const MONTHLY_FEE_OPTIONS = [
  { value: 'unknown', label: 'Not sure yet' },
  { value: 'none', label: 'No monthly fee' },
  { value: 'flat_monthly', label: 'Flat monthly fee (not waivable)' },
  { value: 'waivable', label: 'Monthly fee — waivable' },
] as const

export const FEE_WAIVER_OPTIONS = [
  { value: 'none', label: 'No waiver needed' },
  { value: 'direct_deposit', label: 'Direct deposit each statement cycle' },
  { value: 'min_balance', label: 'Keep a minimum balance' },
  { value: 'min_balance_or_dd', label: 'Min balance OR direct deposit' },
  { value: 'debit_transactions', label: 'Debit card transactions / spend' },
  { value: 'paperless_statements', label: 'Paperless statements / e-statements' },
  { value: 'age_student_military', label: 'Age / student / military waiver' },
  { value: 'linked_account', label: 'Link another account at same bank' },
  { value: 'combined_balances', label: 'Combined relationship balances' },
  { value: 'bill_pay', label: 'Bill pay / automatic payments' },
  { value: 'other', label: 'Other (see notes)' },
] as const

export const COMMON_OPENING_DEPOSIT_AMOUNTS = [0, 25, 50, 100, 200, 250, 500, 1000, 1500, 2500]

export const COMMON_MONTHLY_FEE_AMOUNTS = [0, 5, 10, 12, 15, 25, 35]

export const COMMON_MIN_BALANCE_AMOUNTS = [0, 100, 300, 500, 1000, 1500, 2500, 5000, 10000]

export function createDefaultAccountConditions(): AccountConditions {
  return {
    openingDepositKind: 'unknown',
    openingDepositAmount: 0,
    monthlyFeeKind: 'unknown',
    monthlyFeeAmount: 0,
    waiverAction: 'none',
    waiverDetail: '',
    minBalanceToAvoidFee: 0,
    waiverSatisfied: false,
    otherFeeNotes: '',
  }
}

export function normalizeAccountConditions(
  value: unknown,
): AccountConditions {
  const base = createDefaultAccountConditions()
  if (!value || typeof value !== 'object') return base
  const raw = value as Partial<AccountConditions>
  return {
    openingDepositKind: isOpeningDepositKind(raw.openingDepositKind)
      ? raw.openingDepositKind
      : base.openingDepositKind,
    openingDepositAmount: numberOr(raw.openingDepositAmount, 0),
    monthlyFeeKind: isMonthlyFeeKind(raw.monthlyFeeKind)
      ? raw.monthlyFeeKind
      : base.monthlyFeeKind,
    monthlyFeeAmount: numberOr(raw.monthlyFeeAmount, 0),
    waiverAction: isFeeWaiverAction(raw.waiverAction) ? raw.waiverAction : base.waiverAction,
    waiverDetail: typeof raw.waiverDetail === 'string' ? raw.waiverDetail : '',
    minBalanceToAvoidFee: numberOr(raw.minBalanceToAvoidFee, 0),
    waiverSatisfied: Boolean(raw.waiverSatisfied),
    otherFeeNotes: typeof raw.otherFeeNotes === 'string' ? raw.otherFeeNotes : '',
  }
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function isOpeningDepositKind(
  value: unknown,
): value is AccountConditions['openingDepositKind'] {
  return OPENING_DEPOSIT_OPTIONS.some((o) => o.value === value)
}

function isMonthlyFeeKind(value: unknown): value is AccountConditions['monthlyFeeKind'] {
  return MONTHLY_FEE_OPTIONS.some((o) => o.value === value)
}

function isFeeWaiverAction(value: unknown): value is AccountConditions['waiverAction'] {
  return FEE_WAIVER_OPTIONS.some((o) => o.value === value)
}

export type FeeRisk = {
  level: 'clear' | 'watch' | 'risk' | 'unknown'
  chips: Array<{ label: string; tone: 'neutral' | 'accent' | 'success' | 'warn' | 'danger' }>
  summary: string
}

/** Glanceable fee risk for active enrollments. */
export function assessFeeRisk(conditions: AccountConditions | undefined): FeeRisk {
  const c = conditions ?? createDefaultAccountConditions()
  const chips: FeeRisk['chips'] = []

  if (c.openingDepositKind === 'required') {
    chips.push({
      label:
        c.openingDepositAmount > 0
          ? `Open $${c.openingDepositAmount}`
          : 'Opening deposit',
      tone: 'warn',
    })
  } else if (c.openingDepositKind === 'none') {
    chips.push({ label: 'No open deposit', tone: 'success' })
  } else if (c.openingDepositKind === 'recommended') {
    chips.push({
      label:
        c.openingDepositAmount > 0
          ? `Rec. $${c.openingDepositAmount}`
          : 'Deposit recommended',
      tone: 'accent',
    })
  }

  if (c.monthlyFeeKind === 'none') {
    chips.push({ label: 'No monthly fee', tone: 'success' })
  } else if (c.monthlyFeeKind === 'flat_monthly') {
    chips.push({
      label: c.monthlyFeeAmount > 0 ? `$${c.monthlyFeeAmount}/mo fee` : 'Monthly fee',
      tone: 'danger',
    })
  } else if (c.monthlyFeeKind === 'waivable') {
    if (c.waiverSatisfied) {
      chips.push({
        label: c.monthlyFeeAmount > 0 ? `$${c.monthlyFeeAmount}/mo waived` : 'Fee waived',
        tone: 'success',
      })
    } else {
      const waiver = FEE_WAIVER_OPTIONS.find((o) => o.value === c.waiverAction)
      chips.push({
        label:
          c.monthlyFeeAmount > 0
            ? `$${c.monthlyFeeAmount}/mo — waive`
            : 'Waive monthly fee',
        tone: 'warn',
      })
      if (waiver && waiver.value !== 'none') {
        chips.push({ label: shortWaiverLabel(waiver.value), tone: 'accent' })
      }
      if (c.minBalanceToAvoidFee > 0) {
        chips.push({ label: `Min $${c.minBalanceToAvoidFee}`, tone: 'accent' })
      }
    }
  } else {
    chips.push({ label: 'Fees unknown', tone: 'neutral' })
  }

  let level: FeeRisk['level'] = 'unknown'
  let summary = 'Set account fee conditions so you do not leak money while chasing the bonus.'

  if (c.monthlyFeeKind === 'flat_monthly') {
    level = 'risk'
    summary = 'This account has a flat monthly fee — factor it into net bonus math.'
  } else if (c.monthlyFeeKind === 'waivable' && !c.waiverSatisfied) {
    level = 'watch'
    summary = 'Monthly fee is waivable — complete the waiver action each cycle.'
  } else if (
    c.monthlyFeeKind === 'none' ||
    (c.monthlyFeeKind === 'waivable' && c.waiverSatisfied)
  ) {
    level = 'clear'
    summary =
      c.openingDepositKind === 'required'
        ? 'Fees look manageable — still fund the required opening deposit.'
        : 'No active monthly fee drag on this chase.'
  } else if (c.monthlyFeeKind === 'unknown' || c.openingDepositKind === 'unknown') {
    level = 'unknown'
  }

  return { level, chips, summary }
}

function shortWaiverLabel(action: AccountConditions['waiverAction']): string {
  switch (action) {
    case 'direct_deposit':
      return 'Needs DD'
    case 'min_balance':
      return 'Needs balance'
    case 'min_balance_or_dd':
      return 'Balance or DD'
    case 'debit_transactions':
      return 'Needs debit spend'
    case 'paperless_statements':
      return 'Go paperless'
    case 'age_student_military':
      return 'Status waiver'
    case 'linked_account':
      return 'Link account'
    case 'combined_balances':
      return 'Combined bal.'
    case 'bill_pay':
      return 'Needs bill pay'
    case 'other':
      return 'See fee notes'
    default:
      return 'Waiver'
  }
}
