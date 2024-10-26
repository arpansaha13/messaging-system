import Link from 'next/link'
import { cloneElement } from 'react'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { ContextMenu, ContextMenuWrapper } from '~/components/common'
import type { IContextMenuItem, IUser } from '@shared/types/client'
import ContactAndSearchListItemTemplate from './ContactAndSearchListItemTemplate'
import GlobalName from '../GlobalName'

interface SearchListItemProps {
  menuItems?: IContextMenuItem<IUser>[]
  children: React.ReactElement<SearchListItemLinkProps>

  /**
   * This payload will be passed to the menuItem.onClick method
   * for identification of the concerned list-item
   */
  payload?: IUser
}

interface SearchListItemLinkProps {
  user: IUser
  onContextMenu?: (e: React.MouseEvent) => void
}

export function SearchListItem(props: Readonly<SearchListItemProps>) {
  const { menuItems, payload, children } = props

  if (isNullOrUndefined(menuItems)) {
    return <li>{children}</li>
  }

  return (
    <ContextMenuWrapper>
      {({ onContextMenu }) => (
        <li className="relative">
          {cloneElement(children, { onContextMenu })}
          <ContextMenu payload={payload} items={menuItems} />
        </li>
      )}
    </ContextMenuWrapper>
  )
}

export function SearchListItemLink(props: Readonly<SearchListItemLinkProps>) {
  const { user, onContextMenu } = props

  return (
    <Link
      href={{ query: { to: user.id } }}
      className="flex w-full items-center rounded px-3 text-left transition-colors hover:bg-gray-200/80 dark:hover:bg-gray-600/40"
      onContextMenu={onContextMenu}
    >
      <ContactAndSearchListItemTemplate
        image={user.dp}
        title={user.contact ? user.contact.alias : <GlobalName name={user.globalName} />}
        subtitle={user.contact ? `${user.globalName} • @${user.username}` : `@${user.username}`}
        text={user.bio}
      />
    </Link>
  )
}
