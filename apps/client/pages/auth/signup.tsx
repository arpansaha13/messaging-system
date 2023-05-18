import Head from 'next/head'
import Router from 'next/router'
import NextLink from 'next/link'
import shallow from 'zustand/shallow'

import { useEffect, useRef, useState } from 'react'
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
import type { JwtToken } from '../../types/index.types'
import { useMap } from 'react-use'

const SignUpPage = () => {
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

  const [validationErrors, { set: setError }] = useMap<Record<string, string | null>>({
    password: null,
    confirmPassword: null,
  })

  const [loading, setLoading] = useState<boolean>(false)
  function signUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = getFormData(formRef.current!, { format: 'object' })

    if (formData.password !== formData.confirmPassword) {
      const msg = 'Password and confirm password do not match'

      setError('password', msg)
      setError('confirmPassword', msg)

      return
    }

    setError('password', null)
    setError('confirmPassword', null)

    fetchHook('auth/sign-up', {
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
          title: 'Sign up failed!',
          description: err.message,
        })
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
      <Head>
        <title>WhatsApp Clone | Sign up</title>
      </Head>
      <div className="bg-gray-100 dark:bg-gray-900/90 py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form ref={formRef} className="space-y-6" onSubmit={signUp}>
          <div className="pb-2 grid grid-cols-2 gap-6">
            <BaseInput id="email" name="email" type="email" autoComplete="email" required label="Email address" />

            <BaseInput
              id="display-name"
              name="displayName"
              autoComplete="username"
              required
              minLength={1}
              maxLength={20}
              label="Display name"
            />

            <BaseInput
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={30}
              label="Password"
              validationError={validationErrors.password}
            />

            <BaseInput
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="password"
              required
              minLength={8}
              maxLength={30}
              label="Confirm password"
              validationError={validationErrors.confirmPassword}
            />
          </div>

          <div>
            <BaseButton type="submit" loading={loading}>
              Sign up
            </BaseButton>
          </div>

          <div className="flex items-center justify-start">
            <div className="text-sm">
              <span className="text-gray-800 dark:text-gray-100">Already have an account?</span>{' '}
              <NextLink href="/auth/signin">
                <span className="font-medium text-emerald-600 hover:text-emerald-500 cursor-pointer">Sign in</span>
              </NextLink>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

SignUpPage.getLayout = (page: ReactElement) => <AuthLayout heading="Create your account">{page}</AuthLayout>
export default SignUpPage
