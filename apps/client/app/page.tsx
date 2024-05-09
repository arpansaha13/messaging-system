'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { shallow } from 'zustand/shallow'
import Loading from '~/components/Loading'
import AsyncPage from '~/components/AsyncPage'
import { useAuthStore } from '~/store/useAuthStore'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { AuthUserResType } from '@pkg/types'

export default function Page() {
  const router = useRouter()

  const setAuthUser = useAuthStore(state => state.setAuthUser, shallow)
  const [initConvo, initContactStore] = useStore(state => [state.initConvo, state.initContactStore], shallow)

  const [hasLoaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    _fetch('auth/check-auth').then(({ valid }: any) => {
      if (!valid) {
        router.replace('/auth/signin')
      } else {
        _fetch('users/me').then((authUserRes: AuthUserResType) => {
          setAuthUser(authUserRes)
          Promise.all([initConvo(), initContactStore()]).then(() => setLoaded(true))
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (hasLoaded) {
    return <AsyncPage />
  } else {
    return <Loading />
  }
}
