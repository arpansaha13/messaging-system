// Icons
import { Icon } from '@iconify/react'
import alarmIcon from '@iconify-icons/mdi/alarm'
import checkIcon from '@iconify-icons/mdi/check'
import checkAllIcon from '@iconify-icons/mdi/check-all'
// Enum
import { MessageStatus } from '../types/index.types'

export default function MsgStatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case MessageStatus.SENDING:
      return <Icon icon={alarmIcon} className="inline-block flex-shrink-0" color="inherit" width={16} height={16} />
    case MessageStatus.SENT:
      return <Icon icon={checkIcon} className="inline-block flex-shrink-0" color="inherit" width={16} height={16} />
    case MessageStatus.DELIVERED:
      return <Icon icon={checkAllIcon} className="inline-block flex-shrink-0" color="inherit" width={16} height={16} />
    case MessageStatus.READ:
      return <Icon icon={checkAllIcon} className="inline-block flex-shrink-0" color="#38bdf8" width={16} height={16} />
    default:
      console.error('Invalid message status.')
      return null
  }
}
