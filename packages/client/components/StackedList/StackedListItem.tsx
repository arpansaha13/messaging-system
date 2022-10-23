import { memo } from 'react'
import { format } from 'date-fns'

export interface StackedListItemProps {
  name: string | null
  dp: string | null
  time?: number
  text: string
}

const StackedListItem = ({ name, dp, time, text }: StackedListItemProps) => {
  return (
    <>
      {dp !== null ? (
        <img className="h-12 w-12 rounded-full" src={dp} alt="" />
      ) : (
        <div className="flex-shrink-0 h-12 w-12 overflow-hidden rounded-full bg-gray-500">
          <svg
            className="h-full w-full text-gray-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      )}

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
