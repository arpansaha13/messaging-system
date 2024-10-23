'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { GroupAvatar } from '~/components/common'
import ChannelListItemTemplate from '~/components/channel-list-item/Template'
import { Window, WindowBody, WindowPanel, WindowPanelBody } from '~/components/window'
import { useGetChannelsQuery, useGetGroupQuery } from '~/store/features/groups/groups.api.slice'

interface GroupsLayoutProps {
  children: React.ReactNode
}

export default function GroupsLayout({ children }: Readonly<GroupsLayoutProps>) {
  const params = useParams()
  const groupId = useMemo(() => parseInt(params.groupId as string), [params.groupId])
  const { data: group, isSuccess: isFetchGroupSuccess } = useGetGroupQuery(groupId)
  const { data: channels, isSuccess: isFetchChannelsSuccess } = useGetChannelsQuery(groupId)

  if (!isFetchGroupSuccess || !isFetchChannelsSuccess) return null

  return (
    <Window>
      <WindowPanel className="w-[26rem]">
        <div className="bg-gray-50 p-4 shadow dark:bg-gray-800">
          <div className="mt-8 flex items-center gap-4">
            <GroupAvatar src={null} alt="" />

            <div>
              <p className="text-2xl font-bold">{group.name}</p>
            </div>
          </div>
        </div>

        <WindowPanelBody>
          {channels && (
            <ul>
              {channels.map(channel => (
                <ChannelListItemTemplate key={channel.id} channelName={channel.name} />
              ))}
            </ul>
          )}
        </WindowPanelBody>
      </WindowPanel>

      <WindowBody>{children}</WindowBody>
    </Window>
  )
}
