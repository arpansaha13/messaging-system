'use client'

import { classNames } from '@arpansaha13/utils'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { toggleDark } from '~/store/features/dark/dark.slice'

export default function Page() {
  const dispatch = useAppDispatch()
  const isDark = useAppSelector(state => state.dark.isDark)

  const switchToLight = () => {
    dispatch(toggleDark(false))
  }

  const switchToDark = () => {
    dispatch(toggleDark(true))
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
