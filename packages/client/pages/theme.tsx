import { ReactNode } from 'react'
import { useDark } from '../hooks/useDark'
import ThemeLayout from '../layouts/themeLayout'

import type { NextPageWithLayout } from './_app'

const Theme: NextPageWithLayout = () => {
  const [isDark, toggleDark] = useDark()

  return (
    <main className='py-16 flex flex-col items-center justify-center space-y-3'>
      <p>
        Current Theme: { isDark }
      </p>
      <button
        type="button"
        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        onClick={ () => toggleDark() }
      >
        Toggle theme
      </button>
    </main>
  )
}

Theme.getLayout = (page: ReactNode) => ThemeLayout({ children: page})

export default Theme
