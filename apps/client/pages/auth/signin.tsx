import Head from 'next/head'
import Router from 'next/router'
import NextLink from 'next/link'
import { shallow } from 'zustand/shallow'

import { useEffect, useState, useRef } from 'react'
import { useMap } from 'react-use'
// Custom Hooks
import { useFetch } from '../../hooks/useFetch'
// Components
import BaseInput from '../../components/base/BaseInput'
import BaseButton from '../../components/base/BaseButton'
// Stores
import { useStore } from '../../stores/index.store'
import { useAuthStore } from '../../stores/useAuthStore'
// Layout
import AuthLayout from '../../layouts/auth'
// Utils
import getFormData from '../../utils/getFormData'
// Types
import type { FormEvent, ReactElement } from 'react'
import type { JwtToken } from '../../types'

const SignInPage = () => {
  const expiresAt = useAuthStore(state => state.authExpiresAt)

  useEffect(() => {
    if (expiresAt !== null && Date.now() < expiresAt) {
      Router.replace('/')
    }
    Router.prefetch('/')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchHook = useFetch()
  const setAuthState = useAuthStore(state => state.setAuthState)
  const [toggleNotification, setNotification] = useStore(
    state => [state.toggleNotification, state.setNotification],
    shallow,
  )

  const formRef = useRef<HTMLFormElement>(null)

  const [loading, setLoading] = useState<boolean>(false)

  function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = getFormData(formRef.current!, { format: 'object' })

    fetchHook('auth/sign-in', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
      .then((data: JwtToken) => {
        setAuthState({
          authToken: data.authToken,
          authExpiresAt: data.expiresAt,
        })
        Router.replace('/')
        toggleNotification(false)
      })
      .catch(err => {
        setNotification({
          show: true,
          status: 'error',
          title: 'Sign in failed!',
          description: err.message,
        })
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <Head>
        <title>WhatsApp Clone | Sign in</title>
      </Head>

      <div className="bg-gray-100 dark:bg-gray-900/90 py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form ref={formRef} className="space-y-6" onSubmit={signIn}>
          <BaseInput id="email" name="email" type="email" autoComplete="email" required label="Email address" />

          <BaseInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            label="Password"
          />

          {/* <div className="flex items-center justify-end">
          <div className="text-sm">
            <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
              Forgot your password?
            </a>
          </div>
        </div> */}

          <div>
            <BaseButton type="submit" loading={loading}>
              Sign in
            </BaseButton>
          </div>

          <div className="flex items-center justify-start">
            <div className="text-sm">
              <span className="text-gray-800 dark:text-gray-100">Don&apos;t have an account?</span>{' '}
              <NextLink href="/auth/signup">
                <span className="font-medium text-emerald-600 hover:text-emerald-500 cursor-pointer">Sign up</span>
              </NextLink>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
SignInPage.getLayout = (page: ReactElement) => <AuthLayout heading="Sign in to your account">{page}</AuthLayout>
export default SignInPage
