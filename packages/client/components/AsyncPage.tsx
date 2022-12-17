import shallow from 'zustand/shallow'
// Custom Hooks
import { useSocketInit } from '../hooks/useSocket'
// Components
import Profile from './Profile'
import ChatView from './ChatView'
import SlideOver from './SlideOver'
import ChatSidebar from './ChatSidebar'
import ContactList from './ContactList'
// Stores
import { useStore } from '../stores/index.store'
// Types
import type { SlideOverStateType } from '../stores/useSlideOverState'

function getSlideOverContent(componentName: SlideOverStateType['slideOverState']['componentName']) {
  switch (componentName) {
    case 'ContactList':
      return <ContactList />
    case 'Archived':
      return <ContactList /> /* for now */
    case 'Profile':
      return <Profile />
    default:
      return null
  }
}

/** This is the main page to be shown for an **authorized** user */
export default function AsyncPage() {
  useSocketInit()

  // TODO: PERF: component rerenders even if slideover state is overidden with same value
  const [activeRoomId, isProxyRoom, slideOverState] = useStore(
    state => [state.activeRoomId, state.isProxyRoom, state.slideOverState],
    shallow,
  )

  const showChatView = activeRoomId !== null || isProxyRoom

  return (
    <main className="grid grid-cols-10 h-full">
      {/* 'overflow-x-visible' for the dropdown. */}
      <section className="col-span-3 h-full border-r border-gray-600/70 relative overflow-x-visible">
        <SlideOver>{getSlideOverContent(slideOverState.componentName)}</SlideOver>
        <ChatSidebar />
      </section>

      <section className="col-span-7 h-full bg-gray-800">{showChatView && <ChatView />}</section>
    </main>
  )
}
