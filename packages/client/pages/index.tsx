import { memo, useEffect } from 'react'
// Components
import ChatView from '../components/ChatView'
import ChatSidebar from '../components/ChatSidebar'
// Stores
import { useContactStore } from '../stores/useContactStore'
import { useChatListStore } from '../stores/useChatListStore'
// Types
import type { NextPage } from 'next'
import type { ContactType, ChatListItemType } from '../types'

interface HomePageProps {
  initContactsData: ContactType[]
  initChatListData: ChatListItemType[]
}

const Home: NextPage<HomePageProps> = ({ initContactsData, initChatListData }) => {
  const activeChat = useChatListStore(state => state.activeChat)
  const initContactStore = useContactStore(state => state.init)
  const initChatListStore = useChatListStore(state => state.init)

  useEffect(() => {
    initContactStore(initContactsData)
    initChatListStore(initChatListData)
  }, [])

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

export async function getServerSideProps() {
  // Fetch data from external API
  const [chatListRes, contactsRes] = await Promise.all([
    fetch('http://localhost:4000/chat-list'),
    fetch('http://localhost:4000/contacts'),
  ])
  const [chatList, contacts] = await Promise.all([
    chatListRes.json(),
    contactsRes.json()
  ])
  return {
    props: {
      initContactsData: contacts,
      initChatListData: chatList
    }
  }
}

export default memo(Home)
