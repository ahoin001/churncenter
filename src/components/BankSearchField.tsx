import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { Button } from './Button'
import { Surface } from './Surface'
import { cn } from '@/lib/cn'
import { searchPopularBanks, canAddCustomName } from '@/domain/institutions'
import type { PopularBank } from '@/domain/popularBanks'
import type { Institution } from '@/domain/types'

export type BankDraft = {
  name: string
  notes: string
  defaultCooldownMonths: number
}

type BankSearchFieldProps = {
  owned: Institution[]
  defaultCooldownMonths: number
  onAdd: (draft: BankDraft) => { ok: true } | { ok: false; error: string }
  className?: string
  /** Compact mode hides notes/cooldown until a selection path */
  compact?: boolean
}

export function BankSearchField({
  owned,
  defaultCooldownMonths,
  onAdd,
  className,
  compact = false,
}: BankSearchFieldProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [cooldown, setCooldown] = useState(String(defaultCooldownMonths))
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

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
    )

  useEffect(() => {
    setActiveIndex(0)
  }, [query, suggestions.length, showCustom])

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  function addPopular(bank: PopularBank) {
    setError(null)
    const result = onAdd({
      name: bank.name,
      notes: bank.notes || notes,
      defaultCooldownMonths: bank.defaultCooldownMonths || Number(cooldown) || defaultCooldownMonths,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setQuery('')
    setNotes('')
    setCooldown(String(defaultCooldownMonths))
    setOpen(false)
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
    setQuery('')
    setNotes('')
    setCooldown(String(defaultCooldownMonths))
    setOpen(false)
  }

  const optionCount = suggestions.length + (showCustom ? 1 : 0)

  return (
    <div ref={rootRef} className={cn('space-y-3', className)}>
      <label className="flex w-full flex-col gap-1.5">
        <span className="text-sm font-semibold text-cc-ink-secondary">Search banks</span>
        <div className="relative">
          <MagnifyingGlass
            size={18}
            weight="light"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cc-muted"
          />
          <input
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
                if (activeIndex < suggestions.length) {
                  addPopular(suggestions[activeIndex])
                } else if (showCustom) {
                  addCustom()
                } else if (!customGate.ok && query.trim()) {
                  setError(customGate.reason)
                }
              }
            }}
            placeholder="Chase, Ally, Capital One…"
            className="w-full rounded-cc-md bg-cc-surface py-2.5 pl-10 pr-3.5 text-cc-ink ring-1 ring-cc-border placeholder:text-cc-muted focus:ring-2 focus:ring-cc-accent"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
          />
        </div>
      </label>

      {open ? (
        <Surface padding="sm" elevation="raised" className="overflow-hidden p-1.5" id={listId}>
          {suggestions.length === 0 && !showCustom ? (
            <p className="px-3 py-2.5 text-sm text-cc-muted">
              {query.trim()
                ? customGate.ok
                  ? 'No popular matches — add as a custom bank below.'
                  : customGate.reason
                : 'Start typing to filter popular banks.'}
            </p>
          ) : (
            <ul role="listbox" className="max-h-64 overflow-auto">
              {suggestions.map((bank, index) => (
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
                        <span className="cc-caption">Popular · {bank.defaultCooldownMonths} mo cooldown</span>
                      )}
                    </span>
                    <Plus size={16} weight="light" className="mt-1 shrink-0 text-cc-muted" />
                  </button>
                </li>
              ))}
              {showCustom ? (
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === suggestions.length}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-cc-md px-3 py-2.5 text-left font-semibold text-cc-accent-ink transition-colors',
                      activeIndex === suggestions.length
                        ? 'bg-cc-accent-soft'
                        : 'hover:bg-cc-accent-soft/70',
                    )}
                    onMouseEnter={() => setActiveIndex(suggestions.length)}
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

      {!compact ? (
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
                if (suggestions[0] && suggestions[0].name.toLowerCase() === query.trim().toLowerCase()) {
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
