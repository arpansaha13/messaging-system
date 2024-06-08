'use client'

// import { Metadata } from 'next'
import Image from 'next/image'
import LinkNotExpired from './not-expired'

// export const metadata: Metadata = {
//   title: 'Messaging System | Verification',
// }

export default function VerificationPage() {
  // TODO: block this page if authenticated

  // TODO: check if link is expired

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="relative mx-auto h-16 w-auto">
          <Image src="/react-logo.svg" alt="React logo" priority={true} fill={true} className="object-contain" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Verify your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-100 px-4 py-8 shadow sm:rounded-lg sm:px-10 dark:bg-gray-900/90">
          <LinkNotExpired />
        </div>
      </div>
    </>
  )
}
