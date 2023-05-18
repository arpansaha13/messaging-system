import { memo } from 'react'
import { classNames } from '@arpansaha13/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  type?: 'button' | 'submit'
  loading?: boolean
  disabled?: boolean
  stretch?: boolean
}

const BaseButtonLoader = () => (
  <div className="absolute w-6 aspect-square border-y-2 border-gray-50 rounded-full animate-spin" />
)

function BaseButton({
  children,
  type = 'button',
  loading = false,
  disabled = false,
  stretch = false,
  ...attrs
}: BaseButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading} // disable while loading
      {...attrs}
      className={classNames(
        'flex w-full justify-center rounded-md border border-transparent bg-emerald-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors relative',
        disabled && 'opacity-70',
        stretch && 'w-full',
      )}
    >
      <div className={loading ? 'opacity-0' : ''}>{children}</div>
      {loading && <BaseButtonLoader />}
    </button>
  )
}
export default memo(BaseButton)
