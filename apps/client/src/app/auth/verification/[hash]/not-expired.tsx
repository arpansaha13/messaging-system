import { useParams } from 'next/navigation'
import { type FormEvent, useRef, useState } from 'react'
import BaseInput from '~base/BaseInput'
import BaseButton from '~base/BaseButton'
import BaseButtonLink from '~base/BaseButtonLink'
import { useAppDispatch } from '~/store/hooks'
import { setNotification, toggleNotification } from '~/store/features/notification/notification.slice'
import { _verification } from '~/utils/api'
import getFormData from '~/utils/getFormData'

enum VerificationStatus {
  'VERIFIED',
  'NOT_VERIFIED',
}

interface OtpFormProps {
  setStatus: React.Dispatch<React.SetStateAction<VerificationStatus>>
}

interface IVerificationFormData {
  otp: string
}

export default function LinkNotExpired() {
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.NOT_VERIFIED)

  if (status === VerificationStatus.VERIFIED) return <VerifiedInfo />
  return <OtpForm setStatus={setStatus} />
}

const OtpForm = ({ setStatus }: OtpFormProps) => {
  const params = useParams()
  const dispatch = useAppDispatch()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState<boolean>(false)

  function verifyAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = getFormData<IVerificationFormData>(formRef.current)

    setLoading(true)

    _verification(params.hash as string, formData)
      .then(() => {
        setStatus(VerificationStatus.VERIFIED)
        dispatch(toggleNotification(false))
      })
      .catch(err => {
        dispatch(
          setNotification({
            show: true,
            status: 'error',
            title: 'Verification failed!',
            description: err.message,
          }),
        )
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
