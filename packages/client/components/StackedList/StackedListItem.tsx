import { memo } from 'react'
import { format } from 'date-fns'

export interface StackedListItemProps {
  name: string
  dp: string | null
  time?: number
  text: string
}

const StackedListItem = ({ name, dp, time, text }: StackedListItemProps) => {
  return (
    <>
      <img
        className="h-12 w-12 rounded-full"
        {...(dp ? { src: dp } : {})}
        alt=""
      />
      <div className="ml-4 py-3 h-full w-full border-b border-gray-700">
        <div className="flex justify-between">
          <p className="text-base text-gray-50">{name}</p>
          {time && (
            <p className="text-xs text-gray-400 flex items-end">
              <span>{format(time, 'h:mm a')}</span>
            </p>
          )}
        </div>
        <div className="flex justify-between">
          <p className="text-sm text-gray-400 line-clamp-1">{text}</p>
        </div>
      </div>
    </>
  )
}
export default memo(StackedListItem)
