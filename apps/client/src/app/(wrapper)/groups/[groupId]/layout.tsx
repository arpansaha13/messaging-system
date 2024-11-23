'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { GroupAvatar, Separator } from '~/components/common'
import { Window, WindowBody, WindowPanel, WindowPanelBody } from '~/components/window'
import { ChannelListItem, GroupMemberListItem } from '~/components/list-items'
import { SkeletonChannelList, SkeletonGroupMembersList, SkeletonParagraph } from '~/components/skeleton'
import AddChannel from './AddChannel'
import InvitePeople from './InvitePeople'
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
  const [panelOpen, setPanelOpen] = useState(false)

  function openGroupInfoPanel() {
    setPanelOpen(true)
  }
  function closeGroupInfoPanel() {
    setPanelOpen(false)
  }

  return (
    <Window>
      <WindowPanel>
        <button
          className="relative block w-full bg-gray-50 p-4 text-left shadow dark:bg-gray-800"
          onClick={openGroupInfoPanel}
        >
          <div className="mt-8 flex items-center gap-4">
            <GroupAvatar src={null} alt="" size={4} />

            <div>
              {!isFetchGroupSuccess ? (
                <SkeletonParagraph className="h-6 w-36 animate-pulse" />
              ) : (
                <h1 className="text-2xl font-bold">{group.name}</h1>
              )}
            </div>
          </div>
        </button>

        <WindowPanelBody>
          {!isFetchChannelsSuccess || !isFetchGroupSuccess ? (
            <SkeletonChannelList />
          ) : (
            <ul className="space-y-1">
              {channels.map(channel => (
                <ChannelListItem key={channel.id} channel={channel} groupId={group.id} />
              ))}
            </ul>
          )}
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
            {!isFetchGroupSuccess ? (
              <SkeletonGroupInfoButtons />
            ) : (
              <div className="space-y-1">
                <AddChannel group={group} />
                <InvitePeople group={group} />
              </div>
            )}

            <Separator />

            <div>
              <h3 className="mb-2 px-3 py-2 font-semibold dark:text-gray-300">Members</h3>

              <ul className="space-y-1">
                {!isFetchGroupMembersSuccess ? (
                  <SkeletonGroupMembersList />
                ) : (
                  groupMembers.map(user => <GroupMemberListItem key={user.id} member={user} />)
                )}
              </ul>
            </div>
          </WindowPanelBody>
        </WindowPanel>
      )}
    </Window>
  )
}

function SkeletonGroupInfoButtons() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex w-full animate-pulse items-center gap-3 rounded px-4 py-3">
          <SkeletonParagraph className="size-5" />
          <SkeletonParagraph className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}
