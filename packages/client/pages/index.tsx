import Router from 'next/router'
import { memo, useEffect, useState } from 'react'
import shallow from 'zustand/shallow'
// Custom Hook
import { useFetch } from '../hooks/useFetch'
// Components
import AsyncPage from '../components/AsyncPage' // Import this dynamically when needed
// Store
import { useAuthStore } from '../stores/useAuthStore'
import { useStore } from '../stores/index.store'
// Types
import type { NextPage } from 'next'
import type { AuthUserResType } from '../types/index.types'

const Home: NextPage = () => {
  const fetchHook = useFetch()
  const [authToken, expiresAt, setAuthUser] = useAuthStore(
    state => [state.authToken, state.authExpiresAt, state.setAuthUser],
    shallow,
  )
  const [initConvo, initContactStore] = useStore(state => [state.initConvo, state.initContactStore], shallow)

  const [hasLoaded, setLoaded] = useState<boolean>(false)
  const isAuthorized = !(authToken === null || (expiresAt !== null && Date.now() >= expiresAt))

  useEffect(() => {
    // Redirects to sign-in page if unauthorized or if auth token expires.
    if (!isAuthorized) {
      Router.replace('/auth/signin')
    } else {
      fetchHook('users/me').then((authUserRes: AuthUserResType) => {
        setAuthUser(authUserRes)
        Promise.all([initConvo(fetchHook), initContactStore(fetchHook)]).then(() => setLoaded(true))
      })
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
