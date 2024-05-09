import { shallow } from 'zustand/shallow'
import { useSocketInit } from '~/hooks/useSocket'
import { ArchiveBoxIcon, ChatBubbleOvalLeftEllipsisIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import Chat from './Chat'
import Sidebar from './Sidebar'
import Avatar from '~common/Avatar'
import Notification from '~common/Notification'
import { useStore } from '~/store'
import { useAuthStore } from '~/store/useAuthStore'

/** This is the main page to be shown for an **authorized** user */
export default function AsyncPage() {
  useSocketInit()

  const authUser = useAuthStore(state => state.authUser!)

  // TODO: PERF: component rerenders even if slide-over state is overridden with same value
  const [activeRoom, isProxyConvo, toggleSlideOver, setSlideOverState] = useStore(
    state => [state.activeRoom, state.isProxyConvo, state.toggleSlideOver, state.setSlideOverState],
    shallow,
  )

  const showChatView = activeRoom !== null || isProxyConvo

  function openArchive() {
    setSlideOverState({
      componentName: 'Archived',
    })
    toggleSlideOver(true)
  }

  function openSettings() {
    setSlideOverState({
      componentName: 'Settings',
    })
    toggleSlideOver(true)
  }

  function openProfile() {
    setSlideOverState({
      componentName: 'Profile',
    })
    toggleSlideOver(true)
  }

  function openChats() {
    setSlideOverState({
      componentName: 'Unarchived',
    })
    toggleSlideOver(false)
  }

  return (
    <div className="flex h-full">
      <aside className="py-4 w-16 h-full flex flex-col items-center justify-between bg-gray-100 dark:bg-transparent border-r border-gray-200 dark:border-gray-600/70">
        <div>
          <button type="button" className="mx-auto block" onClick={openChats}>
            <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 flex-shrink-0" />
          </button>
        </div>

        <div>
          <button type="button" className="mx-auto block" onClick={openArchive}>
            <ArchiveBoxIcon className="w-6 h-6 flex-shrink-0" />
          </button>
          <button type="button" className="mx-auto mt-2 block" onClick={openSettings}>
            <Cog6ToothIcon className="w-6 h-6 flex-shrink-0" />
          </button>
          {authUser !== null && (
            <button className="mx-auto mt-4 block" onClick={openProfile}>
              <Avatar src={authUser.dp} width={2} height={2} />
            </button>
          )}
        </div>
      </aside>

      <main className="flex-grow grid grid-cols-10 h-full relative z-10">
        <Notification />
        {/* 'overflow-x-visible' for the dropdown. */}
        <section className="col-span-3 h-full bg-white dark:bg-transparent border-r border-gray-200 dark:border-gray-600/70 relative overflow-x-visible">
          <Sidebar />
        </section>

        <section className="col-span-7 h-full bg-gray-100 dark:bg-gray-800">{showChatView && <Chat />}</section>
      </main>
    </div>
  )
}
