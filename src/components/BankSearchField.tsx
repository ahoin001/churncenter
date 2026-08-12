import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, MagnifyingGlass, Plus, X } from '@phosphor-icons/react'
import { Button } from './Button'
import { Surface } from './Surface'
import { cn } from '@/lib/cn'
import {
  canAddCustomName,
  normalizeInstitutionName,
  searchPopularBanks,
} from '@/domain/institutions'
import type { PopularBank } from '@/domain/popularBanks'
import type { Institution } from '@/domain/types'

export type BankDraft = {
  name: string
  notes: string
  defaultCooldownMonths: number
}

export type BankAddResult =
  | { ok: true; id?: string }
  | { ok: false; error: string }

type BankSearchFieldProps = {
  owned: Institution[]
  defaultCooldownMonths: number
  onAdd: (draft: BankDraft) => BankAddResult
  className?: string
  /** Compact mode hides notes/cooldown until a selection path (Banks page uses full). */
  compact?: boolean
  /**
   * When set, field doubles as bank picker: pick an owned bank or add+select.
   * Used on Watch offer form.
   */
  selectedId?: string | null
  onSelect?: (institutionId: string) => void
  label?: string
  placeholder?: string
}

function filterOwnedBanks(owned: Institution[], query: string, limit = 8): Institution[] {
  const q = normalizeInstitutionName(query)
  if (!q) return owned.slice(0, limit)
  return owned
    .filter((inst) => normalizeInstitutionName(inst.name).includes(q))
    .slice(0, limit)
}

export function BankSearchField({
  owned,
  defaultCooldownMonths,
  onAdd,
  className,
  compact = false,
  selectedId = null,
  onSelect,
  label,
  placeholder = 'Chase, Ally, Capital One…',
}: BankSearchFieldProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isPicker = typeof onSelect === 'function'
  const selected = owned.find((i) => i.id === selectedId) ?? null

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [cooldown, setCooldown] = useState(String(defaultCooldownMonths))
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [editing, setEditing] = useState(!selected)

  const ownedMatches = useMemo(
    () => (isPicker ? filterOwnedBanks(owned, query, 8) : []),
    [isPicker, owned, query],
  )

  const suggestions = useMemo(
    () => searchPopularBanks(query, owned, 8),
    [query, owned],
  )

  const customGate = useMemo(
    () => canAddCustomName(query, owned),
    [query, owned],
  )

  const showCustom =
    query.trim().length > 0 &&
    customGate.ok &&
    !suggestions.some(
      (bank) => bank.name.toLowerCase() === query.trim().toLowerCase(),
    ) &&
    !ownedMatches.some(
      (inst) => inst.name.toLowerCase() === query.trim().toLowerCase(),
    )

  const optionCount =
    ownedMatches.length + suggestions.length + (showCustom ? 1 : 0)

  const fieldLabel =
    label ?? (isPicker ? 'Bank' : 'Search banks')

  useEffect(() => {
    setActiveIndex(0)
  }, [query, ownedMatches.length, suggestions.length, showCustom])

  useEffect(() => {
    if (!selectedId) {
      setEditing(true)
      return
    }
    if (selected) setEditing(false)
  }, [selectedId, selected])

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        if (isPicker && selected) setEditing(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [isPicker, selected])

  function resetDraft() {
    setQuery('')
    setNotes('')
    setCooldown(String(defaultCooldownMonths))
    setOpen(false)
    setError(null)
  }

  function selectOwned(inst: Institution) {
    setError(null)
    onSelect?.(inst.id)
    resetDraft()
    setEditing(false)
  }

  function addPopular(bank: PopularBank) {
    setError(null)
    const result = onAdd({
      name: bank.name,
      notes: bank.notes || notes,
      defaultCooldownMonths:
        bank.defaultCooldownMonths || Number(cooldown) || defaultCooldownMonths,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (result.id && onSelect) onSelect(result.id)
    resetDraft()
    if (isPicker) setEditing(false)
  }

  function addCustom() {
    setError(null)
    if (!customGate.ok) {
      setError(customGate.reason)
      return
    }
    const result = onAdd({
      name: query.trim(),
      notes,
      defaultCooldownMonths: Number(cooldown) || defaultCooldownMonths,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (result.id && onSelect) onSelect(result.id)
    resetDraft()
    if (isPicker) setEditing(false)
  }

  function activateOption(index: number) {
    if (index < ownedMatches.length) {
      selectOwned(ownedMatches[index])
      return
    }
    const popularIndex = index - ownedMatches.length
    if (popularIndex < suggestions.length) {
      addPopular(suggestions[popularIndex])
      return
    }
    if (showCustom) addCustom()
  }

  const showSelectedChip = isPicker && selected && !editing

  return (
    <div ref={rootRef} className={cn('space-y-3', className)}>
      <label className="flex w-full flex-col gap-1.5">
        <span className="text-sm font-semibold text-cc-ink-secondary">{fieldLabel}</span>

        {showSelectedChip ? (
          <div className="flex items-center gap-2 rounded-cc-md bg-cc-surface px-3 py-2 ring-1 ring-cc-border">
            <Check size={16} weight="bold" className="shrink-0 text-cc-accent-ink" />
            <button
              type="button"
              className="min-w-0 flex-1 text-left font-semibold text-cc-ink"
              onClick={() => {
                setEditing(true)
                setQuery('')
                setOpen(true)
                requestAnimationFrame(() => inputRef.current?.focus())
              }}
            >
              {selected.name}
            </button>
            <button
              type="button"
              aria-label="Change bank"
              className="inline-flex h-8 w-8 items-center justify-center rounded-cc-full text-cc-muted hover:bg-cc-bg-soft hover:text-cc-ink"
              onClick={() => {
                setEditing(true)
                setQuery('')
                setOpen(true)
                requestAnimationFrame(() => inputRef.current?.focus())
              }}
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <MagnifyingGlass
              size={18}
              weight="light"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cc-muted"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setError(null)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
                  setOpen(true)
                  return
                }
                if (e.key === 'Escape') {
                  setOpen(false)
                  if (isPicker && selected) setEditing(false)
                  return
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActiveIndex((i) => Math.min(i + 1, Math.max(optionCount - 1, 0)))
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActiveIndex((i) => Math.max(i - 1, 0))
                }
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (optionCount === 0) {
                    if (!customGate.ok && query.trim()) setError(customGate.reason)
                    return
                  }
                  activateOption(activeIndex)
                }
              }}
              placeholder={
                isPicker && owned.length > 0
                  ? 'Search your banks or add one…'
                  : placeholder
              }
              className="w-full rounded-cc-md bg-cc-surface py-2.5 pl-10 pr-3.5 text-cc-ink ring-1 ring-cc-border placeholder:text-cc-muted focus:ring-2 focus:ring-cc-accent"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              autoComplete="off"
            />
          </div>
        )}
      </label>

      {open && !showSelectedChip ? (
        <Surface padding="sm" elevation="raised" className="overflow-hidden p-1.5" id={listId}>
          {optionCount === 0 ? (
            <p className="px-3 py-2.5 text-sm text-cc-muted">
              {query.trim()
                ? customGate.ok
                  ? 'No matches — add as a custom bank.'
                  : customGate.reason
                : isPicker
                  ? 'Type to find a bank you already added, or pick a popular one.'
                  : 'Start typing to filter popular banks.'}
            </p>
          ) : (
            <ul role="listbox" className="max-h-72 overflow-auto">
              {ownedMatches.length > 0 ? (
                <li className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-cc-muted">
                  Your banks
                </li>
              ) : null}
              {ownedMatches.map((inst, index) => (
                <li key={inst.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    className={cn(
                      'flex w-full items-start justify-between gap-3 rounded-cc-md px-3 py-2.5 text-left transition-colors',
                      activeIndex === index ? 'bg-cc-bg-soft' : 'hover:bg-cc-bg-soft/70',
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOwned(inst)}
                  >
                    <span>
                      <span className="block font-semibold text-cc-ink">{inst.name}</span>
                      <span className="cc-caption">Already in your ledger</span>
                    </span>
                    <Check size={16} weight="bold" className="mt-1 shrink-0 text-cc-accent-ink" />
                  </button>
                </li>
              ))}

              {suggestions.length > 0 ? (
                <li className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-cc-muted">
                  {ownedMatches.length > 0 ? 'Add bank' : 'Popular'}
                </li>
              ) : null}
              {suggestions.map((bank, i) => {
                const index = ownedMatches.length + i
                return (
                  <li key={bank.slug}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={activeIndex === index}
                      className={cn(
                        'flex w-full items-start justify-between gap-3 rounded-cc-md px-3 py-2.5 text-left transition-colors',
                        activeIndex === index ? 'bg-cc-bg-soft' : 'hover:bg-cc-bg-soft/70',
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => addPopular(bank)}
                    >
                      <span>
                        <span className="block font-semibold text-cc-ink">{bank.name}</span>
                        {bank.notes ? (
                          <span className="cc-caption line-clamp-1">{bank.notes}</span>
                        ) : (
                          <span className="cc-caption">
                            Popular · {bank.defaultCooldownMonths} mo cooldown
                          </span>
                        )}
                      </span>
                      <Plus size={16} weight="light" className="mt-1 shrink-0 text-cc-muted" />
                    </button>
                  </li>
                )
              })}

              {showCustom ? (
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === ownedMatches.length + suggestions.length}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-cc-md px-3 py-2.5 text-left font-semibold text-cc-accent-ink transition-colors',
                      activeIndex === ownedMatches.length + suggestions.length
                        ? 'bg-cc-accent-soft'
                        : 'hover:bg-cc-accent-soft/70',
                    )}
                    onMouseEnter={() =>
                      setActiveIndex(ownedMatches.length + suggestions.length)
                    }
                    onClick={addCustom}
                  >
                    <Plus size={16} weight="bold" />
                    Add “{query.trim()}” as custom bank
                  </button>
                </li>
              ) : null}
            </ul>
          )}
        </Surface>
      ) : null}

      {!compact && !isPicker ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-cc-ink-secondary">
              Notes (optional, for custom adds)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 w-full resize-y rounded-cc-md bg-cc-surface px-3.5 py-2.5 text-cc-ink ring-1 ring-cc-border placeholder:text-cc-muted focus:ring-2 focus:ring-cc-accent"
              placeholder="Branch quirks, product rules…"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-cc-ink-secondary">
              Default cooldown (months)
            </span>
            <input
              type="number"
              min={0}
              value={cooldown}
              onChange={(e) => setCooldown(e.target.value)}
              className="w-full rounded-cc-md bg-cc-surface px-3.5 py-2.5 text-cc-ink ring-1 ring-cc-border focus:ring-2 focus:ring-cc-accent"
            />
          </label>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!query.trim()}
              onClick={() => {
                if (
                  suggestions[0] &&
                  suggestions[0].name.toLowerCase() === query.trim().toLowerCase()
                ) {
                  addPopular(suggestions[0])
                  return
                }
                addCustom()
              }}
            >
              Add bank
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm font-medium text-cc-danger">{error}</p> : null}
    </div>
  )
}
