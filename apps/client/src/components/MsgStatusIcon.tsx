import { Icon } from '@iconify/react'
import { MessageStatus } from '@shared/constants'

export default function MsgStatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case MessageStatus.SENDING:
      return <Icon icon="mdi:alarm" className="inline-block flex-shrink-0" color="inherit" width={16} height={16} />
    case MessageStatus.SENT:
      return <Icon icon="mdi:check" className="inline-block flex-shrink-0" color="inherit" width={16} height={16} />
    case MessageStatus.DELIVERED:
      return <Icon icon="mdi:check-all" className="inline-block flex-shrink-0" color="inherit" width={16} height={16} />
    case MessageStatus.READ:
      return <Icon icon="mdi:check-all" className="inline-block flex-shrink-0" color="#38bdf8" width={16} height={16} />
    default:
      console.error('Invalid message status.')
      return null
  }
}
