'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { GroupAvatar } from '~/components/common'
import ChannelListItemTemplate from '~/components/channel-list-item/Template'
import { Window, WindowBody, WindowPanel, WindowPanelBody } from '~/components/window'
import AddChannelModal from '~/components/group/add-channel/AddChannelModal'
import { useGetChannelsQuery, useGetGroupQuery } from '~/store/features/groups/groups.api.slice'

interface GroupsLayoutProps {
  children: React.ReactNode
}

export default function GroupsLayout({ children }: Readonly<GroupsLayoutProps>) {
  const params = useParams()
  const groupId = useMemo(() => parseInt(params.groupId as string), [params.groupId])
  const { data: group, isSuccess: isFetchGroupSuccess } = useGetGroupQuery(groupId)
  const { data: channels, isSuccess: isFetchChannelsSuccess } = useGetChannelsQuery(groupId)
  const [addChannelModalOpen, setAddChannelModalOpen] = useState(false)

  if (!isFetchGroupSuccess || !isFetchChannelsSuccess) return null

  const menuItems = [
    {
      name: 'Add Channel',
      action: () => {
        setAddChannelModalOpen(true)
      },
    },
  ]

  return (
    <Window>
      <WindowPanel className="w-[26rem]">
        <div className="relative bg-gray-50 p-4 shadow dark:bg-gray-800">
          <div className="mt-8 flex items-center gap-4">
            <GroupAvatar src={null} alt="" size={4} />

            <div>
              <p className="text-2xl font-bold">{group.name}</p>
            </div>
          </div>

          <Menu as="div" className="absolute right-2 top-2">
            <MenuButton className="focus:ring-brand-500 block rounded p-1 transition-colors hover:bg-gray-600/60 focus:outline-none focus:ring-2">
              <EllipsisHorizontalIcon className="size-6 flex-shrink-0" />
            </MenuButton>

            <MenuItems
              anchor={{ to: 'bottom end', gap: '0.25rem' }}
              transition
              className="w-48 origin-top rounded-md bg-gray-50 text-gray-800 shadow-md transition duration-200 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 dark:bg-gray-800 dark:text-gray-100 dark:shadow-black/70"
            >
              {menuItems.map(menuItem => (
                <MenuItem
                  as="button"
                  key={menuItem.name}
                  type="button"
                  className="block w-full rounded px-6 py-2.5 text-left text-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-900/70"
                  onClick={menuItem.action}
                >
                  {menuItem.name}
                </MenuItem>
              ))}
            </MenuItems>
          </Menu>
        </div>

        <WindowPanelBody>
          {channels && (
            <ul className="space-y-1">
              {channels.map(channel => (
                <ChannelListItemTemplate key={channel.id} channelName={channel.name} />
              ))}
            </ul>
          )}
        </WindowPanelBody>
      </WindowPanel>

      <WindowBody>{children}</WindowBody>

      <AddChannelModal open={addChannelModalOpen} setOpen={setAddChannelModalOpen} groupId={groupId} />
    </Window>
  )
}
