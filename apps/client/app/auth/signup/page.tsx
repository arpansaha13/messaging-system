'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { shallow } from 'zustand/shallow'
import BaseInput from '~base/BaseInput'
import BaseButton from '~base/BaseButton'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import getFormData from '~/utils/getFormData'
import type { FormEvent } from 'react'
import { useMap } from 'react-use'

// export const metadata: Metadata = {
//   title: 'Messaging System | Sign up',
// }

export default function SignUpPage() {
  const [setNotification] = useStore(state => [state.setNotification], shallow)

  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const [validationErrors, { set: setError }] = useMap<Record<string, string | null>>({
    password: null,
    confirmPassword: null,
  })

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

    _fetch('auth/sign-up', {
      method: 'POST',
      body: formData,
    })
      .then(() => {
        setNotification({
          show: true,
          status: 'success',
          title: 'Account created!',
          description: 'Please verify your account using the link sent to your email.',
        })
      })
      .catch(err => {
        const message: string | Array<string> = err.message

        setNotification({
          show: true,
          status: 'error',
          title: 'Sign up failed!',
          description: typeof message === 'string' ? message : message[0],
        })
      })
      .finally(() => setLoading(false))
  }

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="relative mx-auto h-16 w-auto">
          <Image src="/react-logo.svg" alt="React logo" priority={true} fill={true} className="object-contain" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Create your account
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-gray-100 px-4 py-8 shadow sm:rounded-lg sm:px-10 dark:bg-gray-900/90">
          <form ref={formRef} className="space-y-6" onSubmit={signUp}>
            <div className="grid grid-cols-2 gap-6 pb-2">
              <BaseInput id="email" name="email" type="email" autoComplete="email" required label="Email address" />

              <BaseInput
                id="global-name"
                name="globalName"
                autoComplete="name"
                required
                minLength={1}
                maxLength={20}
                label="Name"
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
                <Link href="/auth/login">
                  <span className="text-brand-600 hover:text-brand-500 cursor-pointer font-medium">Login</span>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
