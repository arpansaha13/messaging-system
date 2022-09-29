import { Fragment } from 'react'
// Components
import { Menu, Transition } from '@headlessui/react'
// Utils
import classNames from '../utils/classNames'
// Types
import type { ReactNode } from 'react'

interface DropDownProps {
  buttonSlot: string | ReactNode
  menuItems: {
    slot: string | ReactNode
    onClick: () => void
  }[]
}

const DropDown = ({ buttonSlot, menuItems }: DropDownProps) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      {
        ({ open }) => (
          <>
            <div>
              <Menu.Button className={ classNames(open ? 'bg-gray-600/80 rounded-full' : 'rounded-sm', 'p-2 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sky-500/70') }>
                { buttonSlot }
              </Menu.Button>
            </div>

            <Transition
              as={ Fragment }
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 text-gray-100 shadow shadow-black focus:outline-none">
                <div className="py-1">
                  {
                    menuItems.map((menuItem, i) => {
                      return (
                        <Menu.Item key={ i }>
                          {({ active }) => (
                            <button
                              className={classNames(
                                active ? 'bg-gray-900' : '',
                                'block w-full px-4 py-2 text-sm text-left'
                              )}
                              onClick={ menuItem.onClick }
                            >
                              { menuItem.slot }
                            </button>
                          )}
                        </Menu.Item>
                      )
                    })
                  }
                </div>
              </Menu.Items>
            </Transition>
          </>
        )
      }
    </Menu>
  )
}
// Not memoizing this component because it will frequently update when parent re-renders.
export default DropDown
