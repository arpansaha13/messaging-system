import { memo } from 'react'
// Components
import Avatar from '../Avatar'

export interface StackedListItemProps {
  name: string | null
  dp: string | null
  bio: string
  onClick: () => void
}

const ContactListItem = ({ name, dp, bio, onClick }: StackedListItemProps) => {
  return (
    <li>
      <button className="px-3 w-full text-left hover:bg-gray-600/40 flex items-center relative" onClick={onClick}>
        <span className="absolute inset-0" />
        <Avatar src={dp} />

        <div className="ml-4 py-3 w-full border-b border-gray-700">
          <div className="flex justify-between">
            <p className="text-base text-gray-50">{name}</p>
          </div>
          <div className="flex justify-between">
            <p className="flex items-center text-sm text-gray-400 space-x-1 line-clamp-1">{bio}</p>
          </div>
        </div>
      </button>
    </li>
  )
}
export default memo(ContactListItem)
