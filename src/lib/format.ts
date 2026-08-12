import { format, formatDistanceToNowStrict, parseISO, isValid } from 'date-fns'

export function formatMoney(centsOrDollars: number, opts?: { fromCents?: boolean }) {
  const value = opts?.fromCents ? centsOrDollars / 100 : centsOrDollars
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

export function formatShortDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = parseISO(iso)
  if (!isValid(d)) return '—'
  return format(d, 'MMM d, yyyy')
}

export function formatRelative(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = parseISO(iso)
  if (!isValid(d)) return '—'
  return formatDistanceToNowStrict(d, { addSuffix: true })
}

export function daysBetween(aIso: string, bIso: string) {
  const a = parseISO(aIso)
  const b = parseISO(bIso)
  if (!isValid(a) || !isValid(b)) return 0
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}
