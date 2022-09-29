import { memo } from 'react'

// Components
import ChatView from '../components/ChatView'
import ChatSidebar from '../components/ChatSidebar'

// Stores
import { useChatListStore } from '../stores/useChatListStore'

// Types
import type { NextPage } from 'next'

const Home: NextPage = () => {
  const activeChat = useChatListStore(state => state.activeChat)

  return (
    <main className='grid grid-cols-10 h-full'>
      <section className='col-span-3 h-full border-r border-gray-600/70'>
        <ChatSidebar />
      </section>

      <section className='col-span-7 h-full bg-gray-800'>
        { activeChat !== null && <ChatView /> }
      </section>
    </main>
  )
}

export default memo(Home)
