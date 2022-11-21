import { memo } from 'react'

interface AvatarProps {
  src: string | null
  alt?: string
  /**
   * Width of the avatar in 'rem' units.
   * @default 3
   */
  width?: number
  /**
   * Height of the avatar in 'rem' units.
   * @default 3
   */
  height?: number
}

const Avatar = ({ src, width = 3, height = 3, alt = '' }: AvatarProps) => {
  return (
    <>
      {src !== null ? (
        <img
          className="rounded-full"
          src={src}
          alt={alt}
          style={{ width: `${width}rem`, height: `${height}rem` }}
        />
      ) : (
        <div
          className="flex-shrink-0 overflow-hidden rounded-full bg-gray-500"
          style={{ width: `${width}rem`, height: `${height}rem` }}
        >
          <svg
            className="h-full w-full text-gray-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      )}
    </>
  )
}

export default memo(Avatar)
