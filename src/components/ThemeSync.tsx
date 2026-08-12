import { useEffect } from 'react'
import { useChurnStore } from '@/data/store'
import { applyThemeToDocument } from '@/lib/theme'

/** Keeps document theme tokens in sync with preference + OS changes. */
export function ThemeSync() {
  const themeMode = useChurnStore((s) => s.preferences.themeMode)

  useEffect(() => {
    applyThemeToDocument(themeMode)

    if (themeMode !== 'system' || typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeToDocument('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [themeMode])

  return null
}
