import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { toggleDark } from '~/store/features/dark/dark.slice'

export function useDark() {
  const dispatch = useAppDispatch()
  const isDark = useAppSelector(state => state.dark.isDark)
  const selector = useRef<HTMLElement | null>(null)

  useEffect(() => {
    selector.current = document.querySelector('html')
  }, [])

  useEffect(() => {
    if (isDark === null) return

    if (isDark) {
      if (!selector.current?.classList.contains('dark')) {
        selector.current?.classList.add('dark')
      }
    } else {
      if (selector.current?.classList.contains('dark')) {
        selector.current?.classList.remove('dark')
      }
    }
  }, [isDark])

  const toggleDarkMode = (newState?: boolean) => {
    dispatch(toggleDark(newState))
  }

  return [isDark!, toggleDarkMode] as const
}

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
