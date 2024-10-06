import Image from 'next/image'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { UserGroupIcon } from '@heroicons/react/24/solid'

interface GroupAvatarProps {
  src: string | null | undefined
  alt?: string
  /**
   * Width of the avatar in 'rem' units.
   * @default 4
   */
  width?: number
  /**
   * Height of the avatar in 'rem' units.
   * @default 4
   */
  height?: number
}

export default function GroupAvatar(props: Readonly<GroupAvatarProps>) {
  const { src, width = 4, height = 4, alt = '' } = props

  if (isNullOrUndefined(src)) {
    return (
      <div
        className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-500"
        style={{ width: `${width}rem`, height: `${height}rem` }}
      >
        <UserGroupIcon className="size-3/4 text-gray-200" />
      </div>
    )
  }

  return (
    <div className="relative" style={{ width: `${width}rem`, height: `${height}rem` }}>
      <Image className="rounded-full" src={src} alt={alt} fill />
    </div>
  )
}
