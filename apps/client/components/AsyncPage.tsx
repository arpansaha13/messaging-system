import { shallow } from 'zustand/shallow'
import { useSocketInit } from '~/hooks/useSocket'
import Chat from './Chat'
import Profile from './Profile'
import Sidebar from './Sidebar'
import Settings from './Settings'
import SlideOver from './SlideOver'
import ContactList from './ContactList'
import Archived from './Convo/Archived'
import Notification from './common/Notification'
import AddContact from './ContactList/AddContact'
import { useStore } from '~/stores'
import type { SlideOverStateType } from '~/stores/slices/useSlideOverState'

function getSlideOverContent(componentName: SlideOverStateType['slideOverState']['componentName']) {
  switch (componentName) {
    case 'ContactList':
      return <ContactList />
    case 'Archived':
      return <Archived />
    case 'Profile':
      return <Profile />
    case 'AddContact':
      return <AddContact />
    case 'Settings':
      return <Settings />
    default:
      return null
  }
}

/** This is the main page to be shown for an **authorized** user */
export default function AsyncPage() {
  useSocketInit()

  // TODO: PERF: component rerenders even if slide-over state is overridden with same value
  const [activeRoom, isProxyConvo, slideOverState] = useStore(
    state => [state.activeRoom, state.isProxyConvo, state.slideOverState],
    shallow,
  )

  const showChatView = activeRoom !== null || isProxyConvo

  return (
    <>
      <div className="fixed dark:hidden top-0 w-full bg-emerald-500 h-32" />
      <main className="px-5 py-4 grid grid-cols-10 h-full relative z-10">
        <Notification />
        {/* 'overflow-x-visible' for the dropdown. */}
        <section className="col-span-3 h-full bg-white dark:bg-transparent border-r border-gray-200 dark:border-gray-600/70 relative overflow-x-visible">
          <SlideOver>{getSlideOverContent(slideOverState.componentName)}</SlideOver>
          <Sidebar />
        </section>

        <section className="col-span-7 h-full bg-gray-100 dark:bg-gray-800">{showChatView && <Chat />}</section>
      </main>
    </>
  )
}
