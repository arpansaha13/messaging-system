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
  <div className="absolute w-6 aspect-square border-y-2 border-gray-50 rounded-full animate-spin" />
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
        'flex w-full justify-center rounded-md border py-2 px-4 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors relative',
        !secondary
          ? 'text-white bg-emerald-600 hover:bg-emerald-700 border-transparent'
          : 'text-gray-900 dark:text-gray-100 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50',
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
