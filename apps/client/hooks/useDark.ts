import { useEffect, useRef, useState } from 'react'
import create from 'zustand'
import { persist } from 'zustand/middleware'

interface DarkState {
  isDark: boolean | null
  toggleDark: (newState?: boolean) => void
}

export const useDarkState = create<DarkState>()(
  persist(
    set => ({
      isDark: null,
      toggleDark(newState?: boolean) {
        if (typeof newState !== 'undefined') {
          set(() => ({ isDark: newState }))
        } else {
          set(state => ({ isDark: !state.isDark }))
        }
      },
    }),
    {
      name: 'wp-clone-color-mode',
      getStorage: () => localStorage,
    },
  ),
)

/**
 * Reactive color scheme preference. This hook does not manipulate the DOM.
 *
 * This hook will cause a rerender whenever system theme preference change.
 */
export function usePreferredDark() {
  const [preferredDark, setPreferredDark] = useState(false)

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

interface UseDarkOptions {
  /**
   * Default color mode.
   * @default 'light'
   */
  default?: 'light' | 'dark'
}

/**
 * Adds the 'dark' class in the `html` tag.
 * This hook paired with the `darkMode: 'class'` config of Tailwind can be used to toggle between light and dark modes.
 *
 * The selected state will be persisted in local storage.
 *
 * This hook will **not** cause a rerender when system theme preference change.
 */
export function useDark(options?: UseDarkOptions) {
  const [isDark, toggleDark] = useDarkState(state => [state.isDark, state.toggleDark])
  const selector = useRef<HTMLElement | null>(null)

  useEffect(() => {
    selector.current = document.querySelector('html')
    if (isDark === null) toggleDark((options?.default ?? 'light') === 'dark')
    else toggleDark(isDark)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  return [isDark!, toggleDark] as const
}
