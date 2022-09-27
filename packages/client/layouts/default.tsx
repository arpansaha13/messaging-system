import Image from 'next/image'
import Navbar from '../components/Navbar'

import type { ReactNode } from 'react'

interface DefaultLayoutProps {
  children: ReactNode
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className='min-h-screen flex flex-col'>
      <Navbar />

      <p className='mx-auto'>Default Layout</p>

      <div className='flex-grow'>
        { children }
      </div>

      <footer className="px-8 flex items-center justify-center">
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
          className='flex items-center justify-center'
        >
          Powered by{' '}
          <span className='h-[1em] ml-2'>
            <Image src="/vercel.svg" alt="Vercel Logo" className='dark:filter dark:invert' width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}
