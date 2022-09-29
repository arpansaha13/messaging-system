import { memo } from 'react'

import type { ChatListItemType } from '../../types'

interface ChatListItemProps {
  chatListItem: ChatListItemType
}

const ChatListItem = ({ chatListItem }: ChatListItemProps) => {
  return (
    <>
      <img className="h-12 w-12 rounded-full" src={ chatListItem.dp } alt="" />
      <div className="ml-4 py-3 h-full w-full border-b border-gray-700">
        <div className='flex justify-between'>
          <p className="text-base text-gray-50">{ chatListItem.name }</p>
          <p className="text-xs text-gray-400 flex items-end">
            <span>{ chatListItem.time }</span>
          </p>
        </div>
        <div className='flex justify-between'>
          <p className="text-sm text-gray-400 line-clamp-1">{ chatListItem.latestMsg }</p>
        </div>
      </div>
    </>
  )
}
export default memo(ChatListItem)
