import { memo } from 'react'
import Avatar from '~common/Avatar'
import { IContact } from '@pkg/types'

export interface ContactListItemProps extends IContact {
  onClick: () => void
}

const ContactListItem = ({ alias, dp, bio, username, globalName, onClick }: ContactListItemProps) => {
  return (
    <li>
      <button
        className="px-3 w-full text-left hover:bg-gray-200/60 dark:hover:bg-gray-600/40 flex items-center"
        onClick={onClick}
      >
        <Avatar src={dp} />

        <div className="ml-4 py-3 w-full border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <p className="text-base text-black dark:text-gray-50">{alias}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {globalName} • {username}
            </p>
          </div>
          <div className="mt-1 flex justify-between">
            <p className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-1 line-clamp-1">{bio}</p>
          </div>
        </div>
      </button>
    </li>
  )
}
export default memo(ContactListItem)
