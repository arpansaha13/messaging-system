import { Fragment, memo } from 'react'
import { Transition } from '@headlessui/react'
import { shallow } from 'zustand/shallow'
// Stores
import { useStore } from '~/store'
// Types
import type { ReactNode } from 'react'

interface SlideOverProps {
  children: ReactNode
}

const SlideOver = ({ children }: SlideOverProps) => {
  const [slideOverState] = useStore(state => [state.slideOverState], shallow)

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
            <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900 shadow-xl">{children}</div>
          </div>
        </Transition.Child>
      </div>
    </Transition.Root>
  )
}
export default memo(SlideOver)
