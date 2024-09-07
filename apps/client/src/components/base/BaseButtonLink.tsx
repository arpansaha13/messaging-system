import Link, { LinkProps } from 'next/link'
import { memo } from 'react'
import { classNames } from '@arpansaha13/utils'
import type { ReactNode } from 'react'

interface BaseButtonProps extends LinkProps {
  children: ReactNode
  loading?: boolean
  disabled?: boolean
  stretch?: boolean
}

const BaseButtonLoader = () => (
  <div className="absolute aspect-square w-6 animate-spin rounded-full border-y-2 border-gray-50" />
)

function BaseButton({ children, loading = false, disabled = false, stretch = false, ...attrs }: BaseButtonProps) {
  return (
    <Link
      {...attrs}
      className={classNames(
        'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 relative flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        disabled && 'opacity-70',
        stretch && 'w-full',
      )}
    >
      <div className={loading ? 'opacity-0' : ''}>{children}</div>
      {loading && <BaseButtonLoader />}
    </Link>
  )
}
export default memo(BaseButton)
