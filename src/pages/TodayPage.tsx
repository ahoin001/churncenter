import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import {
  Button,
  Surface,
  StatusChip,
  RevealText,
  Stagger,
  StaggerItem,
  AnimatedMoney,
  WinsTideChart,
  ProjectionChart,
  ChaseProgressChart,
} from '@/components'
import { useChurnStore } from '@/data/store'
import { buildActionQueue, selectUnlockingSoon } from '@/domain/selectors'
import { selectDaysToNextBonus, selectMomentum } from '@/domain/momentum'

export function TodayPage() {
  const data = useChurnStore()
  const momentum = selectMomentum(data)
  const actions = buildActionQueue(data)
  const unlocking = selectUnlockingSoon(data, 45)
  const daysToNext = selectDaysToNextBonus(data)
  const empty = data.enrollments.length === 0 && data.watchlist.length === 0

  if (empty) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2">
          <RevealText as="h1" className="cc-display">
            Your calm bonus HQ
          </RevealText>
          <RevealText as="p" className="cc-body text-cc-ink-secondary" delay={0.05}>
            Track deals, requirements, and re-eligibility without spreadsheet stress.
          </RevealText>
        </header>

        <Surface className="space-y-4" padding="lg">
          <div className="space-y-1">
            <p className="font-semibold text-cc-ink">How to chase an offer</p>
            <p className="cc-body text-cc-ink-secondary">
              Keep it simple — capture the terms once, then let Today nudge the windows.
            </p>
          </div>
          <ol className="space-y-3 text-sm text-cc-ink-secondary">
            <li className="flex gap-3">
              <span className="cc-caption shrink-0 tabular-nums text-cc-accent-ink">1</span>
              <span>
                <span className="font-semibold text-cc-ink">Add the bank</span>, then on Watch pick
                a Savings or Checking pattern — a few money and day fields, plus terms notes for
                quirks.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="cc-caption shrink-0 tabular-nums text-cc-accent-ink">2</span>
              <span>
                <span className="font-semibold text-cc-ink">Save the deal</span> with bonus, capital,
                and expiry. We turn the pattern into fund/hold or DD/spend steps automatically.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="cc-caption shrink-0 tabular-nums text-cc-accent-ink">3</span>
              <span>
                <span className="font-semibold text-cc-ink">Enroll when ready</span>, log progress
                as money moves, then watch clawback and cooldown so you know when you can close
                cleanly.
              </span>
            </li>
          </ol>
          <p className="cc-caption">
            Tip: fill Profile pay details if the offer needs direct deposit — we’ll check whether
            your payday rhythm fits the window.
          </p>
        </Surface>

        <div className="flex flex-wrap gap-3">
          <Link to="/watch">
            <Button>Add an offer</Button>
          </Link>
          <Link to="/banks">
            <Button variant="secondary">Add a bank</Button>
          </Link>
          <Link to="/profile">
            <Button variant="ghost">Set pay profile</Button>
          </Link>
        </div>
      </div>
    )
  }

  const winLine =
    momentum.winCount === 0
      ? 'Your first win is still ahead — keep the tide moving.'
      : momentum.winCount === 1
        ? 'One bonus already in the books. Momentum compounds.'
        : `${momentum.winCount} bonuses already home. This is why you track.`

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <RevealText as="h1" className="cc-display">
              Today
            </RevealText>
            <RevealText as="p" className="cc-body text-cc-ink-secondary" delay={0.05}>
              Wins you already earned, tides still rising, and what needs a gentle nudge.
            </RevealText>
          </div>
          <StatusChip label={`${actions.length} gentle nudges`} tone="accent" />
        </div>

        <Surface elevation="raised" padding="lg" className="overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-2">
              <p className="cc-caption">Brought home</p>
              <p className="cc-numeric-hero text-cc-ink">
                <AnimatedMoney value={momentum.accrued} />
              </p>
              <p className="cc-body text-cc-ink-secondary">{winLine}</p>
            </div>
            <div className="flex flex-col justify-end gap-4 lg:border-l lg:border-cc-hairline lg:pl-8">
              <div>
                <p className="cc-caption">Still in motion</p>
                <p className="text-2xl font-bold tabular-nums tracking-tight text-cc-accent-ink sm:text-3xl">
                  <AnimatedMoney value={momentum.expected} />
                </p>
                <p className="cc-caption mt-1 text-cc-ink-secondary">
                  {daysToNext === null
                    ? 'Set an expected bonus date to project the next post'
                    : daysToNext === 0
                      ? 'Next expected post could land today'
                      : `Next expected post in ${daysToNext} day${daysToNext === 1 ? '' : 's'}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <p className="cc-caption">
                  Lifetime path{' '}
                  <span className="font-semibold text-cc-ink">
                    <AnimatedMoney value={momentum.projectedLifetime} />
                  </span>
                </p>
                {momentum.holdingInClawback > 0 ? (
                  <p className="cc-caption">
                    Protecting{' '}
                    <span className="font-semibold text-cc-ink">
                      <AnimatedMoney value={momentum.holdingInClawback} />
                    </span>{' '}
                    in clawback
                  </p>
                ) : null}
                {momentum.capitalLocked > 0 ? (
                  <p className="cc-caption">
                    Capital parked{' '}
                    <span className="font-semibold text-cc-ink">
                      <AnimatedMoney value={momentum.capitalLocked} />
                    </span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-cc-hairline pt-6">
            <p className="cc-caption mb-2">Your win tide</p>
            <WinsTideChart points={momentum.tide} />
          </div>
        </Surface>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Surface padding="lg">
          <ProjectionChart points={momentum.projection} />
        </Surface>
        <Surface padding="lg">
          <ChaseProgressChart chases={momentum.chases} />
        </Surface>
      </section>

      {unlocking.length > 0 ? (
        <section className="space-y-3">
          <RevealText as="h2" className="cc-title">
            Unlocking soon
          </RevealText>
          <Surface>
            <Stagger className="space-y-2" delayChildren={0.08}>
              {unlocking.slice(0, 4).map((u) => (
                <StaggerItem
                  key={u.enrollment.id}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="font-semibold">{u.institutionName}</span>
                  <span className="cc-caption tabular-nums">
                    {u.days === 0 ? 'today' : `${u.days}d`}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
          </Surface>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <RevealText as="h2" className="cc-title" delay={0.08}>
            Action queue
          </RevealText>
          <Link to="/active" className="cc-caption font-semibold text-cc-accent-ink">
            View active
          </Link>
        </div>

        {actions.length === 0 ? (
          <Surface>
            <p className="cc-body text-cc-ink-secondary">
              You are clear for now. Enjoy the quiet — we will nudge when a tide needs attention.
            </p>
          </Surface>
        ) : (
          <Stagger as="ul" className="space-y-3" delayChildren={0.1}>
            {actions.slice(0, 6).map((item) => (
              <StaggerItem key={item.id} as="li">
                <Link
                  to={
                    item.id.startsWith('pay-profile-')
                      ? '/profile'
                      : item.enrollmentId
                        ? `/active/${item.enrollmentId}`
                        : '/watch'
                  }
                >
                  <Surface
                    className="flex items-center justify-between gap-4 transition-colors hover:bg-cc-surface-raised"
                    padding="md"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-cc-ink">{item.title}</p>
                      <p className="cc-caption">{item.detail}</p>
                    </div>
                    <ArrowRight size={18} weight="light" className="shrink-0 text-cc-muted" />
                  </Surface>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  )
}
