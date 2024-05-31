'use client'

// import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { shallow } from 'zustand/shallow'
import BaseInput from '~base/BaseInput'
import BaseButton from '~base/BaseButton'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import getFormData from '~/utils/getFormData'
import type { FormEvent } from 'react'

// export const metadata: Metadata = {
//   title: 'WhatsApp Clone | Sign in',
// }

export default function SignInPage() {
  const router = useRouter()

  // TODO: block this page if authenticated

  const [toggleNotification, setNotification] = useStore(
    state => [state.toggleNotification, state.setNotification],
    shallow,
  )

  const formRef = useRef<HTMLFormElement>(null)

  const [loading, setLoading] = useState<boolean>(false)

  function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = getFormData(formRef.current!)

    _fetch('auth/login', {
      method: 'POST',
      body: formData,
    })
      .then(() => {
        router.replace('/')
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
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto w-auto h-16 relative">
          <Image src="/react-logo.svg" alt="React logo" priority={true} fill={true} className="object-contain" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Login to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-100 dark:bg-gray-900/90 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form ref={formRef} className="space-y-6" onSubmit={login}>
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
                Login
              </BaseButton>
            </div>

            <div className="flex items-center justify-start">
              <div className="text-sm">
                <span className="text-gray-800 dark:text-gray-100">Don&apos;t have an account?</span>{' '}
                <Link href="/auth/signup">
                  <span className="font-medium text-emerald-600 hover:text-emerald-500 cursor-pointer">Sign up</span>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
