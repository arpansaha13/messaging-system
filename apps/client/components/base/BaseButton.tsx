import { memo } from 'react'
import { classNames } from '@arpansaha13/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  type?: 'button' | 'submit'
  secondary?: boolean
  loading?: boolean
  disabled?: boolean
  stretch?: boolean
}

const BaseButtonLoader = () => (
  <div className="absolute aspect-square w-6 animate-spin rounded-full border-y-2 border-gray-50" />
)

function BaseButton(props: Readonly<BaseButtonProps>) {
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
        'relative flex w-full justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
        !secondary
          ? 'border-transparent bg-emerald-600 text-white hover:bg-emerald-700'
          : 'border-gray-300 text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800/50',
        disabled && 'opacity-70',
        stretch && 'w-full',
        className,
      )}
    >
      <div className={loading ? 'opacity-0' : ''}>{children}</div>
      {loading && <BaseButtonLoader />}
    </button>
  )
}
export default memo(BaseButton)
