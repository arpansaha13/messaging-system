'use client'

import { useRouter } from 'next/navigation'
import { memo, useEffect, useState } from 'react'
import { shallow } from 'zustand/shallow'
import { useFetch } from '~/hooks/useFetch'
import Loading from '~/components/Loading'
import AsyncPage from '~/components/AsyncPage'
import { useAuthStore } from '~/stores/useAuthStore'
import { useStore } from '~/stores'
import type { NextPage } from 'next'
import type { AuthUserResType } from '~/types'

const Home: NextPage = () => {
  const router = useRouter()
  const fetchHook = useFetch()
  const [authToken, expiresAt, setAuthUser] = useAuthStore(
    state => [state.authToken, state.authExpiresAt, state.setAuthUser],
    shallow,
  )
  const [initConvo, initContactStore] = useStore(state => [state.initConvo, state.initContactStore], shallow)

  const [hasLoaded, setLoaded] = useState<boolean>(false)
  const isAuthorized = !(authToken === null || (expiresAt !== null && Date.now() >= expiresAt))

  useEffect(() => {
    if (!isAuthorized) {
      router.replace('/auth/signin')
    } else {
      fetchHook('users/me').then((authUserRes: AuthUserResType) => {
        setAuthUser(authUserRes)
        Promise.all([initConvo(fetchHook), initContactStore(fetchHook)]).then(() =>
          setTimeout(() => setLoaded(true), 2000),
        )
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (hasLoaded) {
    return <AsyncPage />
  } else {
    return <Loading />
  }
}
export default memo(Home)
