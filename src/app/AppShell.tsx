import { NavLink, Outlet } from 'react-router-dom'
import {
  Bank,
  BookmarkSimple,
  CirclesFour,
  GearSix,
  House,
  User,
} from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import { Atmosphere, ThemeQuickToggle } from '@/components'
import { useChurnStore } from '@/data/store'
import type { ThemeMode } from '@/lib/theme'

const nav = [
  { to: '/', label: 'Today', icon: House, end: true },
  { to: '/active', label: 'Active', icon: CirclesFour },
  { to: '/watch', label: 'Watch', icon: BookmarkSimple },
  { to: '/banks', label: 'Banks', icon: Bank },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'More', icon: GearSix },
]

export function AppShell() {
  const themeMode = useChurnStore((s) => s.preferences.themeMode)
  const setPreference = useChurnStore((s) => s.setPreference)

  return (
    <div className="relative min-h-[100dvh] text-cc-ink">
      <Atmosphere />

      <div className="mx-auto flex min-h-[100dvh] max-w-[1400px]">
        <aside className="sticky top-0 hidden h-[100dvh] w-56 shrink-0 flex-col gap-8 px-5 py-8 lg:flex">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold tracking-tight">ChurnCenter</p>
              <p className="cc-caption mt-1">Clearwater HQ</p>
            </div>
            <ThemeQuickToggle
              mode={themeMode}
              onChange={(mode) => setPreference('themeMode', mode)}
            />
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-cc-md px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-cc-surface text-cc-ink shadow-cc-surface ring-1 ring-cc-hairline'
                      : 'text-cc-ink-secondary hover:bg-cc-bg-soft hover:text-cc-ink',
                  )
                }
              >
                <item.icon size={20} weight="light" />
                {item.label === 'More' ? 'Settings' : item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="relative min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="mb-4 flex justify-end lg:hidden">
            <ThemeQuickToggle
              mode={themeMode}
              onChange={(mode: ThemeMode) => setPreference('themeMode', mode)}
            />
          </div>
          {/*
            No AnimatePresence around routes.
            mode="wait" + spring exits left the outlet blank when navigation
            interrupted an in-flight exit/enter (Profile/Settings especially).
            Pages own light RevealText / Stagger accents only.
          */}
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cc-hairline bg-cc-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
        <ul className="mx-auto flex max-w-lg items-stretch justify-between">
          {nav.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 rounded-cc-md px-1 py-1.5 text-[11px] font-semibold',
                    isActive ? 'text-cc-accent-ink' : 'text-cc-muted',
                  )
                }
              >
                <item.icon size={22} weight="light" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
