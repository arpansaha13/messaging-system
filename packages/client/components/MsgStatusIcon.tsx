// Icons
import { ClockIcon, CheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
// Enum
import { MessageStatus } from '../types'

export default function MsgStatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case MessageStatus.SENDING:
      return <ClockIcon className="inline-block w-3.5 h-3.5 flex-shrink-0" />
    case MessageStatus.SENT:
      return <CheckIcon className="inline-block w-3.5 h-3.5 flex-shrink-0" />
    // TODO: Find an icon for double-tick and use here
    case MessageStatus.DELIVERED:
      return <CheckCircleIcon className="inline-block w-3.5 h-3.5 flex-shrink-0" />
    case MessageStatus.READ:
      return <CheckCircleIcon className="inline-block w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
    default:
      console.error('Invalid message status.')
      return null
  }
}
