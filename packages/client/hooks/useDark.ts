import { useEffect, useRef } from 'react'
import { useMount } from 'react-use'
import create from 'zustand'

interface DarkState {
  preferredDark: boolean
  isDark: boolean
  toggleDark: (newState?: boolean) => void
  setPreferredDark: (newState?: boolean) => void
}

export const useDarkState = create<DarkState>(set => ({
  preferredDark: false,
  isDark: false,
  toggleDark(newState?: boolean) {
    if (typeof newState !== 'undefined') {
      set(() => ({ isDark: newState }))
    } else {
      set(state => ({ isDark: !state.isDark }))
    }
  },
  setPreferredDark(newState?: boolean) {
    if (typeof newState !== 'undefined') {
      set(() => ({ preferredDark: newState }))
    } else {
      set(state => ({ preferredDark: !state.isDark }))
    }
  },
}))

/**
 * Reactive color scheme preference. This hook does not manipulate the DOM.
 *
 * This hook will cause a rerender whenever system theme preference change.
 */
export function usePreferredDark() {
  const preferredDark = useDarkState(state => state.preferredDark)
  const setPreferredDark = useDarkState(state => state.setPreferredDark)

  const colorSchemeMedia = useRef<MediaQueryList | null>(null)

  // Update preferredDark whenever color-scheme changes
  useEffect(() => {
    function listener(e: MediaQueryListEvent) {
      setPreferredDark(e.matches)
    }

    colorSchemeMedia.current = window.matchMedia('(prefers-color-scheme: dark)')

    // Set initial value for preferredDark
    if (colorSchemeMedia.current.matches && colorSchemeMedia.current.matches !== preferredDark) {
      setPreferredDark(true)
    }

    colorSchemeMedia.current.addEventListener('change', listener)

    return () => colorSchemeMedia.current?.removeEventListener('change', listener)
  }, [preferredDark, setPreferredDark])

  return preferredDark
}

/**
 * Adds the 'dark' class in the `html` tag. This hook paired with the `darkMode: 'class'` config of Tailwind can be used to toggle between light and dark modes.
 *
 * Initial value will be set to the default system theme preference. This hook will **not** cause a rerender when system theme preference change.
 */
export function useDark() {
  const isDark = useDarkState(state => state.isDark)
  const toggleDark = useDarkState(state => state.toggleDark)
  const setPreferredDark = useDarkState(state => state.setPreferredDark)

  const selector = useRef<HTMLElement | null>(null)

  useMount(() => {
    selector.current = document.querySelector('html')

    // Set initial value will be set to the default system theme preference.
    const defaultPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
    toggleDark(defaultPreference)
    setPreferredDark(defaultPreference)
  })

  useEffect(() => {
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

  return [isDark, toggleDark] as const
}
