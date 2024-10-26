import Link from 'next/link'
import { ContextMenu, ContextMenuWrapper } from '~/components/common'
import ContactAndSearchListItemTemplate from './ContactAndSearchListItemTemplate'
import type { IContact, IContextMenuItem } from '@shared/types/client'

interface ContactListItemProps {
  contact: IContact
  menuItems: IContextMenuItem<IContact>[]
}

export default function ContactListItem(props: Readonly<ContactListItemProps>) {
  const { menuItems, contact } = props

  return (
    <ContextMenuWrapper>
      {({ onContextMenu }) => (
        <li className="relative">
          <Link
            href={{ query: { to: contact.userId } }}
            className="flex w-full items-center rounded px-3 text-left transition-colors hover:bg-gray-200/80 dark:hover:bg-gray-600/40"
            onContextMenu={onContextMenu}
          >
            <ContactAndSearchListItemTemplate
              text={contact.bio}
              image={contact.dp}
              title={contact.alias}
              subtitle={`${contact.globalName} • @${contact.username}`}
            />
          </Link>

          <ContextMenu payload={contact} items={menuItems} />
        </li>
      )}
    </ContextMenuWrapper>
  )
}
