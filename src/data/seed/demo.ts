import { addDays, formatISO, subMonths } from 'date-fns'
import { createEmptyAppData, type AppData } from '@/domain/types'
import { createId } from '@/lib/id'
import { computeReEligibleAt } from '@/domain/cooldowns'
import { createDefaultAccountConditions } from '@/domain/fees'

export function createDemoSeed(): AppData {
  const now = new Date()
  const iso = (d: Date) => formatISO(d, { representation: 'date' })
  const ts = () => new Date().toISOString()

  const chaseId = createId('inst')
  const allyId = createId('inst')
  const capitalId = createId('inst')
  const etradeId = createId('inst')

  const chaseOffer = createId('offer')
  const allyOffer = createId('offer')
  const capitalOffer = createId('offer')
  const etradeOffer = createId('offer')

  const enrollChase = createId('enr')
  const enrollAlly = createId('enr')
  const enrollCool = createId('enr')

  const reqDd = createId('req')
  const reqSpend = createId('req')
  const reqFund = createId('req')

  const data = createEmptyAppData()
  data.meta.onboardingCompleted = true

  data.institutions = [
    {
      id: chaseId,
      name: 'Chase',
      notes: 'New checking often ~12 months after close.',
      defaultCooldownMonths: 12,
      createdAt: ts(),
      updatedAt: ts(),
    },
    {
      id: allyId,
      name: 'Ally',
      notes: 'Online only. Clean DD tracking.',
      defaultCooldownMonths: 12,
      createdAt: ts(),
      updatedAt: ts(),
    },
    {
      id: capitalId,
      name: 'Capital One',
      notes: 'Watch product-level vs bank-level new customer rules.',
      defaultCooldownMonths: 12,
      createdAt: ts(),
      updatedAt: ts(),
    },
    {
      id: etradeId,
      name: 'E*TRADE',
      notes: 'Savings / premium savings bonus style — fund then maintain.',
      defaultCooldownMonths: 12,
      createdAt: ts(),
      updatedAt: ts(),
    },
  ]

  data.offers = [
    {
      id: chaseOffer,
      institutionId: chaseId,
      title: 'Chase Total Checking bonus',
      bonusAmount: 300,
      capitalRequired: 0,
      expiresAt: null,
      url: 'https://www.chase.com',
      regionNotes: 'Select markets / online codes vary',
      termsNotes: '',
      effortScore: 3,
      requirements: [
        {
          id: createId('bp'),
          type: 'direct_deposit',
          label: 'Qualifying direct deposits',
          targetAmount: 500,
          windowDays: 90,
          windowAnchor: 'open',
          notes: 'Payroll ACH usually safest',
        },
      ],
      accountConditions: {
        ...createDefaultAccountConditions(),
        openingDepositKind: 'none',
        monthlyFeeKind: 'waivable',
        monthlyFeeAmount: 12,
        waiverAction: 'direct_deposit',
        waiverDetail: 'Qualifying direct deposit each statement period',
        waiverSatisfied: false,
      },
      createdAt: ts(),
      updatedAt: ts(),
    },
    {
      id: allyOffer,
      institutionId: allyId,
      title: 'Ally Spending bonus',
      bonusAmount: 200,
      capitalRequired: 0,
      expiresAt: null,
      url: 'https://www.ally.com',
      regionNotes: 'National online',
      termsNotes: '',
      effortScore: 2,
      requirements: [
        {
          id: createId('bp'),
          type: 'direct_deposit',
          label: 'Direct deposits totaling $1000',
          targetAmount: 1000,
          windowDays: 90,
          windowAnchor: 'open',
          notes: '',
        },
        {
          id: createId('bp'),
          type: 'spend',
          label: 'Debit spend',
          targetAmount: 300,
          windowDays: 90,
          windowAnchor: 'open',
          notes: '',
        },
      ],
      accountConditions: {
        ...createDefaultAccountConditions(),
        openingDepositKind: 'none',
        monthlyFeeKind: 'none',
        waiverSatisfied: true,
      },
      createdAt: ts(),
      updatedAt: ts(),
    },
    {
      id: capitalOffer,
      institutionId: capitalId,
      title: 'Capital One 360 Checking',
      bonusAmount: 400,
      capitalRequired: 250,
      expiresAt: null,
      url: 'https://www.capitalone.com',
      regionNotes: '',
      termsNotes: '',
      effortScore: 3,
      requirements: [
        {
          id: createId('bp'),
          type: 'initial_fund',
          label: 'Opening deposit',
          targetAmount: 250,
          windowDays: 30,
          windowAnchor: 'open',
          notes: '',
        },
        {
          id: createId('bp'),
          type: 'direct_deposit',
          label: 'Set up DD',
          targetAmount: 500,
          windowDays: 90,
          windowAnchor: 'open',
          notes: '',
        },
      ],
      accountConditions: {
        ...createDefaultAccountConditions(),
        openingDepositKind: 'required',
        openingDepositAmount: 250,
        monthlyFeeKind: 'none',
        waiverSatisfied: true,
      },
      createdAt: ts(),
      updatedAt: ts(),
    },
    {
      id: etradeOffer,
      institutionId: etradeId,
      title: 'E*TRADE Premium Savings bonus',
      bonusAmount: 500,
      capitalRequired: 20000,
      expiresAt: '2026-09-30',
      url: 'https://us.etrade.com',
      regionNotes: '',
      termsNotes:
        'Deposit at least $20,000 of qualifying new money within the first 30 days of account opening. Maintain your balance for 45 additional days after the 30-day funding period ends.',
      effortScore: 2,
      requirements: [
        {
          id: createId('bp'),
          type: 'initial_fund',
          label: 'Deposit at least $20,000',
          targetAmount: 20000,
          windowDays: 30,
          windowAnchor: 'open',
          notes: 'Within 30 days of opening',
        },
        {
          id: createId('bp'),
          type: 'balance_days',
          label: 'Maintain $20,000 balance',
          targetAmount: 20000,
          targetDays: 45,
          windowAnchor: 'after_previous',
          notes: '45 days after the $20k is funded',
        },
      ],
      accountConditions: {
        ...createDefaultAccountConditions(),
        openingDepositKind: 'required',
        openingDepositAmount: 20000,
        monthlyFeeKind: 'none',
        waiverSatisfied: true,
      },
      createdAt: ts(),
      updatedAt: ts(),
    },
  ]

  data.watchlist = [
    {
      id: createId('watch'),
      offerId: capitalOffer,
      notes: 'Wait until Cool-down bank unlocks capital.',
      notifyOn: iso(addDays(now, 18)),
      createdAt: ts(),
    },
    {
      id: createId('watch'),
      offerId: etradeOffer,
      notes: 'Fund $20k within 30d of open, then hold 45d — expires Sep 2026.',
      notifyOn: '2026-09-01',
      createdAt: ts(),
    },
  ]

  data.enrollments = [
    {
      id: enrollChase,
      offerId: chaseOffer,
      institutionId: chaseId,
      householdMemberId: 'you',
      status: 'meeting_requirements',
      frozenTitle: 'Chase Total Checking bonus',
      frozenBonusAmount: 300,
      frozenCapitalRequired: 0,
      frozenTermsNotes: 'Snapshot: $500 qualifying DD within 90 days of open.',
      openedAt: iso(subMonths(now, 1)),
      deadlineAt: iso(addDays(now, 12)),
      expectedBonusAt: iso(addDays(now, 45)),
      bonusPostedAt: null,
      clawbackEndsAt: null,
      closedAt: null,
      reEligibleAt: null,
      capitalLocked: 0,
      whatCountedNotes: '',
      accountConditions: {
        ...createDefaultAccountConditions(),
        openingDepositKind: 'none',
        monthlyFeeKind: 'waivable',
        monthlyFeeAmount: 12,
        waiverAction: 'direct_deposit',
        waiverDetail: 'Qualifying direct deposit each statement period',
        waiverSatisfied: false,
      },
      createdAt: ts(),
      updatedAt: ts(),
    },
    {
      id: enrollAlly,
      offerId: allyOffer,
      institutionId: allyId,
      householdMemberId: 'you',
      status: 'clawback',
      frozenTitle: 'Ally Spending bonus',
      frozenBonusAmount: 200,
      frozenCapitalRequired: 0,
      frozenTermsNotes: 'Bonus posted. Keep open through clawback.',
      openedAt: iso(subMonths(now, 3)),
      deadlineAt: iso(subMonths(now, 1)),
      expectedBonusAt: iso(subMonths(now, 0)),
      bonusPostedAt: iso(addDays(now, -10)),
      clawbackEndsAt: iso(addDays(now, 20)),
      closedAt: null,
      reEligibleAt: null,
      capitalLocked: 100,
      whatCountedNotes: 'Payroll DD counted; P2P did not.',
      accountConditions: {
        ...createDefaultAccountConditions(),
        openingDepositKind: 'none',
        monthlyFeeKind: 'none',
        waiverSatisfied: true,
      },
      createdAt: ts(),
      updatedAt: ts(),
    },
    {
      id: enrollCool,
      offerId: capitalOffer,
      institutionId: capitalId,
      householdMemberId: 'you',
      status: 'cooling_down',
      frozenTitle: 'Capital One 360 Checking',
      frozenBonusAmount: 400,
      frozenCapitalRequired: 250,
      frozenTermsNotes: 'Closed after successful bonus.',
      openedAt: iso(subMonths(now, 14)),
      deadlineAt: null,
      expectedBonusAt: null,
      bonusPostedAt: iso(subMonths(now, 12)),
      clawbackEndsAt: null,
      closedAt: iso(subMonths(now, 11)),
      reEligibleAt: computeReEligibleAt(iso(subMonths(now, 11)), 12),
      capitalLocked: 0,
      whatCountedNotes: '',
      accountConditions: {
        ...createDefaultAccountConditions(),
        openingDepositKind: 'required',
        openingDepositAmount: 250,
        monthlyFeeKind: 'none',
        waiverSatisfied: true,
      },
      createdAt: ts(),
      updatedAt: ts(),
    },
  ]

  data.requirements = [
    {
      id: reqDd,
      enrollmentId: enrollChase,
      type: 'direct_deposit',
      label: 'Qualifying direct deposits',
      targetAmount: 500,
      currentAmount: 320,
      targetCount: 0,
      currentCount: 0,
      targetDays: 0,
      currentDays: 0,
      windowDays: 90,
      windowAnchor: 'open',
      startsAt: iso(subMonths(now, 1)),
      deadlineAt: iso(addDays(now, 12)),
      dependsOnRequirementId: null,
      notes: 'Payroll preferred',
      completedAt: null,
    },
    {
      id: reqSpend,
      enrollmentId: enrollAlly,
      type: 'spend',
      label: 'Debit spend',
      targetAmount: 300,
      currentAmount: 300,
      targetCount: 0,
      currentCount: 0,
      targetDays: 0,
      currentDays: 0,
      windowDays: 90,
      windowAnchor: 'open',
      startsAt: iso(subMonths(now, 3)),
      deadlineAt: iso(subMonths(now, 1)),
      dependsOnRequirementId: null,
      notes: '',
      completedAt: iso(addDays(now, -40)),
    },
    {
      id: reqFund,
      enrollmentId: enrollAlly,
      type: 'direct_deposit',
      label: 'Direct deposits',
      targetAmount: 1000,
      currentAmount: 1000,
      targetCount: 0,
      currentCount: 0,
      targetDays: 0,
      currentDays: 0,
      windowDays: 90,
      windowAnchor: 'open',
      startsAt: iso(subMonths(now, 3)),
      deadlineAt: iso(subMonths(now, 1)),
      dependsOnRequirementId: null,
      notes: '',
      completedAt: iso(addDays(now, -35)),
    },
  ]

  data.activities = [
    {
      id: createId('act'),
      enrollmentId: enrollChase,
      requirementId: reqDd,
      kind: 'progress',
      amount: 320,
      ddKind: 'payroll',
      label: 'Payroll deposit',
      at: iso(addDays(now, -3)),
    },
  ]

  data.relationships = [
    {
      id: createId('rel'),
      institutionId: capitalId,
      kind: 'closed',
      productLabel: '360 Checking',
      at: iso(subMonths(now, 11)),
      notes: 'Closed after clawback',
    },
  ]

  data.preferences = {
    ...data.preferences,
    payNetAmount: 1200,
    payFrequency: 'biweekly',
    nextPayday: iso(addDays(now, 7)),
    liquidCapital: 45000,
  }

  return data
}
