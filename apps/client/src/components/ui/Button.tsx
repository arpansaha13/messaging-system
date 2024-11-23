import { classNames } from '@arpansaha13/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonTheme = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  type?: 'button' | 'submit'
  theme?: ButtonTheme
  loading?: boolean
  disabled?: boolean
  stretch?: boolean
}

export default function Button(props: Readonly<ButtonProps>) {
  const {
    children,
    className,
    type = 'button',
    theme = 'primary',
    loading = false,
    disabled = false,
    stretch = false,
    ...attrs
  } = props

  return (
    <button
      type={type}
      disabled={disabled || loading} // disable while loading
      {...attrs}
      className={classNames(
        'relative flex w-full justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        getButtonTheme(theme),
        disabled && 'opacity-70',
        stretch && 'w-full',
        className,
      )}
    >
      <div className={loading ? 'opacity-0' : ''}>{children}</div>
      {loading && <ButtonLoader />}
    </button>
  )
}

const ButtonLoader = () => (
  <div className="absolute aspect-square w-6 animate-spin rounded-full border-y-2 border-gray-50" />
)

function getButtonTheme(theme: ButtonTheme) {
  if (theme === 'primary') {
    return 'bg-brand-600 hover:bg-brand-700 border-transparent text-white focus:ring-brand-500'
  }

  if (theme === 'secondary') {
    return 'border-gray-300 text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800/50 focus:ring-brand-500'
  }

  if (theme === 'danger') {
    return 'bg-red-600 hover:bg-red-700 border-transparent text-white focus:ring-red-500'
  }

  return ''
}
