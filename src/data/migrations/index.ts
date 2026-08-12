import { createEmptyAppData, SCHEMA_VERSION, type AppData } from '@/domain/types'
import { normalizeWindowAnchor } from '@/domain/windows'
import { normalizeAccountConditions } from '@/domain/fees'

type Migration = (data: Record<string, unknown>) => Record<string, unknown>

const migrations: Record<number, Migration> = {
  /** v1 → v2: offer expiry + requirement windows / dependency fields */
  1: (data) => {
    const offers = Array.isArray(data.offers)
      ? data.offers.map((raw) => {
          if (!isRecord(raw)) return raw
          const requirements = Array.isArray(raw.requirements)
            ? raw.requirements.map((bp) => normalizeBlueprint(bp))
            : []
          return {
            ...raw,
            expiresAt:
              typeof raw.expiresAt === 'string' || raw.expiresAt === null
                ? raw.expiresAt
                : null,
            requirements,
            accountConditions: normalizeAccountConditions(raw.accountConditions),
          }
        })
      : []

    const requirements = Array.isArray(data.requirements)
      ? data.requirements.map((raw) => normalizeRequirement(raw))
      : []

    const enrollments = Array.isArray(data.enrollments)
      ? data.enrollments.map((raw) => {
          if (!isRecord(raw)) return raw
          return {
            ...raw,
            accountConditions: normalizeAccountConditions(raw.accountConditions),
          }
        })
      : []

    return {
      ...data,
      offers,
      requirements,
      enrollments,
      meta: {
        ...(isRecord(data.meta) ? data.meta : {}),
        schemaVersion: 2,
      },
    }
  },
  /** v2 → v3: pay profile fields on preferences (defaults via empty merge) */
  2: (data) => ({
    ...data,
    meta: {
      ...(isRecord(data.meta) ? data.meta : {}),
      schemaVersion: 3,
    },
  }),
  /** v3 → v4: offer termsNotes for freeform deal quirks */
  3: (data) => {
    const offers = Array.isArray(data.offers)
      ? data.offers.map((raw) => {
          if (!isRecord(raw)) return raw
          return {
            ...raw,
            termsNotes: typeof raw.termsNotes === 'string' ? raw.termsNotes : '',
          }
        })
      : []
    return {
      ...data,
      offers,
      meta: {
        ...(isRecord(data.meta) ? data.meta : {}),
        schemaVersion: 4,
      },
    }
  },
  /** v4 → v5: liquid capital for affordability nudges */
  4: (data) => ({
    ...data,
    meta: {
      ...(isRecord(data.meta) ? data.meta : {}),
      schemaVersion: 5,
    },
  }),
}

export function migrate(raw: Record<string, unknown>): AppData {
  const empty = createEmptyAppData()
  let version =
    typeof raw.meta === 'object' &&
    raw.meta &&
    'schemaVersion' in raw.meta &&
    typeof (raw.meta as { schemaVersion: unknown }).schemaVersion === 'number'
      ? (raw.meta as { schemaVersion: number }).schemaVersion
      : 0

  let cursor: Record<string, unknown> = raw

  while (version < SCHEMA_VERSION) {
    const step = migrations[version]
    if (!step) break
    cursor = step(cursor)
    version += 1
  }

  return {
    ...empty,
    ...cursor,
    meta: {
      ...empty.meta,
      ...(isRecord(cursor.meta) ? cursor.meta : {}),
      schemaVersion: SCHEMA_VERSION,
    },
    preferences: {
      ...empty.preferences,
      ...(isRecord(cursor.preferences) ? cursor.preferences : {}),
      themeMode: normalizeThemeMode(
        isRecord(cursor.preferences) ? cursor.preferences.themeMode : undefined,
      ),
      defaultClawbackDays: normalizeClawbackDays(
        isRecord(cursor.preferences) ? cursor.preferences.defaultClawbackDays : undefined,
      ),
      payNetAmount: normalizePayNetAmount(
        isRecord(cursor.preferences) ? cursor.preferences.payNetAmount : undefined,
      ),
      payFrequency: normalizePayFrequency(
        isRecord(cursor.preferences) ? cursor.preferences.payFrequency : undefined,
      ),
      nextPayday: normalizeNextPayday(
        isRecord(cursor.preferences) ? cursor.preferences.nextPayday : undefined,
      ),
      liquidCapital: normalizeLiquidCapital(
        isRecord(cursor.preferences) ? cursor.preferences.liquidCapital : undefined,
      ),
    },
    institutions: Array.isArray(cursor.institutions) ? cursor.institutions : [],
    relationships: Array.isArray(cursor.relationships) ? cursor.relationships : [],
    offers: Array.isArray(cursor.offers)
      ? cursor.offers.map((o) => normalizeOfferRecord(o))
      : [],
    watchlist: Array.isArray(cursor.watchlist) ? cursor.watchlist : [],
    enrollments: Array.isArray(cursor.enrollments)
      ? cursor.enrollments.map((e) => normalizeEnrollmentRecord(e))
      : [],
    requirements: Array.isArray(cursor.requirements)
      ? cursor.requirements.map((r) => normalizeRequirement(r))
      : [],
    activities: Array.isArray(cursor.activities) ? cursor.activities : [],
    attachments: Array.isArray(cursor.attachments) ? cursor.attachments : [],
  } as AppData
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeThemeMode(value: unknown): 'light' | 'dark' | 'system' {
  if (value === 'light' || value === 'dark' || value === 'system') return value
  return 'system'
}

function normalizeClawbackDays(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.round(value)
  }
  return 90
}

function normalizePayNetAmount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  return 0
}

function normalizeLiquidCapital(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  return 0
}

function normalizePayFrequency(
  value: unknown,
): 'unknown' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' {
  if (
    value === 'unknown' ||
    value === 'weekly' ||
    value === 'biweekly' ||
    value === 'semimonthly' ||
    value === 'monthly'
  ) {
    return value
  }
  return 'unknown'
}

function normalizeNextPayday(value: unknown): string | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (value === null) return null
  return null
}

function normalizeBlueprint(raw: unknown) {
  if (!isRecord(raw)) return raw
  return {
    ...raw,
    windowDays: typeof raw.windowDays === 'number' ? raw.windowDays : undefined,
    windowAnchor: raw.windowAnchor
      ? normalizeWindowAnchor(raw.windowAnchor)
      : undefined,
    absoluteDeadlineAt:
      typeof raw.absoluteDeadlineAt === 'string' || raw.absoluteDeadlineAt === null
        ? raw.absoluteDeadlineAt
        : undefined,
  }
}

function normalizeOfferRecord(raw: unknown) {
  if (!isRecord(raw)) return raw
  return {
    ...raw,
    expiresAt:
      typeof raw.expiresAt === 'string' || raw.expiresAt === null ? raw.expiresAt : null,
    termsNotes: typeof raw.termsNotes === 'string' ? raw.termsNotes : '',
    requirements: Array.isArray(raw.requirements)
      ? raw.requirements.map((bp) => normalizeBlueprint(bp))
      : [],
    accountConditions: normalizeAccountConditions(raw.accountConditions),
  }
}

function normalizeEnrollmentRecord(raw: unknown) {
  if (!isRecord(raw)) return raw
  return {
    ...raw,
    accountConditions: normalizeAccountConditions(raw.accountConditions),
  }
}

function normalizeRequirement(raw: unknown) {
  if (!isRecord(raw)) return raw
  return {
    ...raw,
    windowDays: typeof raw.windowDays === 'number' ? raw.windowDays : 0,
    windowAnchor: normalizeWindowAnchor(raw.windowAnchor ?? 'open'),
    startsAt: typeof raw.startsAt === 'string' || raw.startsAt === null ? raw.startsAt : null,
    deadlineAt:
      typeof raw.deadlineAt === 'string' || raw.deadlineAt === null ? raw.deadlineAt : null,
    dependsOnRequirementId:
      typeof raw.dependsOnRequirementId === 'string' || raw.dependsOnRequirementId === null
        ? raw.dependsOnRequirementId
        : null,
  }
}
