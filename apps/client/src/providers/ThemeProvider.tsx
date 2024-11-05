'use client'

import { useRef, useEffect } from 'react'
import { useAppSelector } from '~/store/hooks'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider(props: Readonly<ThemeProviderProps>) {
  const { children } = props

  const isDark = useAppSelector(state => state.dark.isDark)
  const selector = useRef<HTMLElement | null>(null)

  useEffect(() => {
    selector.current = document.querySelector('html')
  }, [])

  useEffect(() => {
    if (isDark === null || !selector.current) return

    selector.current.classList.toggle('dark', isDark)
  }, [isDark, selector])

  return children
}
