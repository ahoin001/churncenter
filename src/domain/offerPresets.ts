import type { OfferRequirementBlueprint } from './types'
import { createId } from '@/lib/id'

export type DealPattern = 'savings_fund_hold' | 'checking_activity' | 'simple_notes'

export const DEAL_PATTERN_OPTIONS: Array<{
  value: DealPattern
  label: string
  hint: string
}> = [
  {
    value: 'savings_fund_hold',
    label: 'Savings',
    hint: 'Fund, then hold the balance',
  },
  {
    value: 'checking_activity',
    label: 'Checking',
    hint: 'Direct deposit and/or spend',
  },
  {
    value: 'simple_notes',
    label: 'Notes',
    hint: 'Bonus + optional notes only',
  },
]

export type SavingsFundHoldInput = {
  amount: number
  fundWithinDays: number
  holdDays: number
}

export type CheckingActivityInput = {
  ddAmount: number
  ddDays: number
  spendAmount: number
  spendDays: number
}

function moneyLabel(amount: number) {
  return `$${Math.round(amount).toLocaleString('en-US')}`
}

export function previewSavingsFundHold(input: SavingsFundHoldInput): string {
  const amount = Math.max(0, input.amount)
  const fund = Math.max(0, Math.round(input.fundWithinDays))
  const hold = Math.max(0, Math.round(input.holdDays))
  if (amount <= 0 || fund <= 0 || hold <= 0) {
    return 'Enter amount, fund window, and hold days.'
  }
  return `Fund ${moneyLabel(amount)} within ${fund} days of open, then hold ${hold} days.`
}

export function previewCheckingActivity(input: CheckingActivityInput): string {
  const parts: string[] = []
  if (input.ddAmount > 0 && input.ddDays > 0) {
    parts.push(
      `${moneyLabel(input.ddAmount)} DD within ${Math.round(input.ddDays)} days of open`,
    )
  }
  if (input.spendAmount > 0 && input.spendDays > 0) {
    parts.push(
      `${moneyLabel(input.spendAmount)} spend within ${Math.round(input.spendDays)} days of open`,
    )
  }
  if (parts.length === 0) return 'Add a direct deposit and/or spend target.'
  return parts.join(' · ')
}

export function buildSavingsFundHold(
  input: SavingsFundHoldInput,
  createBlueprintId: () => string = () => createId('bp'),
): OfferRequirementBlueprint[] {
  const amount = Math.max(0, input.amount)
  const fundWithinDays = Math.max(0, Math.round(input.fundWithinDays))
  const holdDays = Math.max(0, Math.round(input.holdDays))

  return [
    {
      id: createBlueprintId(),
      type: 'initial_fund',
      label: `Deposit at least ${moneyLabel(amount)}`,
      targetAmount: amount,
      windowDays: fundWithinDays,
      windowAnchor: 'open',
      notes: `Within ${fundWithinDays} days of opening`,
    },
    {
      id: createBlueprintId(),
      type: 'balance_days',
      label: `Maintain ${moneyLabel(amount)} balance`,
      targetAmount: amount,
      targetDays: holdDays,
      windowAnchor: 'after_previous',
      notes: `${holdDays} days after funding is complete`,
    },
  ]
}

export function buildCheckingActivity(
  input: CheckingActivityInput,
  createBlueprintId: () => string = () => createId('bp'),
): OfferRequirementBlueprint[] {
  const reqs: OfferRequirementBlueprint[] = []

  if (input.ddAmount > 0) {
    const days = Math.max(0, Math.round(input.ddDays)) || 90
    reqs.push({
      id: createBlueprintId(),
      type: 'direct_deposit',
      label: 'Qualifying direct deposits',
      targetAmount: input.ddAmount,
      windowDays: days,
      windowAnchor: 'open',
      notes: '',
    })
  }

  if (input.spendAmount > 0) {
    const days = Math.max(0, Math.round(input.spendDays)) || 90
    reqs.push({
      id: createBlueprintId(),
      type: 'spend',
      label: 'Debit spend',
      targetAmount: input.spendAmount,
      windowDays: days,
      windowAnchor: 'open',
      notes: '',
    })
  }

  return reqs
}

export function buildSimpleNotes(): OfferRequirementBlueprint[] {
  return []
}

export function buildRequirementsForPattern(
  pattern: DealPattern,
  args: {
    savings: SavingsFundHoldInput
    checking: CheckingActivityInput
  },
): OfferRequirementBlueprint[] {
  switch (pattern) {
    case 'savings_fund_hold':
      return buildSavingsFundHold(args.savings)
    case 'checking_activity':
      return buildCheckingActivity(args.checking)
    case 'simple_notes':
      return buildSimpleNotes()
  }
}

export function defaultOfferTitle(bankName: string, pattern: DealPattern): string {
  const bank = bankName.trim() || 'Bank'
  switch (pattern) {
    case 'savings_fund_hold':
      return `${bank} Savings bonus`
    case 'checking_activity':
      return `${bank} Checking bonus`
    case 'simple_notes':
      return `${bank} bonus`
  }
}

export function validateDealPattern(
  pattern: DealPattern,
  args: {
    savings: SavingsFundHoldInput
    checking: CheckingActivityInput
  },
): string | null {
  if (pattern === 'savings_fund_hold') {
    if (args.savings.amount <= 0) return 'Enter the fund / hold amount.'
    if (args.savings.fundWithinDays <= 0) return 'Enter how many days you have to fund.'
    if (args.savings.holdDays <= 0) return 'Enter how many days to hold the balance.'
    return null
  }
  if (pattern === 'checking_activity') {
    if (args.checking.ddAmount <= 0 && args.checking.spendAmount <= 0) {
      return 'Add a direct deposit and/or spend amount.'
    }
    return null
  }
  return null
}
