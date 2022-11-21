import { memo } from 'react'
import { format } from 'date-fns'
// Components
import Avatar from '../Avatar'

export interface StackedListItemProps {
  name: string | null
  dp: string | null
  time?: number
  text: string
}

const StackedListItem = ({ name, dp, time, text }: StackedListItemProps) => {
  return (
    <>
      <Avatar src={dp} />

      <div className="ml-4 py-3 h-full w-full border-b border-gray-700">
        <div className="flex justify-between">
          <p className="text-base text-gray-50">{name ?? '[Unknown]'}</p>
          {time && (
            <p className="text-xs text-gray-400 flex items-end">
              <span>{format(time, 'h:mm a')}</span>
            </p>
          )}
        </div>
        <div className="flex justify-between">
          <p className="text-sm text-gray-400 line-clamp-1">
            {text ?? 'Hey there! I am using WhatsApp.'}
          </p>
        </div>
      </div>
    </>
  )
}
export default memo(StackedListItem)
