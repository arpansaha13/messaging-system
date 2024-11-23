import type { IUser } from '@shared/types/client'
import { Avatar } from '~/components/common'
import GlobalName from '~/components/GlobalName'

interface GroupMemberListItemProps {
  member: IUser
}

export default function GroupMemberListItem(props: Readonly<GroupMemberListItemProps>) {
  const { member } = props

  return (
    <li className="relative">
      <div className="flex w-full items-center rounded px-3 text-left transition-colors hover:bg-gray-200/80 dark:hover:bg-gray-600/40">
        <Avatar src={member.dp} size={3} />

        <div className="ml-4 w-full py-3">
          <div className="flex justify-between">
            <p className="text-base text-black dark:text-gray-50">
              {member.contact ? member.contact.alias : <GlobalName name={member.globalName} />}
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm italic text-gray-500 dark:text-gray-400">
              {member.contact ? `${member.globalName} • @${member.username}` : `@${member.username}`}
            </p>
          </div>
        </div>
      </div>
    </li>
  )
}
