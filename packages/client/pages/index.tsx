import Router from 'next/router'
import { memo, useEffect, useState } from 'react'
// Custom Hooks
import { useAppDataInit } from '../hooks/useAppDataInit'
// Components
import AsyncPage from '../components/AsyncPage' // Import this dynamically when needed
// Stores
import { useAuthStore } from '../stores/useAuthStore'
// Types
import type { NextPage } from 'next'

const Home: NextPage = () => {
  const { initAppData } = useAppDataInit()

  const authToken = useAuthStore(state => state.authToken)
  const expiresAt = useAuthStore(state => state.expiresAt)

  const [hasLoaded, setLoaded] = useState<boolean>(false)
  const isAuthorized = !(authToken === null || (expiresAt !== null && Date.now() >= expiresAt))

  useEffect(() => {
    // Redirects to sign-in page if unauthorized or if auth token expires.
    if (!isAuthorized) {
      Router.replace('/auth/signin')
    } else {
      initAppData().then(() => setLoaded(true))
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
