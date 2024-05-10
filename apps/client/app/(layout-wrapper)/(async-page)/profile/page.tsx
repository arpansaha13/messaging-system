'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { shallow } from 'zustand/shallow'
import { classNames } from '@arpansaha13/utils'
import { CheckIcon, PencilIcon } from '@heroicons/react/24/solid'
import Avatar from '~common/Avatar'
import { useAuthStore } from '~/store/useAuthStore'
import _fetch from '~/utils/_fetch'
import type { Dispatch, KeyboardEvent, SetStateAction } from 'react'
import type { AuthUserType } from '@pkg/types'

interface FieldProps {
  heading: string
  content: string
  setContent: Dispatch<SetStateAction<string>>
  editState: boolean
  setEditState: Dispatch<SetStateAction<boolean>>
}

const Field = ({ heading, content, setContent, editState, setEditState }: FieldProps) => {
  const contentRef = useRef<HTMLParagraphElement>(null)

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      setEditState(false)
    }
  }

  useEffect(() => {
    if (editState) {
      contentRef.current?.focus()
      return
    }
    const newContent = contentRef.current?.textContent
    if (!editState && newContent && content !== newContent) {
      setContent(newContent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editState])

  return (
    <>
      <h3 className="mb-5 text-sm text-emerald-700">{heading}</h3>
      <div
        className={classNames(
          'mb-8 flex pb-1 shadow-[0_2px_0px_0px] transition-shadow',
          editState ? 'shadow-emerald-700' : 'shadow-transparent',
        )}
      >
        <p
          ref={contentRef}
          contentEditable={editState}
          suppressContentEditableWarning={true}
          className="flex-grow text-base text-gray-900 dark:text-gray-200 focus:border-none focus:outline-none"
          onKeyDown={handleKeyDown}
        >
          {content}
        </p>
        <button onClick={() => setEditState(b => !b)}>
          {editState ? (
            <CheckIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          ) : (
            <PencilIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          )}
        </button>
      </div>
    </>
  )
}

const MemoisedField = memo(Field)

export default function Page() {
  const [authUser, setAuthUser] = useAuthStore(state => [state.authUser!, state.setAuthUser], shallow)

  const [editingBio, setEditBio] = useState(false)
  const [editingDisplayName, setEditDisplayName] = useState(false)
  const [displayName, setDisplayName] = useState(authUser.displayName)
  const [bio, setBio] = useState(authUser.bio)

  useEffect(() => {
    const data: Partial<Pick<AuthUserType, 'bio' | 'displayName'>> = {}

    if (authUser.bio !== bio) data.bio = bio
    if (authUser.displayName !== displayName) data.displayName = displayName
    if (Object.keys(data).length === 0) return

    _fetch('users/me', {
      body: data,
      method: 'PATCH',
    }).then((res: AuthUserType) => {
      setAuthUser(res)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, bio, authUser])

  return (
    <div className="px-8 py-6 space-y-10 h-full overflow-auto scrollbar">
      <div className="flex justify-center">
        <Avatar src={authUser.dp} width={12.5} height={12.5} />
      </div>

      <div>
        <h3 className="mb-5 text-sm text-emerald-600">User id</h3>
        <div className="mb-8 pb-1">
          <p className="text-base text-gray-900 dark:text-gray-200">{authUser.id}</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Other users can find and add you to their contacts using this user-id.
        </p>
      </div>

      <div>
        <MemoisedField
          heading="Your name"
          content={displayName}
          setContent={setDisplayName}
          editState={editingDisplayName}
          setEditState={setEditDisplayName}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This is not your username or pin. This name will be visible to your WhatsApp contacts.
        </p>
      </div>

      <div>
        <MemoisedField
          heading="About"
          content={bio}
          setContent={setBio}
          editState={editingBio}
          setEditState={setEditBio}
        />
      </div>
    </div>
  )
}
