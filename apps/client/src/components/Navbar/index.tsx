import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { forwardRef, useRef } from 'react'
import {
  ArchiveBoxIcon,
  UsersIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { classNames } from '@arpansaha13/utils'
import { Avatar, Separator } from '~/components/common'
import AddGroup from '~/components/group/add-group'
import { useOverflow } from '~/hooks/useOverflow'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import { useGetGroupsQuery } from '~/store/features/groups/groups.api.slice'

interface LinkWrapperProps {
  className?: string
  children: React.ReactNode
  el?: keyof JSX.IntrinsicElements
}

interface OverflowContainerProps {
  className?: string
  children: ((isOverflowingY: boolean) => React.ReactNode) | React.ReactNode
}

interface GroupListProps {
  isOverflowingY: boolean
}

const navItems = [
  {
    type: 'link' as const,
    to: '/',
    name: 'Chats',
    icon: ChatBubbleOvalLeftEllipsisIcon,
    preserveQuery: true,
  },
  {
    type: 'link' as const,
    to: '/contacts',
    name: 'Contacts',
    icon: UsersIcon,
    preserveQuery: true,
  },
  {
    type: 'link' as const,
    to: '/search',
    name: 'Search',
    icon: MagnifyingGlassIcon,
    preserveQuery: true,
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
    preserveQuery: true,
  },
  {
    type: 'link' as const,
    to: '/settings/profile',
    name: 'Settings',
    icon: Cog6ToothIcon,
    preserveQuery: false,
  },
]

export default function Navbar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: authUser, isSuccess } = useGetAuthUserQuery()

  if (!isSuccess) {
    return null
  }

  return (
    <nav className="flex h-full w-16 flex-shrink-0 flex-col items-center gap-0.5 bg-gray-100 py-4 shadow-md dark:bg-gray-900">
      {navItems.map((navItem, i) => {
        if (navItem.type === 'separator') {
          return <Separator key={i} className="w-4/5" />
        }

        if (navItem.type === 'groups') {
          return (
            <OverflowContainer key="groups" className="w-full flex-grow">
              {isOverflowingY => (
                <>
                  <GroupList isOverflowingY={isOverflowingY} />

                  <div className={classNames('mx-auto mt-0.5 w-max', isOverflowingY && 'pl-scrollbar')}>
                    <AddGroup />
                  </div>
                </>
              )}
            </OverflowContainer>
          )
        }

        return (
          <LinkWrapper key={navItem.to}>
            <Link
              href={{
                pathname: navItem.to,
                query: navItem.preserveQuery ? searchParams.toString() : undefined,
              }}
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

function GroupList(props: Readonly<GroupListProps>) {
  const { isOverflowingY } = props

  const pathname = usePathname()
  const { data: groups, isSuccess } = useGetGroupsQuery()

  if (!isSuccess) return null

  return (
    <ul className="space-y-0.5">
      {/* scrollbar-width = 0.375rem */}
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
  )
}

function OverflowContainer(props: Readonly<OverflowContainerProps>) {
  const { children, className } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const { isOverflowingY } = useOverflow(containerRef)

  return (
    <div ref={containerRef} className={classNames('scrollbar overflow-y-auto', className)}>
      {children instanceof Function ? children(isOverflowingY) : children}
    </div>
  )
}
