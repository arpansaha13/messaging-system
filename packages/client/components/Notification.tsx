import { Fragment, memo } from 'react'
import { Transition } from '@headlessui/react'
// Icons
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/20/solid'
// Stores
import { useNotificationState } from '../stores/useNotificationState'

const Notification = () => {
  const store = useNotificationState()

  return (
    <>
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6"
      >
        <div className="w-full flex flex-col items-center space-y-4">
          <Transition
            show={store.show}
            as={Fragment}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {store.status === 'success' ? (
                      <CheckCircleIcon className="h-7 w-7 text-green-400 dark:text-green-500" aria-hidden="true" />
                    ) : (
                      <ExclamationCircleIcon className="h-7 w-7 text-red-400 dark:text-red-500" aria-hidden="true" />
                    )}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{store.title}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{store.description}</p>
                  </div>
                  <div className="ml-4 flex flex-shrink-0">
                    <button
                      type="button"
                      className="inline-flex rounded-md bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      onClick={() => {
                        store.setNotification({ show: false })
                      }}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  )
}
export default memo(Notification)
