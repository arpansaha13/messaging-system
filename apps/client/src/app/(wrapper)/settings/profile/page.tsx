'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { classNames } from '@arpansaha13/utils'
import { CheckIcon, PencilIcon } from '@heroicons/react/24/solid'
import { Avatar } from '~/components/common'
import { useGetAuthUserQuery, usePatchAuthUserMutation } from '~/store/features/users/users.api.slice'

interface FieldProps {
  name: 'bio' | 'globalName'
  heading: string
  content: string
}

const Field = (props: Readonly<FieldProps>) => {
  const { name, heading, content } = props

  const [editing, setEditing] = useState(false)
  const [patchAuthUser] = usePatchAuthUserMutation()
  const contentRef = useRef<HTMLParagraphElement>(null)

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      setEditing(false)
    }
  }

  useEffect(() => {
    const contentElement = contentRef.current
    if (!contentElement) return

    if (editing) {
      contentElement.focus()
      return
    }

    const newContent = contentElement.textContent
    if (newContent && content !== newContent) {
      patchAuthUser({ [name]: newContent })
    }
  }, [content, editing, name, patchAuthUser])

  return (
    <>
      <h3 className="text-brand-600 mb-5 text-sm font-medium">{heading}</h3>
      <div
        className={classNames(
          'mb-8 flex pb-1 shadow-[0_2px_0px_0px] transition-shadow',
          editing ? 'shadow-brand-700' : 'shadow-transparent',
        )}
      >
        <p
          ref={contentRef}
          contentEditable={editing}
          suppressContentEditableWarning={true}
          className="flex-grow text-base text-gray-900 focus:border-none focus:outline-none dark:text-gray-200"
          onKeyDown={handleKeyDown}
        >
          {content}
        </p>
        <button onClick={() => setEditing(b => !b)}>
          {editing ? (
            <CheckIcon className="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
          ) : (
            <PencilIcon className="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
          )}
        </button>
      </div>
    </>
  )
}

export default function Page() {
  const { data: authUser, isSuccess } = useGetAuthUserQuery()

  if (!isSuccess) {
    return null
  }

  return (
    <div className="space-y-10 px-8 py-6">
      <div className="flex justify-center">
        <Avatar src={authUser.dp} size={12.5} />
      </div>

      <div>
        <Field name="globalName" heading="Your name" content={authUser.globalName} />
      </div>

      <div>
        <Field name="bio" heading="About" content={authUser.bio} />
      </div>
    </div>
  )
}
