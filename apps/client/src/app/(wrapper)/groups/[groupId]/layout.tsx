'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Window, WindowBody, WindowPanel, WindowPanelBody } from '~/components/window'
import { ChannelListItem, GroupMemberListItem } from '~/components/list-items'
import GroupHeader from '~/components/group/GroupHeader'
import {
  useGetGroupQuery,
  useGetChannelsQuery,
  useGetGroupMembersQuery,
} from '~/store/features/groups/groups.api.slice'

interface GroupsLayoutProps {
  children: React.ReactNode
}

export default function GroupsLayout({ children }: Readonly<GroupsLayoutProps>) {
  const params = useParams()
  const groupId = useMemo(() => parseInt(params.groupId as string), [params.groupId])
  const { data: group, isSuccess: isFetchGroupSuccess } = useGetGroupQuery(groupId)
  const { data: channels, isSuccess: isFetchChannelsSuccess } = useGetChannelsQuery(groupId)
  const { data: groupMembers, isSuccess: isFetchGroupMembersSuccess } = useGetGroupMembersQuery(groupId)

  if (!isFetchGroupSuccess || !isFetchChannelsSuccess || !isFetchGroupMembersSuccess) return null

  return (
    <Window>
      <WindowPanel>
        <GroupHeader group={group} />

        <WindowPanelBody>
          <ul className="space-y-1">
            {channels.map(channel => (
              <ChannelListItem key={channel.id} channel={channel} />
            ))}
          </ul>
        </WindowPanelBody>
      </WindowPanel>

      <WindowBody>{children}</WindowBody>

      <WindowPanel>
        <div className="bg-gray-50 p-4 shadow dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-300">Members</h2>
        </div>

        <WindowPanelBody>
          <ul className="space-y-1">
            {groupMembers.map(user => (
              <GroupMemberListItem key={user.id} member={user} />
            ))}
          </ul>
        </WindowPanelBody>
      </WindowPanel>
    </Window>
  )
}
