import Image from 'next/image'
import { classNames, isNullOrUndefined } from '@arpansaha13/utils'

type TwColorShades = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950

interface AvatarProps {
  src: string | null | undefined
  alt?: string

  /** Size of the avatar in 'rem' units. */
  size: number
}

interface AvatarSvgProps {
  size: number
  bgColor: `bg-gray-${TwColorShades}`
  svgColor: `text-gray-${TwColorShades}`
}

export default function Avatar(props: Readonly<AvatarProps>) {
  const { src, size, alt = '' } = props

  if (isNullOrUndefined(src)) {
    return <AvatarSvg size={size} bgColor="bg-gray-500" svgColor="text-gray-300" />
  }

  return (
    <div className="relative" style={{ width: `${size}rem`, height: `${size}rem` }}>
      <Image className="rounded-full" src={src} alt={alt} fill />
    </div>
  )
}

export function AvatarSvg(props: Readonly<AvatarSvgProps>) {
  const { size, bgColor, svgColor } = props

  return (
    <div
      className={classNames('flex-shrink-0 overflow-hidden rounded-full', bgColor)}
      style={{ width: `${size}rem`, height: `${size}rem` }}
    >
      <svg className={classNames('size-full', svgColor)} fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </div>
  )
}
