'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useRef, type FormEvent } from 'react'
import { Input, Button } from '~/components/ui'
import { useAppDispatch } from '~/store/hooks'
import { toggleNotification, setNotification } from '~/store/features/notification/notification.slice'
import { _login } from '~/utils/api'
import getFormData from '~/utils/getFormData'

interface ILoginFormData {
  email: string
  password: string
}

// export const metadata: Metadata = {
//   title: 'Messaging System | Sign in',
// }

export default function SignInPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState<boolean>(false)

  function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = getFormData<ILoginFormData>(formRef.current)

    _login(formData)
      .then(() => {
        router.replace('/')
        dispatch(toggleNotification(false))
      })
      .catch(err => {
        dispatch(
          setNotification({
            show: true,
            status: 'error',
            title: 'Sign in failed!',
            description: err.message,
          }),
        )
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
          Login to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-100 px-4 py-8 shadow sm:rounded-lg sm:px-10 dark:bg-gray-900/90">
          <form ref={formRef} className="space-y-6" onSubmit={login}>
            <Input id="email" name="email" type="email" autoComplete="email" required label="Email address" />

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              label="Password"
            />

            {/* <div className="flex items-center justify-end">
              <div className="text-sm">
                <a href="#" className="font-medium text-brand-600 hover:text-brand-500">
                  Forgot your password?
                </a>
              </div>
            </div> */}

            <div>
              <Button type="submit" loading={loading}>
                Login
              </Button>
            </div>

            <div className="flex items-center justify-start">
              <div className="text-sm">
                <span className="text-gray-800 dark:text-gray-100">Don&apos;t have an account?</span>{' '}
                <Link href="/auth/signup">
                  <span className="text-brand-600 hover:text-brand-500 cursor-pointer font-medium">Sign up</span>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
