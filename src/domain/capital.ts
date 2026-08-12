import type { AppData } from './types'
import { selectCapitalLocked } from './selectors'
import { formatMoney } from '@/lib/format'

/** null when liquid capital is unset (0) — no affordability nudges. */
export function selectLiquidAvailable(data: AppData): number | null {
  const liquid = data.preferences.liquidCapital
  if (!(liquid > 0)) return null
  return Math.max(0, liquid - selectCapitalLocked(data))
}

export type CapitalFit = 'unknown' | 'ok' | 'tight'

export function assessCapitalFit(available: number | null, required: number): CapitalFit {
  if (available === null) return 'unknown'
  if (required <= 0) return 'ok'
  return required <= available ? 'ok' : 'tight'
}

export function capitalFitMessage(
  fit: CapitalFit,
  available: number | null,
  required: number,
): string | null {
  if (fit !== 'tight' || available === null) return null
  return `This parks ${formatMoney(required)} but you have about ${formatMoney(available)} free after active chases. Soft heads-up only — you can still save it.`
}
