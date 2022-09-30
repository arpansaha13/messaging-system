import { memo, useEffect } from 'react'
// Components
import ChatView from '../components/ChatView'
import ChatSidebar from '../components/ChatSidebar'
// Stores
import { useUserStore } from '../stores/useUserStore'
import { useChatListStore } from '../stores/useChatListStore'
// Types
import type { NextPage } from 'next'
import type { UserDataType, ChatListItemType } from '../types'

interface HomePageProps {
  initUsersData: UserDataType[]
  initChatListData: ChatListItemType[]
}

const Home: NextPage<HomePageProps> = ({ initUsersData, initChatListData }) => {
  const activeChat = useChatListStore(state => state.activeChat)
  const initUserStore = useUserStore(state => state.init)
  const initChatListStore = useChatListStore(state => state.init)

  useEffect(() => {
    initUserStore(initUsersData)
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
  const [chatListRes, usersRes] = await Promise.all([
    fetch('http://localhost:4000/chat-list'),
    fetch('http://localhost:4000/users'),
  ])
  const [chatList, users] = await Promise.all([
    chatListRes.json(),
    usersRes.json()
  ])
  return {
    props: {
      initUsersData: users,
      initChatListData: chatList
    }
  }
}

export default memo(Home)
