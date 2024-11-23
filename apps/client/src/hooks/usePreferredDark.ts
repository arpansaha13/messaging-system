import { useEffect, useState } from 'react'

export function usePreferredDark() {
  const [preferredDark, setPreferredDark] = useState(false)

  useEffect(() => {
    const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)')

    const listener = (e: MediaQueryListEvent) => setPreferredDark(e.matches)
    colorSchemeMedia.addEventListener('change', listener)

    // Set initial value
    setPreferredDark(colorSchemeMedia.matches)

    return () => colorSchemeMedia.removeEventListener('change', listener)
  }, [])

  return preferredDark
}
