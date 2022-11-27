// Custom Hooks
import { useSocketInit } from '../hooks/useSocket'
// Components
import ChatView from './ChatView'
import SlideOver from './SlideOver'
import ChatSidebar from './ChatSidebar'
import ContactList from './ContactList'
// Stores
import { useChatListStore } from '../stores/useChatListStore'
import { useSlideOverState } from '../stores/useSlideOverState'

/** This is the main page to be shown for an **authorized** user */
export default function AsyncPage() {
  useSocketInit()

  const activeChatUserId = useChatListStore(state => state.activeChatUserId)
  const slideOverComponentName = useSlideOverState(state => state.componentName)

  function getSlideOverContent() {
    switch (slideOverComponentName) {
      case 'ContactList':
        return <ContactList />
      case 'Archived':
        return <ContactList /> /* for now */
      default:
        return null
    }
  }

  return (
    <main className="grid grid-cols-10 h-full">
      <section className="col-span-3 h-full border-r border-gray-600/70 relative overflow-hidden">
        <SlideOver>{getSlideOverContent()}</SlideOver>
        <ChatSidebar />
      </section>

      <section className="col-span-7 h-full bg-gray-800">
        {activeChatUserId !== null && <ChatView />}
      </section>
    </main>
  )
}
