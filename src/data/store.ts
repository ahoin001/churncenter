import { create } from 'zustand'
import { formatISO } from 'date-fns'
import type {
  Activity,
  AppData,
  Enrollment,
  EnrollmentStatus,
  Institution,
  Offer,
  Requirement,
  WatchlistItem,
} from '@/domain/types'
import { createEmptyAppData } from '@/domain/types'
import { localRepository } from '@/data/local-repository'
import { createDemoSeed } from '@/data/seed/demo'
import { createId } from '@/lib/id'
import { applyProgress } from '@/domain/requirements'
import { computeReEligibleAt } from '@/domain/cooldowns'
import { canAddCustomName } from '@/domain/institutions'
import { resolveClawbackAfterBonusChange } from '@/domain/clawback'
import {
  activateDependentsAfterComplete,
  earliestRequirementDeadline,
  materializeRequirementsFromOffer,
} from '@/domain/windows'
import { createDefaultAccountConditions } from '@/domain/fees'

export const MAX_ATTACHMENT_BYTES = 400_000

export type AddInstitutionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; existingId?: string }

type Actions = {
  hydrated: boolean
  hydrate: () => void
  persist: () => void
  resetAll: () => void
  loadDemo: () => void
  clearDemoData: () => void
  importJson: (json: string) => { ok: true } | { ok: false; error: string }
  exportJson: () => string
  addInstitution: (
    input: Omit<Institution, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ) => AddInstitutionResult
  /** @deprecated prefer addInstitution — kept for update-by-id */
  upsertInstitution: (
    input: Omit<Institution, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ) => string
  upsertOffer: (
    input: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ) => string
  addWatchlist: (offerId: string, notes?: string, notifyOn?: string | null) => void
  removeWatchlist: (id: string) => void
  enrollFromOffer: (offerId: string) => string | null
  updateEnrollment: (id: string, patch: Partial<Enrollment>) => void
  setEnrollmentStatus: (id: string, status: EnrollmentStatus) => void
  closeEnrollment: (id: string) => void
  abandonEnrollment: (id: string) => void
  removeEnrollment: (id: string) => void
  updateRequirementProgress: (
    requirementId: string,
    patch: Partial<Pick<Requirement, 'currentAmount' | 'currentCount' | 'currentDays'>>,
  ) => void
  addActivity: (activity: Omit<Activity, 'id'>) => void
  completeOnboarding: () => void
  setPreference: <K extends keyof AppData['preferences']>(
    key: K,
    value: AppData['preferences'][K],
  ) => void
}

type Store = AppData & Actions

const actionKeys = new Set<keyof Actions>([
  'hydrated',
  'hydrate',
  'persist',
  'resetAll',
  'loadDemo',
  'clearDemoData',
  'importJson',
  'exportJson',
  'addInstitution',
  'upsertInstitution',
  'upsertOffer',
  'addWatchlist',
  'removeWatchlist',
  'enrollFromOffer',
  'updateEnrollment',
  'setEnrollmentStatus',
  'closeEnrollment',
  'abandonEnrollment',
  'removeEnrollment',
  'updateRequirementProgress',
  'addActivity',
  'completeOnboarding',
  'setPreference',
])

function snapshotData(state: Store): AppData {
  const data = { ...createEmptyAppData() }
  for (const [key, value] of Object.entries(state)) {
    if (actionKeys.has(key as keyof Actions)) continue
    ;(data as Record<string, unknown>)[key] = value
  }
  return data as AppData
}

function nowIso() {
  return new Date().toISOString()
}

function dateOnly(d = new Date()) {
  return formatISO(d, { representation: 'date' })
}

export const useChurnStore = create<Store>((set, get) => ({
  ...createEmptyAppData(),
  hydrated: false,

  hydrate: () => {
    const data = localRepository.load()
    set({ ...data, hydrated: true })
  },

  persist: () => {
    localRepository.save(snapshotData(get()))
  },

  resetAll: () => {
    localRepository.clear()
    set({ ...createEmptyAppData(), hydrated: true })
  },

  loadDemo: () => {
    const demo = createDemoSeed()
    set({ ...demo, hydrated: true })
    get().persist()
  },

  clearDemoData: () => {
    const preferences = get().preferences
    const onboardingCompleted = get().meta.onboardingCompleted
    const empty = createEmptyAppData()
    set({
      ...empty,
      preferences,
      meta: {
        ...empty.meta,
        onboardingCompleted,
      },
      hydrated: true,
    })
    get().persist()
  },

  importJson: (json) => {
    try {
      const parsed = JSON.parse(json) as AppData
      if (!parsed || typeof parsed !== 'object' || !parsed.meta) {
        return { ok: false, error: 'Invalid backup file' }
      }
      localRepository.save(parsed)
      const data = localRepository.load()
      set({ ...data, hydrated: true })
      return { ok: true }
    } catch {
      return { ok: false, error: 'Could not parse JSON' }
    }
  },

  exportJson: () => {
    const data = snapshotData(get())
    data.meta = { ...data.meta, lastBackupAt: nowIso() }
    set({ meta: data.meta })
    get().persist()
    return JSON.stringify(data, null, 2)
  },

  addInstitution: (input) => {
    const name = input.name.trim()
    const gate = canAddCustomName(name, get().institutions, input.id)
    if (!gate.ok) {
      return {
        ok: false,
        error: gate.reason,
        existingId: gate.existing?.id,
      }
    }

    const id = input.id ?? createId('inst')
    const existing = get().institutions.find((i) => i.id === id)
    const next: Institution = {
      id,
      name,
      notes: input.notes,
      defaultCooldownMonths: input.defaultCooldownMonths,
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    }
    set({
      institutions: existing
        ? get().institutions.map((i) => (i.id === id ? next : i))
        : [...get().institutions, next],
    })
    get().persist()
    return { ok: true, id }
  },

  upsertInstitution: (input) => {
    const result = get().addInstitution(input)
    if (result.ok) return result.id
    // Legacy callers: no-op create on duplicate; return existing id when known
    if (result.existingId) return result.existingId
    return createId('inst')
  },

  upsertOffer: (input) => {
    const id = input.id ?? createId('offer')
    const existing = get().offers.find((o) => o.id === id)
    const next: Offer = {
      ...input,
      expiresAt: input.expiresAt ?? null,
      accountConditions: input.accountConditions
        ? { ...input.accountConditions }
        : createDefaultAccountConditions(),
      id,
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    }
    set({
      offers: existing
        ? get().offers.map((o) => (o.id === id ? next : o))
        : [...get().offers, next],
    })
    get().persist()
    return id
  },

  addWatchlist: (offerId, notes = '', notifyOn = null) => {
    const item: WatchlistItem = {
      id: createId('watch'),
      offerId,
      notes,
      notifyOn,
      createdAt: nowIso(),
    }
    set({ watchlist: [...get().watchlist, item] })
    get().persist()
  },

  removeWatchlist: (id) => {
    set({ watchlist: get().watchlist.filter((w) => w.id !== id) })
    get().persist()
  },

  enrollFromOffer: (offerId) => {
    const offer = get().offers.find((o) => o.id === offerId)
    if (!offer) return null
    const enrollmentId = createId('enr')
    const openedAt = dateOnly()
    const requirements = materializeRequirementsFromOffer({
      enrollmentId,
      openedAt,
      blueprints: offer.requirements,
      createId: () => createId('req'),
    })
    const terms = [
      ...offer.requirements.map((r) => {
        const bits = [r.label]
        if (r.windowAnchor === 'open' && r.windowDays) {
          bits.push(`within ${r.windowDays}d of open`)
        } else if (r.windowAnchor === 'after_previous') {
          bits.push(
            r.targetDays ? `${r.targetDays}d after prior step` : 'after prior step',
          )
        }
        return bits.join(' · ')
      }),
      offer.expiresAt ? `Offer expires ${offer.expiresAt}` : null,
    ]
      .filter(Boolean)
      .join(' · ')

    const enrollment: Enrollment = {
      id: enrollmentId,
      offerId: offer.id,
      institutionId: offer.institutionId,
      householdMemberId: 'you',
      status: 'opened',
      frozenTitle: offer.title,
      frozenBonusAmount: offer.bonusAmount,
      frozenCapitalRequired: offer.capitalRequired,
      frozenTermsNotes: terms,
      openedAt,
      deadlineAt: earliestRequirementDeadline(requirements),
      expectedBonusAt: null,
      bonusPostedAt: null,
      clawbackEndsAt: null,
      closedAt: null,
      reEligibleAt: null,
      capitalLocked: offer.capitalRequired,
      whatCountedNotes: '',
      accountConditions: offer.accountConditions
        ? { ...offer.accountConditions }
        : createDefaultAccountConditions(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    set({
      enrollments: [...get().enrollments, enrollment],
      requirements: [...get().requirements, ...requirements],
      watchlist: get().watchlist.filter((w) => w.offerId !== offerId),
    })
    get().persist()
    return enrollmentId
  },

  updateEnrollment: (id, patch) => {
    const current = get().enrollments.find((e) => e.id === id)
    if (!current) return

    let nextPatch: Partial<Enrollment> = { ...patch }

    const bonusFieldChanging =
      patch.expectedBonusAt !== undefined || patch.bonusPostedAt !== undefined
    const clawbackExplicit = patch.clawbackEndsAt !== undefined

    if (bonusFieldChanging && !clawbackExplicit) {
      const nextPosted =
        patch.bonusPostedAt !== undefined ? patch.bonusPostedAt : current.bonusPostedAt
      const nextExpected =
        patch.expectedBonusAt !== undefined
          ? patch.expectedBonusAt
          : current.expectedBonusAt
      const nextBonusDate = nextPosted ?? nextExpected
      const previousBonusDate = current.bonusPostedAt ?? current.expectedBonusAt

      const resolved = resolveClawbackAfterBonusChange({
        previousBonusDate,
        nextBonusDate,
        currentClawback: current.clawbackEndsAt,
        clawbackDays: get().preferences.defaultClawbackDays,
      })

      if (resolved !== undefined) {
        nextPatch = { ...nextPatch, clawbackEndsAt: resolved }
      }
    }

    set({
      enrollments: get().enrollments.map((e) =>
        e.id === id ? { ...e, ...nextPatch, updatedAt: nowIso() } : e,
      ),
    })
    get().persist()
  },

  setEnrollmentStatus: (id, status) => {
    get().updateEnrollment(id, { status })
  },

  closeEnrollment: (id) => {
    const enrollment = get().enrollments.find((e) => e.id === id)
    if (!enrollment) return
    const institution = get().institutions.find((i) => i.id === enrollment.institutionId)
    const months =
      institution?.defaultCooldownMonths ?? get().preferences.defaultCooldownMonths
    const closedAt = dateOnly()
    get().updateEnrollment(id, {
      status: 'cooling_down',
      closedAt,
      reEligibleAt: computeReEligibleAt(closedAt, months),
      capitalLocked: 0,
    })
    set({
      relationships: [
        ...get().relationships,
        {
          id: createId('rel'),
          institutionId: enrollment.institutionId,
          kind: 'closed',
          productLabel: enrollment.frozenTitle,
          at: closedAt,
          notes: '',
        },
      ],
    })
    get().persist()
  },

  abandonEnrollment: (id) => {
    const enrollment = get().enrollments.find((e) => e.id === id)
    if (!enrollment) return
    get().updateEnrollment(id, {
      status: 'abandoned',
      capitalLocked: 0,
    })
    get().addActivity({
      enrollmentId: id,
      requirementId: null,
      kind: 'status',
      amount: 0,
      label: 'Removed from active',
      at: dateOnly(),
    })
  },

  removeEnrollment: (id) => {
    set({
      enrollments: get().enrollments.filter((e) => e.id !== id),
      requirements: get().requirements.filter((r) => r.enrollmentId !== id),
      activities: get().activities.filter((a) => a.enrollmentId !== id),
      attachments: get().attachments.filter((a) => a.enrollmentId !== id),
    })
    get().persist()
  },

  updateRequirementProgress: (requirementId, patch) => {
    const now = nowIso()
    const before = get().requirements.find((r) => r.id === requirementId)
    if (!before) return

    let nextReqs = get().requirements.map((r) =>
      r.id === requirementId ? applyProgress(r, patch, now) : r,
    )
    const after = nextReqs.find((r) => r.id === requirementId)
    const justCompleted = Boolean(after?.completedAt) && !before.completedAt

    if (justCompleted && after?.completedAt) {
      nextReqs = activateDependentsAfterComplete(
        nextReqs,
        requirementId,
        after.completedAt,
      )
    }

    const enrollmentId = before.enrollmentId
    const enrollmentReqs = nextReqs.filter((r) => r.enrollmentId === enrollmentId)
    const nextDeadline = earliestRequirementDeadline(enrollmentReqs)

    set({
      requirements: nextReqs,
      enrollments: get().enrollments.map((e) =>
        e.id === enrollmentId
          ? { ...e, deadlineAt: nextDeadline, updatedAt: now }
          : e,
      ),
    })
    get().persist()
  },

  addActivity: (activity) => {
    set({
      activities: [...get().activities, { ...activity, id: createId('act') }],
    })
    get().persist()
  },

  completeOnboarding: () => {
    set({ meta: { ...get().meta, onboardingCompleted: true } })
    get().persist()
  },

  setPreference: (key, value) => {
    set({ preferences: { ...get().preferences, [key]: value } })
    get().persist()
  },
}))
