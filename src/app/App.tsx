import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useChurnStore } from '@/data/store'
import { ThemeSync } from '@/components'
import { parseTransferHash } from '@/data/transfer'
import { AppShell } from './AppShell'
import { TodayPage } from '@/pages/TodayPage'
import { ActivePage } from '@/pages/ActivePage'
import { EnrollmentDetailPage } from '@/pages/EnrollmentDetailPage'
import { WatchPage } from '@/pages/WatchPage'
import { BanksPage } from '@/pages/BanksPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { DevUiPage } from '@/pages/DevUiPage'
import { TransferReceivePage } from '@/pages/TransferReceivePage'

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
      <TransferGate>
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
      </TransferGate>
    </BrowserRouter>
  )
}

function TransferGate({ children }: { children: ReactNode }) {
  const [envelope, setEnvelope] = useState<string | null>(() =>
    typeof window !== 'undefined' ? parseTransferHash(window.location.hash) : null,
  )

  useEffect(() => {
    const sync = () => setEnvelope(parseTransferHash(window.location.hash))
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  if (envelope) {
    return (
      <TransferReceivePage
        envelope={envelope}
        onDismiss={() => setEnvelope(null)}
      />
    )
  }

  return children
}
