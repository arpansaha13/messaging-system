import { useParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { shallow } from 'zustand/shallow'
import { useStore } from '~/store'
import BaseInput from '~base/BaseInput'
import BaseButton from '~base/BaseButton'
import BaseButtonLink from '~base/BaseButtonLink'
import _fetch from '~/utils/_fetch'
import getFormData from '~/utils/getFormData'

enum VerificationStatus {
  'VERIFIED',
  'NOT_VERIFIED',
}

interface OtpFormProps {
  setStatus: React.Dispatch<React.SetStateAction<VerificationStatus>>
}

export default function LinkNotExpired() {
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.NOT_VERIFIED)

  if (status === VerificationStatus.VERIFIED) return <VerifiedInfo />
  return <OtpForm setStatus={setStatus} />
}

const OtpForm = ({ setStatus }: OtpFormProps) => {
  const params = useParams()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [toggleNotification, setNotification] = useStore(
    state => [state.toggleNotification, state.setNotification],
    shallow,
  )

  function verifyAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = getFormData(formRef.current!)

    setLoading(true)

    _fetch(`auth/verification/${params.hash}`, {
      method: 'POST',
      body: formData,
    })
      .then(() => {
        setStatus(VerificationStatus.VERIFIED)
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
