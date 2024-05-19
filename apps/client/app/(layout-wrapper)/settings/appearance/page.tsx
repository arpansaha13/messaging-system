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
            className={classNames('block w-12 h-12 rounded-full bg-gray-50', !isDark && 'ring ring-indigo-400')}
            onClick={switchToLight}
          />
          <p className="mt-1 text-sm text-center">Light</p>
        </div>
        <div>
          <button
            className={classNames('block w-12 h-12 rounded-full bg-gray-700', isDark && 'ring ring-indigo-400')}
            onClick={switchToDark}
          />
          <p className="mt-1 text-sm text-center">Dark</p>
        </div>
      </div>
    </>
  )
}
