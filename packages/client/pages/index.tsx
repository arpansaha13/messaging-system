import Router from 'next/router'
import { memo, useEffect, useState } from 'react'
// Custom Hooks
import { useFetch } from '../hooks/useFetch'
// Components
import AsyncPage from '../components/AsyncPage' // Import this dynamically when needed
// Stores
import { useAuthStore } from '../stores/useAuthStore'
import { useContactStore } from '../stores/useContactStore'
import { useChatListStore } from '../stores/useChatListStore'
// Types
import type { NextPage } from 'next'

const Home: NextPage = () => {
  const fetchHook = useFetch()

  const authToken = useAuthStore(state => state.authToken)
  const expiresAt = useAuthStore(state => state.expiresAt)
  const setAuthUser = useAuthStore(state => state.setAuthUser)
  const initContactStore = useContactStore(state => state.init)
  const initChatListStore = useChatListStore(state => state.init)

  const [hasLoaded, setLoaded] = useState<boolean>(false)
  const isAuthorized = !(authToken === null || (expiresAt !== null && Date.now() >= expiresAt))

  useEffect(() => {
    // Redirects to sign-in page if unauthorized or if auth token expires.
    if (!isAuthorized) {
      // TODO: use Router.replace() after successful signin or signup, and logout, and also here below
      Router.push('/auth/signin')
    } else {
      Promise.all([fetchHook('me'), fetchHook('chat-list'), fetchHook('contacts')]).then(
        ([authUser, chatList, contacts]) => {
          setAuthUser(authUser)
          initContactStore(contacts)
          initChatListStore(chatList)
          setLoaded(true)
        },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (hasLoaded) {
    return <AsyncPage />
  } else {
    // TODO: make a component for 'loading'
    return <p> Loading...</p>
  }
}

export default memo(Home)
