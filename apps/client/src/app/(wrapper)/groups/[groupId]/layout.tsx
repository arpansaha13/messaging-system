'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { GroupAvatar, Separator } from '~/components/common'
import { Window, WindowBody, WindowPanel, WindowPanelBody } from '~/components/window'
import { ChannelListItem, GroupMemberListItem } from '~/components/list-items'
import {
  useGetGroupQuery,
  useGetChannelsQuery,
  useGetGroupMembersQuery,
} from '~/store/features/groups/groups.api.slice'
import { XMarkIcon } from '@heroicons/react/24/outline'
import AddChannel from './AddChannel'
import InvitePeople from './InvitePeople'

interface GroupsLayoutProps {
  children: React.ReactNode
}

export default function GroupsLayout({ children }: Readonly<GroupsLayoutProps>) {
  const params = useParams()
  const groupId = useMemo(() => parseInt(params.groupId as string), [params.groupId])
  const { data: group, isSuccess: isFetchGroupSuccess } = useGetGroupQuery(groupId)
  const { data: channels, isSuccess: isFetchChannelsSuccess } = useGetChannelsQuery(groupId)
  const { data: groupMembers, isSuccess: isFetchGroupMembersSuccess } = useGetGroupMembersQuery(groupId)
  const [panelOpen, setPanelOpen] = useState(false)

  function openGroupInfoPanel() {
    setPanelOpen(true)
  }
  function closeGroupInfoPanel() {
    setPanelOpen(false)
  }

  if (!isFetchGroupSuccess || !isFetchChannelsSuccess || !isFetchGroupMembersSuccess) return null

  return (
    <Window>
      <WindowPanel>
        <button className="relative block w-full bg-gray-50 p-4 shadow dark:bg-gray-800" onClick={openGroupInfoPanel}>
          <div className="mt-8 flex items-center gap-4">
            <GroupAvatar src={null} alt="" size={4} />

            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
            </div>
          </div>
        </button>

        <WindowPanelBody>
          <ul className="space-y-1">
            {channels.map(channel => (
              <ChannelListItem key={channel.id} channel={channel} groupId={group.id} />
            ))}
          </ul>
        </WindowPanelBody>
      </WindowPanel>

      <WindowBody>{children}</WindowBody>

      {panelOpen && (
        <WindowPanel>
          <div className="flex items-center gap-2.5 bg-gray-50 p-3 shadow dark:bg-gray-800">
            <button
              type="button"
              className="focus:ring-brand-500 rounded-full p-1.5 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 dark:hover:bg-gray-700"
              onClick={closeGroupInfoPanel}
            >
              <XMarkIcon className="size-6" />
            </button>
            <h2 className="text-lg font-semibold dark:text-gray-300">Group Info</h2>
          </div>

          <WindowPanelBody>
            <div className="space-y-1">
              <AddChannel group={group} />
              <InvitePeople group={group} />
            </div>

            <Separator />

            <ul className="space-y-1">
              <h3 className="mb-2 px-3 py-2 font-semibold dark:text-gray-300">Members</h3>

              {groupMembers.map(user => (
                <GroupMemberListItem key={user.id} member={user} />
              ))}
            </ul>
          </WindowPanelBody>
        </WindowPanel>
      )}
    </Window>
  )
}
