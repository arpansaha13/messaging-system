import BaseButtonLink from '~/components/base/BaseButtonLink'

export default function LinkExpired() {
  return (
    <div className="text-center">
      <p className="mb-4 text-2xl font-bold">This link has expired</p>
      <p className="mb-4 text-sm text-gray-600">You can still request a new account verification link.</p>

      <BaseButtonLink href="/auth/resend-verification-link">Request verification</BaseButtonLink>
    </div>
  )
}
