'use client'

import { useDark } from '~/hooks/useDark'
import { classNames } from '@arpansaha13/utils'

export default function Page() {
  const [isDark, toggleDark] = useDark()

  const switchToLight = () => {
    if (isDark) toggleDark(false)
  }

  const switchToDark = () => {
    if (!isDark) toggleDark(true)
  }

  return (
    <>
      <h2 className="mb-6 text-2xl font-semibold">Theme</h2>
      <div className="flex gap-6">
        <div>
          <button
            className={classNames('block h-12 w-12 rounded-full bg-gray-50', !isDark && 'ring ring-indigo-400')}
            onClick={switchToLight}
          />
          <p className="mt-1 text-center text-sm">Light</p>
        </div>
        <div>
          <button
            className={classNames('block h-12 w-12 rounded-full bg-gray-700', isDark && 'ring ring-indigo-400')}
            onClick={switchToDark}
          />
          <p className="mt-1 text-center text-sm">Dark</p>
        </div>
      </div>
    </>
  )
}
