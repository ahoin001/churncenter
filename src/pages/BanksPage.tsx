import {
  BankSearchField,
  EmptyState,
  Surface,
  RevealText,
  Stagger,
  StaggerItem,
} from '@/components'
import { useChurnStore } from '@/data/store'
import { cooldownState } from '@/domain/cooldowns'
import { formatShortDate } from '@/lib/format'

export function BanksPage() {
  const data = useChurnStore()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <RevealText as="h1" className="cc-display">
          Banks
        </RevealText>
        <RevealText as="p" className="cc-body mt-2 text-cc-ink-secondary" delay={0.05}>
          Search popular institutions or add your own — duplicates are blocked.
        </RevealText>
      </div>

      <Surface className="space-y-4" padding="lg">
        <RevealText as="h2" className="cc-title">
          Add institution
        </RevealText>
        <BankSearchField
          owned={data.institutions}
          defaultCooldownMonths={data.preferences.defaultCooldownMonths}
          onAdd={(draft) => {
            const result = data.addInstitution(draft)
            if (!result.ok) return { ok: false, error: result.error }
            return { ok: true }
          }}
        />
      </Surface>

      {data.institutions.length === 0 ? (
        <EmptyState
          title="No banks yet"
          body="Search Chase, Ally, Capital One, and more — or add a credit union by name."
        />
      ) : (
        <Stagger as="ul" className="space-y-3" delayChildren={0.08}>
          {data.institutions.map((inst) => {
            const related = data.enrollments.filter((e) => e.institutionId === inst.id)
            const cooling = related.find((e) => e.reEligibleAt)
            const state = cooling?.reEligibleAt
              ? cooldownState(cooling.reEligibleAt)
              : { kind: 'unknown' as const, daysRemaining: null }
            const history = data.relationships.filter((r) => r.institutionId === inst.id)

            return (
              <StaggerItem key={inst.id} as="li">
                <Surface className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold">{inst.name}</p>
                      <p className="cc-caption">
                        Default cooldown {inst.defaultCooldownMonths} months
                      </p>
                    </div>
                    <p className="cc-caption">
                      {state.kind === 'cooling'
                        ? `Unlocks in ${state.daysRemaining}d`
                        : state.kind === 're_eligible'
                          ? 'Re-eligible'
                          : `${related.length} enrollment${related.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  {inst.notes ? (
                    <p className="cc-body text-cc-ink-secondary">{inst.notes}</p>
                  ) : null}
                  {history.length > 0 ? (
                    <div className="space-y-1 border-t border-cc-hairline pt-3">
                      {history.slice(0, 4).map((h) => (
                        <p key={h.id} className="cc-caption">
                          {h.kind} · {h.productLabel} · {formatShortDate(h.at)}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </Surface>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}
    </div>
  )
}
