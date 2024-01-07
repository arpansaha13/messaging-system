import { Fragment, memo } from 'react'
import { Transition } from '@headlessui/react'
import { shallow } from 'zustand/shallow'
// Stores
import { useStore } from '~/stores'
// Icons
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
// Types
import type { ReactNode } from 'react'

interface SlideOverProps {
  children: ReactNode
}

const SlideOver = ({ children }: SlideOverProps) => {
  const [slideOverState, toggleSlideOver] = useStore(state => [state.slideOverState, state.toggleSlideOver], shallow)

  return (
    <Transition.Root show={slideOverState.open} as={Fragment}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-40 flex max-w-full">
        <Transition.Child
          as={Fragment}
          enter="transform transition ease-in-out duration-300"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transform transition ease-in-out duration-300"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <div className="pointer-events-auto w-screen max-w-md">
            <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900 shadow-xl">
              <header className="pt-14 pb-2 bg-emerald-600 text-gray-100 dark:bg-gray-800 dark:text-gray-50">
                <div className="flex items-center">
                  <button
                    onClick={() => toggleSlideOver(false)}
                    className="ml-3 mr-4 h-12 w-12 inline-flex items-center justify-center"
                  >
                    <ArrowLeftIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                  <h2 className="inline-block text-xl font-medium">{slideOverState.title}</h2>
                </div>
              </header>
              {children}
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition.Root>
  )
}
export default memo(SlideOver)
