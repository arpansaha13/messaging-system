import Image from 'next/image'
// Icons
import { Icon } from '@iconify/react'
import githubBoxIcon from '@iconify-icons/mdi/github-box'

export default function WIP() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center p-4">
      <div className="grid grid-cols-2 gap-8">
        <div className="relative">
          <Image src="/nextjs-icon.svg" alt="nextjs-logo" width="80" height="80" />
        </div>
        <div className="relative">
          <Image src="/reactjs-icon.svg" alt="reactjs-logo" width="80" height="80" />
        </div>
        <div className="relative">
          <Image src="/nestjs-icon.svg" alt="nestjs-logo" width="80" height="80" />
        </div>
        <div className="relative">
          <Image src="/postgresql-icon.svg" alt="postgresql-logo" width="80" height="80" />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-center text-2xl text-gray-50">Work in progress</h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          The view for smaller screens is still a work in progress. Kindly view this deployment on a larger screen.
        </p>
      </div>

      <a
        href="https://github.com/arpansaha13/whatsapp-clone"
        target="_blank"
        rel="noreferrer"
        className="mt-8 block rounded-lg p-1 shadow shadow-gray-600"
      >
        <div className="flex rounded-md shadow-sm">
          <div className="flex w-16 flex-shrink-0 items-center justify-center rounded-l-md shadow-sm shadow-gray-600">
            <Icon icon={githubBoxIcon} className="flex-shrink-0" color="inherit" width={64} height={64} />
          </div>

          <div className="flex flex-1 items-center justify-between rounded-r-md shadow-sm shadow-gray-600">
            <div className="flex-1 truncate px-4 py-2 text-sm">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">GitHub</h3>
              <p className="text-gray-500">Check out the source code</p>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
