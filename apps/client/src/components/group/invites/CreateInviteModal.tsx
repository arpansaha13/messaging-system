import { useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { useCopyToClipboard } from 'react-use'
import { DialogTitle } from '@headlessui/react'
import { ClipboardDocumentCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { getOrdinalSuffix } from '@arpansaha13/utils'
import { Modal } from '~/components/ui'
import { useCreateInviteQuery } from '~/store/features/groups/groups.api.slice'
import type { IGroup, IInvite } from '@shared/types/client'

interface CreateInviteModalProps {
  open: boolean
  groupId: IGroup['id']
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function CreateInviteModal(props: Readonly<CreateInviteModalProps>) {
  const { groupId, open, setOpen } = props

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [clipboardState, copyToClipboard] = useCopyToClipboard()
  const { data: invite, isSuccess } = useCreateInviteQuery(groupId)
  const inviteLink = useMemo(() => (invite ? `${window.location.origin}/invites/${invite.hash}` : null), [invite])
  const [isCopied, setIsCopied] = useState(!!clipboardState.value)

  function copy() {
    if (inviteLink) {
      copyToClipboard(inviteLink)
      setIsCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setIsCopied(false), 3000)
    }
  }

  if (!isSuccess) return null

  return (
    <Modal open={open} setOpen={setOpen}>
      <DialogTitle as="h3" className="text-center text-lg font-medium leading-6 text-gray-900 dark:text-white">
        Invite People
      </DialogTitle>

      <div className="mt-4 flex overflow-hidden rounded shadow">
        <div className="flex-grow bg-gray-300 px-4 py-2 dark:bg-gray-800">
          <p className="text-sm text-gray-900 dark:text-gray-200">{inviteLink}</p>
        </div>
        <div>
          <button
            type="button"
            className="bg-brand-500 dark:bg-brand-600 hover:bg-brand-600 dark:hover:bg-brand-700 flex w-28 items-center justify-center gap-1 px-4 py-2 text-sm font-medium transition-colors"
            onClick={copy}
          >
            {isCopied ? (
              <ClipboardDocumentCheckIcon className="dark:text-brand-100 size-5" />
            ) : (
              <DocumentTextIcon className="size-5 dark:text-white" />
            )}
            {isCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs text-gray-800 dark:text-gray-300">
        Invite link expires on {formatExpiresAt(invite.expiresAt)}
      </p>
    </Modal>
  )
}

function formatExpiresAt(expiresAt: IInvite['expiresAt']) {
  const date = format(expiresAt, 'd')
  const monthAndYear = format(expiresAt, 'MMM yy')
  const dateSuffix = getOrdinalSuffix(parseInt(date))
  const time = format(expiresAt, 'hh:mm a')

  return (
    <time>
      {date}
      <sup>{dateSuffix}</sup> {monthAndYear} at {time}
    </time>
  )
}
