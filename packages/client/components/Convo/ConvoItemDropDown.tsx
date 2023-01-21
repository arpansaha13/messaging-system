import { Fragment } from 'react'
// Components
import { Menu, Transition } from '@headlessui/react'
// Icons
import { ChevronDownIcon } from '@heroicons/react/24/solid'
// Utils
import { classNames } from '../../utils'
// Types
import type { ReactNode, MouseEvent } from 'react'

interface DropDownProps {
  menuItems: {
    slot: string | ReactNode
    onClick: () => void
  }[]
}

const ConvoItemDropDown = ({ menuItems }: DropDownProps) => {
  return (
    <Menu as="div" className="relative text-left">
      {({ open }) => (
        <>
          <div className="h-full flex items-center">
            <Menu.Button
              className="inline-flex items-center justify-center focus:outline-none"
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              className="absolute z-10 mt-2 origin-top-left rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow shadow-gray-700 dark:shadow-black focus:outline-none"
              style={{ width: `12rem` }}
            >
              <div className="py-2">
                {menuItems.map((menuItem, i) => {
                  return (
                    <Menu.Item key={i}>
                      {({ active }) => (
                        <button
                          className={classNames(
                            active ? 'bg-gray-200 dark:bg-gray-900' : '',
                            'block w-full px-6 py-2.5 text-sm text-left',
                          )}
                          onClick={e => {
                            e.stopPropagation()
                            menuItem.onClick()
                          }}
                        >
                          {menuItem.slot}
                        </button>
                      )}
                    </Menu.Item>
                  )
                })}
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  )
}
// Frequently updates when parent re-renders.
export default ConvoItemDropDown
