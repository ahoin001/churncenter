/** Domain schema SSOT — versioned with data migrations. */

export const SCHEMA_VERSION = 3

export type EnrollmentStatus =
  | 'researching'
  | 'applied'
  | 'opened'
  | 'funding'
  | 'meeting_requirements'
  | 'waiting_bonus'
  | 'bonus_posted'
  | 'clawback'
  | 'close_eligible'
  | 'closed'
  | 'cooling_down'
  | 're_eligible'
  | 'denied'
  | 'abandoned'
  | 'disputed'

export type RequirementType =
  | 'direct_deposit'
  | 'spend'
  | 'balance_days'
  | 'initial_fund'
  | 'wait'
  | 'custom'

/**
 * When a requirement's action / hold window is measured from.
 * - open: relative to enrollment.openedAt
 * - absolute: uses an explicit deadline date on the blueprint/requirement
 * - after_previous: starts when the prior requirement in the offer list completes
 */
export type RequirementWindowAnchor = 'open' | 'absolute' | 'after_previous'

export type DirectDepositKind =
  | 'payroll'
  | 'benefits'
  | 'ach_transfer'
  | 'p2p'
  | 'brokerage'
  | 'other'
  | 'unverified'

export type HouseholdMemberId = 'you' | 'partner' | string

export type OpeningDepositKind = 'unknown' | 'none' | 'recommended' | 'required'

export type MonthlyFeeKind = 'unknown' | 'none' | 'flat_monthly' | 'waivable'

export type FeeWaiverAction =
  | 'none'
  | 'direct_deposit'
  | 'min_balance'
  | 'min_balance_or_dd'
  | 'debit_transactions'
  | 'paperless_statements'
  | 'age_student_military'
  | 'linked_account'
  | 'combined_balances'
  | 'bill_pay'
  | 'other'

/** Soft costs / fee waiver conditions for an offer or enrollment. */
export type AccountConditions = {
  openingDepositKind: OpeningDepositKind
  openingDepositAmount: number
  monthlyFeeKind: MonthlyFeeKind
  monthlyFeeAmount: number
  waiverAction: FeeWaiverAction
  waiverDetail: string
  minBalanceToAvoidFee: number
  waiverSatisfied: boolean
  otherFeeNotes: string
}

export type Institution = {
  id: string
  name: string
  notes: string
  defaultCooldownMonths: number
  createdAt: string
  updatedAt: string
}

export type RelationshipEvent = {
  id: string
  institutionId: string
  kind: 'opened' | 'closed' | 'denied' | 'note'
  productLabel: string
  at: string
  notes: string
}

export type OfferRequirementBlueprint = {
  id: string
  type: RequirementType
  label: string
  /** Min amount (fund/spend/DD) or min balance for balance_days */
  targetAmount?: number
  targetCount?: number
  /** Hold / wait duration in days */
  targetDays?: number
  /** Days allowed to complete, relative to windowAnchor */
  windowDays?: number
  windowAnchor?: RequirementWindowAnchor
  /** Absolute deadline when windowAnchor is 'absolute' (YYYY-MM-DD) */
  absoluteDeadlineAt?: string | null
  notes: string
}

export type Offer = {
  id: string
  institutionId: string
  title: string
  bonusAmount: number
  capitalRequired: number
  /** Last day to open / enroll under this offer (YYYY-MM-DD) */
  expiresAt: string | null
  url: string
  regionNotes: string
  effortScore: number
  requirements: OfferRequirementBlueprint[]
  accountConditions: AccountConditions
  createdAt: string
  updatedAt: string
}

export type WatchlistItem = {
  id: string
  offerId: string
  notes: string
  notifyOn: string | null
  createdAt: string
}

export type Requirement = {
  id: string
  enrollmentId: string
  type: RequirementType
  label: string
  targetAmount: number
  currentAmount: number
  targetCount: number
  currentCount: number
  targetDays: number
  currentDays: number
  windowDays: number
  windowAnchor: RequirementWindowAnchor
  /** When this requirement becomes active (YYYY-MM-DD) */
  startsAt: string | null
  /** When this requirement must be finished (YYYY-MM-DD) */
  deadlineAt: string | null
  dependsOnRequirementId: string | null
  notes: string
  completedAt: string | null
}

export type Activity = {
  id: string
  enrollmentId: string
  requirementId: string | null
  kind: 'progress' | 'note' | 'status' | 'document'
  amount: number
  ddKind?: DirectDepositKind
  label: string
  at: string
}

export type AttachmentMeta = {
  id: string
  enrollmentId: string
  name: string
  mime: string
  size: number
  /** base64 data URL — keep small; guarded on write */
  dataUrl: string
  createdAt: string
}

export type Enrollment = {
  id: string
  offerId: string
  institutionId: string
  householdMemberId: HouseholdMemberId
  status: EnrollmentStatus
  /** Frozen offer snapshot at enroll time */
  frozenTitle: string
  frozenBonusAmount: number
  frozenCapitalRequired: number
  frozenTermsNotes: string
  openedAt: string | null
  /** Earliest open-anchored / overall action deadline */
  deadlineAt: string | null
  expectedBonusAt: string | null
  bonusPostedAt: string | null
  clawbackEndsAt: string | null
  closedAt: string | null
  reEligibleAt: string | null
  capitalLocked: number
  whatCountedNotes: string
  accountConditions: AccountConditions
  createdAt: string
  updatedAt: string
}

export type PayFrequency =
  | 'unknown'
  | 'weekly'
  | 'biweekly'
  | 'semimonthly'
  | 'monthly'

export type Preferences = {
  defaultCooldownMonths: number
  reminderLeadDays: number
  householdEnabled: boolean
  themeMode: 'light' | 'dark' | 'system'
  /** Soft default days after bonus date for clawback end */
  defaultClawbackDays: number
  /** Typical net amount that can land as qualifying direct deposit */
  payNetAmount: number
  payFrequency: PayFrequency
  /** Next expected payday (YYYY-MM-DD) */
  nextPayday: string | null
}

export type AppMeta = {
  schemaVersion: number
  lastBackupAt: string | null
  onboardingCompleted: boolean
}

export type AppData = {
  meta: AppMeta
  preferences: Preferences
  institutions: Institution[]
  relationships: RelationshipEvent[]
  offers: Offer[]
  watchlist: WatchlistItem[]
  enrollments: Enrollment[]
  requirements: Requirement[]
  activities: Activity[]
  attachments: AttachmentMeta[]
}

export function createEmptyAppData(): AppData {
  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      lastBackupAt: null,
      onboardingCompleted: false,
    },
    preferences: {
      defaultCooldownMonths: 12,
      reminderLeadDays: 7,
      householdEnabled: false,
      themeMode: 'system',
      defaultClawbackDays: 90,
      payNetAmount: 0,
      payFrequency: 'unknown',
      nextPayday: null,
    },
    institutions: [],
    relationships: [],
    offers: [],
    watchlist: [],
    enrollments: [],
    requirements: [],
    activities: [],
    attachments: [],
  }
}
