import { ButtonLink } from '~/components/ui'

export default function LinkExpired() {
  return (
    <div className="text-center">
      <p className="mb-4 text-2xl font-bold">This link has expired</p>
      <p className="mb-4 text-sm text-gray-600">You can still request a new account verification link.</p>

      <ButtonLink href="/auth/resend-verification-link">Request verification</ButtonLink>
    </div>
  )
}
