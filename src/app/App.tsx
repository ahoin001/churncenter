import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useChurnStore } from '@/data/store'
import { ThemeSync } from '@/components'
import { AppShell } from './AppShell'
import { TodayPage } from '@/pages/TodayPage'
import { ActivePage } from '@/pages/ActivePage'
import { EnrollmentDetailPage } from '@/pages/EnrollmentDetailPage'
import { WatchPage } from '@/pages/WatchPage'
import { BanksPage } from '@/pages/BanksPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { DevUiPage } from '@/pages/DevUiPage'

export function App() {
  const hydrate = useChurnStore((s) => s.hydrate)
  const hydrated = useChurnStore((s) => s.hydrated)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!hydrated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-cc-bg text-cc-muted">
        <p className="cc-body">Loading your ledger…</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <ThemeSync />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<TodayPage />} />
          <Route path="active" element={<ActivePage />} />
          <Route path="active/:id" element={<EnrollmentDetailPage />} />
          <Route path="watch" element={<WatchPage />} />
          <Route path="banks" element={<BanksPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="dev/ui" element={<DevUiPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
