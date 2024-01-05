import { type ChangeEvent, useRef, useState, KeyboardEvent, type FormEvent } from 'react'
import { Dialog } from '@headlessui/react'
import { useDebounce } from 'react-use'
import { shallow } from 'zustand/shallow'
// Custom Hook
import { useFetch } from '../../hooks/useFetch'
// Components
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import BaseInput from '../base/BaseInput'
import SearchBar from '../common/SearchBar'
import ContactListItem from './ContactListItem'
// Store
import { useStore } from '../../stores/index.store'
// Utils
import { isNullOrUndefined } from '@arpansaha13/utils'
// Types
import type { ContactResType, UserType } from '../../types'

const AddContact = () => {
  const fetchHook = useFetch()
  const [toggleNotification, setNotification, toggleSlideOver, initContactStore] = useStore(
    state => [state.toggleNotification, state.setNotification, state.toggleSlideOver, state.initContactStore],
    shallow,
  )

  const [value, setValue] = useState('')
  const [modalOpen, setOpen] = useState(false)
  const [modalContent, setModalContent] = useState({
    id: 0,
    alias: '',
    dp: null as string | null,
    bio: '',
    displayName: '',
  })
  const isFirstRun = useRef(true)
  const baseInputRef = useRef(null)

  const [searchRes, setSearchRes] = useState<UserType | null>(null)
  const [existingContact, setExistingContact] = useState<ContactResType | null>(null)

  useDebounce(
    () => {
      if (isFirstRun.current) {
        isFirstRun.current = false
        return
      }
      if (value === '') {
        setSearchRes(null)
        setExistingContact(null)
        return
      }
      fetchHook(`contacts?userId=${value}`).then(async (resContact: ContactResType) => {
        if (!resContact) {
          const resUser: UserType = await fetchHook(`users/search?search=${value}`)
          setSearchRes(resUser ? resUser : null)
        } else {
          setSearchRes(null)
        }
        setExistingContact(resContact ? resContact : null)
      })
    },
    1000,
    [value],
  )
  function handleClick(user: UserType) {
    setModalContent({ ...user, alias: '' })
    setOpen(true)
  }
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    modalContent.alias = e.target.value
  }
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // Prevent focus from returning to previous input field on undo
    // Happens when focus is changed programmatically
    if (e.ctrlKey && e.key === 'z') e.preventDefault()
  }
  function addToContacts(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    fetchHook('contacts', {
      method: 'POST',
      body: JSON.stringify({ userIdToAdd: modalContent.id, alias: modalContent.alias }),
    }).then((res: { message: string }) => {
      setOpen(false)
      setNotification({
        show: true,
        status: 'success',
        title: 'Contact added',
        description: res.message,
      })
      toggleSlideOver(false)
      initContactStore(fetchHook)
      setTimeout(() => {
        toggleNotification(false)
      }, 5000)
    })
  }

  return (
    <div className="p-2 h-full overflow-y-scroll scrollbar">
      <SearchBar
        id="search"
        name="search"
        placeholder="Search by user-id"
        type="number"
        // min={0}
        value={value}
        setValue={setValue}
      />

      {!isNullOrUndefined(searchRes) && (
        <ul role="list">
          <ContactListItem
            key={searchRes.id}
            contactId={searchRes.id}
            userId={searchRes.id}
            bio={searchRes.bio}
            dp={searchRes.dp}
            alias={`~${searchRes.displayName}`}
            displayName={searchRes.displayName}
            onClick={() => handleClick(searchRes)}
          />
        </ul>
      )}

      {!isNullOrUndefined(existingContact) && (
        <>
          <p className="mt-4 text-lg text-center font-medium leading-6 text-gray-900 dark:text-gray-100">
            {existingContact.alias} is already in contacts
          </p>
          <div className="mt-4 mx-auto text-center flex justify-center">
            <Avatar
              src={existingContact.userInContact.dp}
              alt={`display picture of ${existingContact.userInContact.displayName}`}
              width={5}
              height={5}
            />
          </div>
          <div className="mt-2">
            <p className="text-sm text-center text-gray-500 dark:text-gray-300">{existingContact.userInContact.bio}</p>
          </div>
        </>
      )}

      <Modal initialFocusRef={baseInputRef} open={modalOpen} setOpen={setOpen}>
        <div className="mt-3 sm:mt-5">
          <Dialog.Title as="h3" className="text-lg text-center font-medium leading-6 text-gray-900 dark:text-white">
            Add {`~${modalContent.displayName}`} to contacts
          </Dialog.Title>
          <div className="mt-4 mx-auto text-center flex justify-center">
            <Avatar src={modalContent.dp} alt={`display picture of ${modalContent.displayName}`} width={6} height={6} />
          </div>
          <div className="mt-2">
            <p className="text-sm text-center text-gray-500 dark:text-gray-300">{modalContent.bio}</p>
          </div>
          <form className="mt-4" onSubmit={addToContacts}>
            <BaseInput
              innerRef={baseInputRef}
              label="By what name would you like to save this contact?"
              id="alias"
              name="alias"
              type="text"
              required
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
              >
                Add to contacts
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white dark:bg-gray-700 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-50 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}
export default AddContact
