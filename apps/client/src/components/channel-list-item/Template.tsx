import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid'
import { classNames } from '@arpansaha13/utils'

interface ChannelListItemTemplateProps {
  channelName: string
}

export default function ChannelListItemTemplate(props: Readonly<ChannelListItemTemplateProps>) {
  const { channelName } = props

  return (
    <li className="relative">
      <button className="flex w-full items-center rounded px-3 text-left transition-colors hover:bg-gray-200/80 dark:hover:bg-gray-600/40">
        <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-700">
          <ChatBubbleLeftRightIcon className="size-6 text-gray-600 dark:text-gray-200" />
        </div>

        <div className="ml-4 w-full py-3">
          <div className="flex items-center justify-between">
            <p className="text-base text-black dark:text-gray-50">{channelName}</p>
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
      </button>
    </li>
  )
}
