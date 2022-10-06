import Router from 'next/router'
import { useToggle } from 'react-use'
import { memo, useEffect } from 'react'
// Custom Hooks
import { useFetch } from '../hooks/useFetch'
// Components
import ChatView from '../components/ChatView'
import ChatSidebar from '../components/ChatSidebar'
// Stores
import { useAuthStore } from '../stores/useAuthStore'
import { useContactStore } from '../stores/useContactStore'
import { useChatListStore } from '../stores/useChatListStore'
// Types
import type { NextPage } from 'next'

function AsyncPage() {
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

const Home: NextPage = () => {
  const [loaded, setLoaded] = useToggle(false)
  const fetchHook = useFetch()

  const authToken = useAuthStore(state => state.authToken)
  const expiresAt = useAuthStore(state => state.expiresAt)
  const initContactStore = useContactStore(state => state.init)
  const initChatListStore = useChatListStore(state => state.init)

  useEffect(() => {
    // Redirects to sign-in page if unauthorized or if auth token expires.
    if (authToken === null || (expiresAt !== null && Date.now() >= expiresAt)) {
      Router.push('/auth/signin')
    }
    else {
      Promise.all([
        fetchHook('http://localhost:4000/chat-list'),
        fetchHook('http://localhost:4000/contacts'),
      ])
      .then(([chatList, contacts]) => {
        initContactStore(contacts)
        initChatListStore(chatList)
        setLoaded(true)
      })
    }
  }, [])

  if (!loaded) {
    // TODO: make a component for 'loading'
    return <p> Loading...</p>
  } else {
    return <AsyncPage />
  }
}

export default memo(Home)
