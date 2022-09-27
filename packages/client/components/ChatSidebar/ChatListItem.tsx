import type { ChatListItemData } from '../../types'

interface PropType {
  person: ChatListItemData
}

export default function ChatListItem({ person }: PropType) {
  return (
    <>
      <img className="h-12 w-12 rounded-full" src={ person.dp } alt="" />
      <div className="ml-4 py-3 h-full w-full border-b border-gray-700">
        <div className='flex justify-between'>
          <p className="text-base text-gray-50">{person.name}</p>
          <p className="text-xs text-gray-400 flex items-end">
            <span>{person.time}</span>
          </p>
        </div>
        <div className='flex justify-between'>
          <p className="text-sm text-gray-400">{person.latestMsg}</p>
        </div>
      </div>
    </>
  )
}
