'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import ChannelListItemTemplate from '~/components/channel-list-item/Template'
import { Window, WindowBody, WindowPanel } from '~/components/window'
import { useStore } from '~/store'
import { _getChannelsOfGroup } from '~/utils/api/groups'

interface GroupsLayoutProps {
  children: React.ReactNode
}

export default function GroupsLayout({ children }: Readonly<GroupsLayoutProps>) {
  const params = useParams()
  const [channelsMap, insertChannels] = useStore(state => [state.channelsMap, state.insertChannels])

  const groupId = useMemo(() => parseInt(params.groupId as string), [params.groupId])

  const channels = useMemo(() => (groupId ? (channelsMap.get(groupId) ?? []) : []), [groupId, channelsMap])

  useEffect(() => {
    if (groupId) {
      _getChannelsOfGroup(groupId).then(res => {
        insertChannels(groupId, res)
      })
    }
  }, [groupId, insertChannels])

  return (
    <Window>
      <WindowPanel className="w-[26rem]">
        <ul>
          {channels.map(channel => (
            <ChannelListItemTemplate key={channel.id} channelName={channel.name} />
          ))}
        </ul>
      </WindowPanel>

      <WindowBody>{children}</WindowBody>
    </Window>
  )
}
