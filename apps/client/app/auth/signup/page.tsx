'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { shallow } from 'zustand/shallow'
import { useEffect, useRef, useState } from 'react'
import { useFetch } from '~/hooks/useFetch'
import BaseInput from '~base/BaseInput'
import BaseButton from '~base/BaseButton'
import { useStore } from '~/store'
import { useAuthStore } from '~/store/useAuthStore'
import getFormData from '~/utils/getFormData'
import type { FormEvent } from 'react'
import type { JwtToken } from '~/types'
import { useMap } from 'react-use'

// export const metadata: Metadata = {
//   title: 'WhatsApp Clone | Sign up',
// }

export default function SignUpPage() {
  const router = useRouter()
  const expiresAt = useAuthStore(state => state.authExpiresAt)

  useEffect(() => {
    if (expiresAt !== null && Date.now() < expiresAt) {
      router.replace('/')
    }
    router.prefetch('/')
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

    const formData = getFormData(formRef.current!)

    if (formData.password !== formData.confirmPassword) {
      const msg = 'Password and confirm password do not match'

      setError('password', msg)
      setError('confirmPassword', msg)

      return
    }

    setError('password', null)
    setError('confirmPassword', null)

    setLoading(true)

    fetchHook('auth/sign-up', {
      method: 'POST',
      body: formData,
    })
      .then((data: JwtToken) => {
        setAuthState({
          authToken: data.authToken,
          authExpiresAt: data.expiresAt,
        })
        router.replace('/')
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
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto w-auto h-16 relative">
          <Image src="/react-logo.svg" alt="React logo" priority={true} fill={true} className="object-contain" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Create your account
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
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
                <Link href="/auth/signin">
                  <span className="font-medium text-emerald-600 hover:text-emerald-500 cursor-pointer">Sign in</span>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
