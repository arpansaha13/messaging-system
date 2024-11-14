import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid'
import { classNames } from '@arpansaha13/utils'
import type { IChannel, IGroup } from '@shared/types/client'
import Link from 'next/link'

interface ChannelListItemProps {
  channel: IChannel
  groupId: IGroup['id']
}

export default function ChannelListItem(props: Readonly<ChannelListItemProps>) {
  const { channel, groupId } = props
  const href = `/groups/${groupId}/${channel.id}`

  const params = useParams()
  const channelId = useMemo(() => parseInt(params.channelId as string), [params.channelId])

  return (
    <li className="relative">
      <Link
        href={href}
        className={classNames(
          'flex w-full items-center rounded px-3 text-left transition-colors',
          channel.id === channelId
            ? 'bg-gray-300/65 hover:bg-gray-400/40 dark:bg-gray-700/80 dark:hover:bg-gray-600/80'
            : 'hover:bg-gray-200/80 dark:hover:bg-gray-600/40',
        )}
      >
        <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600">
          <ChatBubbleLeftRightIcon className="size-6 text-gray-600 dark:text-gray-200" />
        </div>

        <div className="ml-4 w-full py-3">
          <div className="flex items-center justify-between">
            <p className="text-base text-black dark:text-gray-50">{channel.name}</p>
          </div>
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <p
              className={classNames(
                'flex items-center space-x-1 text-sm',
                'h-5', // same as line-height of 'text-sm'
              )}
            ></p>
          </div>
        </div>
      </Link>
    </li>
  )
}
