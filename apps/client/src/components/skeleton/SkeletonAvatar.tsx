import { classNames } from '@arpansaha13/utils'
import { AvatarSvg } from '~/components/common/Avatar'

interface SkeletonAvatarProps {
  size: number
  pulse?: boolean
}

export default function SkeletonAvatar(props: Readonly<SkeletonAvatarProps>) {
  const { size, pulse = false } = props

  return (
    <div
      className={classNames('flex-shrink-0', pulse && 'animate-pulse')}
      style={{ width: `${size}rem`, height: `${size}rem` }}
    >
      <AvatarSvg size={size} bgColor="bg-gray-500 dark:bg-gray-600" svgColor="text-gray-300 dark:text-gray-400" />
    </div>
  )
}
