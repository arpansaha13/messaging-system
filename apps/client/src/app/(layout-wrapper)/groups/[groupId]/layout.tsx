'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import GroupAvatar from '~common/GroupAvatar'
import ChannelListItemTemplate from '~/components/channel-list-item/Template'
import { Window, WindowBody, WindowPanel, WindowPanelBody } from '~/components/window'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { useGetGroupQuery } from '~/store/features/groups/groups.api.slice'
import { insertChannels, selectChannels } from '~/store/features/channels/channel.slice'
import { _getChannelsOfGroup } from '~/utils/api'

interface GroupsLayoutProps {
  children: React.ReactNode
}

export default function GroupsLayout({ children }: Readonly<GroupsLayoutProps>) {
  const params = useParams()
  const dispatch = useAppDispatch()
  const groupId = useMemo(() => parseInt(params.groupId as string), [params.groupId])
  const { data: group, isSuccess } = useGetGroupQuery(groupId)

  const channels = useAppSelector(state => selectChannels(state, groupId))

  useEffect(() => {
    if (groupId) {
      _getChannelsOfGroup(groupId).then(res => {
        dispatch(insertChannels({ groupId, channels: res }))
      })
    }
  }, [groupId, dispatch])

  if (!isSuccess) return null

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
