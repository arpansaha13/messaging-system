import { type FormEventHandler, memo, useRef, useState } from 'react'
import { shallow } from 'zustand/shallow'
// Custom Hook
import { useDark } from '~/hooks/useDark'
// Components
import Modal from '~common/Modal'
import Avatar from '~common/Avatar'
// Icons
import { Icon } from '@iconify/react'
import themeIcon from '@iconify-icons/mdi/brightness-6'
// Stores
import { useStore } from '~/store'
import { useAuthStore } from '~/store/useAuthStore'
import { isNullOrUndefined } from '@arpansaha13/utils'

const Settings = () => {
  const [themeModalOpen, setThemeModal] = useState(false)
  const [isDark, toggleDark] = useDark()

  const [authUser] = useAuthStore(state => [state.authUser!], shallow)
  const setSlideOverState = useStore(state => state.setSlideOverState)

  const themeFormRef = useRef<HTMLFormElement>(null)
  const themes = [
    { id: 'light', name: 'Light', checked: !isDark },
    { id: 'dark', name: 'Dark', checked: isDark },
  ]

  const setTheme: FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault()
    const fd = new FormData(themeFormRef.current!)
    console.log(fd.get('theme'))
    const selectedTheme = fd.get('theme')
    if (isNullOrUndefined(selectedTheme)) throw new Error('Some error occurred during theme selection.')
    toggleDark(selectedTheme === 'dark')
    setThemeModal(false)
  }
  function openProfile() {
    setSlideOverState({
      title: 'Profile',
      componentName: 'Profile',
    })
  }

  return (
    <div>
      <button
        className="pl-4 py-4 flex items-center w-full text-left hover:bg-gray-200/60 dark:hover:bg-gray-600/40"
        onClick={openProfile}
      >
        <Avatar src={authUser.dp} width={5} height={5} />
        <div className="ml-4">
          <p className="text-lg text-gray-900 dark:text-gray-100">{authUser.displayName}</p>
          <p className="text-base text-gray-600 dark:text-gray-300">{authUser.bio}</p>
        </div>
      </button>

      <ul>
        <li>
          <button
            className="pl-6 w-full text-left hover:bg-gray-200/60 dark:hover:bg-gray-600/40 flex items-center relative"
            onClick={() => setThemeModal(true)}
          >
            <span className="absolute inset-0" />
            <div className="text-gray-500 dark:text-gray-400">
              <Icon icon={themeIcon} className="inline-block flex-shrink-0" color="inherit" width={24} height={24} />
            </div>
            <div className="ml-6 py-5 w-full border-b border-gray-200 dark:border-gray-700">Theme</div>
          </button>
        </li>
      </ul>

      <Modal open={themeModalOpen} setOpen={setThemeModal}>
        <form ref={themeFormRef} onSubmit={setTheme}>
          <h2 className="mb-5 text-lg font-medium leading-6 text-gray-900 dark:text-gray-200">Choose theme</h2>
          <fieldset>
            <legend className="sr-only">Theme</legend>
            <div className="space-y-3">
              {themes.map(theme => (
                <div key={theme.id} className="relative flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id={theme.id}
                      name="theme"
                      type="radio"
                      value={theme.id}
                      defaultChecked={theme.checked}
                      className="h-4 w-4 border-gray-300 text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={theme.id} className="font-medium text-gray-700 dark:text-gray-200">
                      {theme.name}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse text-sm tracking-wide">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-sm border border-transparent bg-emerald-600 px-5 py-2 text-base text-whigray-100 shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            >
              OK
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-sm border border-emerald-600 bg-transparent px-5 py-2 text-base text-emerald-500 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-400/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={() => setThemeModal(false)}
            >
              CANCEL
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default memo(Settings)
