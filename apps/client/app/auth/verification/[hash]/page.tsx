'use client'

// import { Metadata } from 'next'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { shallow } from 'zustand/shallow'
import { useEffect, useRef, useState } from 'react'
import { useFetch } from '~/hooks/useFetch'
import BaseInput from '~base/BaseInput'
import BaseButton from '~base/BaseButton'
import BaseButtonLink from '~base/BaseButtonLink'
import { useStore } from '~/store'
import { useAuthStore } from '~/store/useAuthStore'
import getFormData from '~/utils/getFormData'
import type { FormEvent } from 'react'

interface OtpFormProps {
  setVerified: React.Dispatch<React.SetStateAction<boolean>>
}

// export const metadata: Metadata = {
//   title: 'WhatsApp Clone | Verification',
// }

export default function VerificationPage() {
  const router = useRouter()
  const expiresAt = useAuthStore(state => state.authExpiresAt)

  useEffect(() => {
    if (expiresAt !== null && Date.now() < expiresAt) {
      router.replace('/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [verified, setVerified] = useState<boolean>(false)

  // TODO: check if link is expired

  const content = verified ? <VerifiedInfo /> : <OtpForm setVerified={setVerified} />

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto w-auto h-16 relative">
          <Image src="/react-logo.svg" alt="React logo" priority={true} fill={true} className="object-contain" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Verify your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-100 dark:bg-gray-900/90 py-8 px-4 shadow sm:rounded-lg sm:px-10">{content}</div>
      </div>
    </>
  )
}

const OtpForm = ({ setVerified }: OtpFormProps) => {
  const params = useParams()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const fetchHook = useFetch()
  const [toggleNotification, setNotification] = useStore(
    state => [state.toggleNotification, state.setNotification],
    shallow,
  )

  function verifyAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = getFormData(formRef.current!)

    setLoading(true)

    fetchHook(`auth/verification/${params.hash}`, {
      method: 'POST',
      body: formData,
    })
      .then(() => {
        setVerified(true)
        toggleNotification(false)
      })
      .catch(err => {
        setNotification({
          show: true,
          status: 'error',
          title: 'Verification failed!',
          description: err.message,
        })
      })
      .finally(() => setLoading(false))
  }

  return (
    <form ref={formRef} className="space-y-6" onSubmit={verifyAccount}>
      <div className="pb-2">
        <BaseInput id="otp" name="otp" type="text" required label="Otp" />
      </div>

      <div>
        <BaseButton type="submit" loading={loading}>
          Submit
        </BaseButton>
      </div>
    </form>
  )
}

function VerifiedInfo() {
  return (
    <div className="text-center">
      <p className="mb-4 text-2xl font-bold">Verification successful!</p>
      <p className="mb-4 text-sm text-gray-600">Your account has been verified. You can now login from your account.</p>

      <BaseButtonLink href="/auth/signin">Go to login</BaseButtonLink>
    </div>
  )
}

function LinkExpired() {
  return (
    <div className="text-center">
      <p className="mb-4 text-2xl font-bold">This link has expired</p>
      <p className="mb-4 text-sm text-gray-600">You can still request a new account verification link.</p>

      <BaseButtonLink href="/auth/resend-verification-link">Request verification</BaseButtonLink>
    </div>
  )
}
