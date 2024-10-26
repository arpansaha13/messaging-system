import { classNames } from '@arpansaha13/utils'
import SkeletonAvatar from './SkeletonAvatar'
import SkeletonParagraph from './SkeletonParagraph'

interface SkeletonChatBodyMessageProps {
  direction: 'left' | 'right'
  lines: number
}

export default function SkeletonChat() {
  return (
    <div className="flex h-full flex-col">
      <div className="relative z-10 flex items-center justify-between bg-gray-800 px-4 py-2.5">
        <SkeletonChatHeader />
      </div>

      <div className="flex flex-grow flex-col justify-end bg-gray-900">
        <SkeletonChatBody />
      </div>

      <div className="relative z-10 flex w-full items-center space-x-1 bg-gray-800 px-4 py-2.5">
        <SkeletonChatFooter />
      </div>
    </div>
  )
}

function SkeletonChatHeader() {
  return (
    <div className="flex animate-pulse items-center space-x-3">
      <SkeletonAvatar size={2.5} />

      <div>
        <SkeletonParagraph className="h-5 w-32" />
      </div>
    </div>
  )
}

function SkeletonChatBody() {
  return (
    <div className="scrollbar animate-pulse overflow-y-scroll px-20 py-4">
      <SkeletonChatBodyMessage lines={2} />
      <SkeletonChatBodyMessage lines={1} />
      <SkeletonChatBodyMessage direction="right" lines={3} />
      <SkeletonChatBodyMessage lines={1} />
      <SkeletonChatBodyMessage direction="right" lines={2} />
    </div>
  )
}

function SkeletonChatBodyMessage(props: Readonly<SkeletonChatBodyMessageProps>) {
  const { direction, lines } = props

  return (
    <div className={classNames('mb-4 w-max', direction === 'right' && 'ml-auto')}>
      <div className="relative rounded-lg border-b border-gray-400/50 bg-gray-700 p-2 last:mb-0 lg:max-w-lg xl:max-w-xl dark:border-none">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex h-5 items-center">
            <SkeletonParagraph className={classNames('h-3.5', i === lines - 1 ? 'w-60' : 'w-96')} />
          </div>
        ))}
      </div>
      <div className="mt-0.5 flex justify-end">
        <div className={classNames('my-1 flex min-w-[4.5rem] items-center', direction === 'right' && 'justify-end')}>
          <SkeletonParagraph className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

function SkeletonChatFooter() {
  return (
    <div className="flex-grow px-1">
      <div className="h-10 animate-pulse rounded-lg bg-gray-700/70 shadow" />
    </div>
  )
}
