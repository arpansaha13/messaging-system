import { classNames } from '@arpansaha13/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  type?: 'button' | 'submit'
  secondary?: boolean
  loading?: boolean
  disabled?: boolean
  stretch?: boolean
}

const ButtonLoader = () => (
  <div className="absolute aspect-square w-6 animate-spin rounded-full border-y-2 border-gray-50" />
)

export default function Button(props: Readonly<ButtonProps>) {
  const {
    children,
    className,
    type = 'button',
    secondary = false,
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
        'focus:ring-brand-500 relative flex w-full justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        !secondary
          ? 'bg-brand-600 hover:bg-brand-700 border-transparent text-white'
          : 'border-gray-300 text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800/50',
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
