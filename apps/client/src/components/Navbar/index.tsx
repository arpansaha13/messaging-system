import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { forwardRef, useRef } from 'react'
import { shallow } from 'zustand/shallow'
import {
  ArchiveBoxIcon,
  UsersIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { classNames } from '@arpansaha13/utils'
import Avatar from '~common/Avatar'
import Separator from '~common/Separator'
import AddGroup from '~/components/group/add-group'
import { useOverflow } from '~/hooks/useOverflow'
import { useStore } from '~/store'
import { _getMe } from '~/utils/api'

interface LinkWrapperProps {
  children: React.ReactNode
  className?: string
  el?: keyof JSX.IntrinsicElements
}

const navItems = [
  {
    type: 'link' as const,
    to: '/',
    name: 'Chats',
    icon: ChatBubbleOvalLeftEllipsisIcon,
  },
  {
    type: 'link' as const,
    to: '/contacts',
    name: 'Contacts',
    icon: UsersIcon,
  },
  {
    type: 'link' as const,
    to: '/search',
    name: 'Search',
    icon: MagnifyingGlassIcon,
  },
  { type: 'separator' as const },
  {
    type: 'groups' as const,
  },
  { type: 'separator' as const },
  {
    type: 'link' as const,
    to: '/archived',
    name: 'Archived',
    icon: ArchiveBoxIcon,
  },
  {
    type: 'link' as const,
    to: '/settings/profile',
    name: 'Settings',
    icon: Cog6ToothIcon,
  },
]

export default function Navbar() {
  const pathname = usePathname()
  const [authUser] = useStore(state => [state.authUser!], shallow)

  return (
    <nav className="flex h-full w-16 flex-shrink-0 flex-col items-center gap-0.5 bg-gray-100 py-4 shadow-md dark:bg-gray-900">
      {navItems.map((navItem, i) => {
        if (navItem.type === 'separator') {
          return <Separator key={i} className="w-4/5" />
        }

        if (navItem.type === 'groups') {
          return <GroupList key="groups" />
        }

        return (
          <LinkWrapper key={navItem.to}>
            <Link
              href={navItem.to}
              className={classNames(
                'mx-auto block w-max rounded p-2 transition-colors',
                pathname === navItem.to && 'bg-brand-300 text-brand-900 dark:bg-brand-800 dark:text-brand-200',
              )}
            >
              <span className="sr-only">{navItem.name}</span>
              <LinkIcon idx={i} className="size-6 flex-shrink-0" />
            </Link>
          </LinkWrapper>
        )
      })}

      <LinkWrapper className="mt-4">
        <Link href="/settings/profile" className="mx-wuto mx-auto block w-max">
          <Avatar src={authUser.dp} width={2} height={2} />
        </Link>
      </LinkWrapper>
    </nav>
  )
}

const LinkIcon = forwardRef((props: any, ref) => {
  const { idx, ...remaining } = props
  const IconComponent = navItems[idx].icon!

  return <IconComponent ref={ref} {...remaining} />
})

LinkIcon.displayName = 'LinkIcon'

function LinkWrapper(props: Readonly<LinkWrapperProps>) {
  const { children, className, el: Element = 'div' } = props

  return (
    <Element className={classNames('group relative w-full', className)}>
      {children}

      <span className="absolute left-0 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors group-hover:bg-gray-900 dark:group-hover:bg-gray-100" />
    </Element>
  )
}

function GroupList() {
  const pathname = usePathname()
  const groupsRef = useRef<HTMLDivElement>(null)
  const { isOverflowingY } = useOverflow(groupsRef)
  const [groups] = useStore(state => [state.groups], shallow)

  return (
    <div ref={groupsRef} className={'scrollbar w-full flex-grow overflow-y-auto'}>
      {/* scrollbar-width = 0.375rem */}
      <ul>
        {groups.map(group => {
          const href = `/groups/${group.id}`

          return (
            <LinkWrapper key={group.id} el="li" className={classNames(isOverflowingY && 'pl-scrollbar')}>
              <Link
                href={href}
                className={classNames(
                  'mx-auto flex size-10 items-center justify-center rounded transition-colors',
                  href === pathname && 'bg-brand-300 text-brand-900 dark:bg-brand-800 dark:text-brand-200',
                )}
              >
                <UserGroupIcon className="size-6 flex-shrink-0" />
              </Link>
            </LinkWrapper>
          )
        })}
      </ul>

      <div className={classNames('mx-auto w-max', isOverflowingY && 'pl-scrollbar')}>
        <AddGroup />
      </div>
    </div>
  )
}
