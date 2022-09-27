import { memo } from 'react'
import classNames from '../../utils/classNames'

import type { MessageType } from '../../types'

interface MessageProps {
  message: MessageType
}

const Message = ({ message }: MessageProps) => {
  return (
    <div className={ classNames(
      'max-w-xl w-max mb-4 px-2 pt-1.5 pb-2.5 text-sm rounded-lg text-gray-100 space-y-1.5 relative',
      message.myMsg ? 'bg-emerald-800 ml-auto' : 'bg-slate-700'
    ) }>
      <span>{ message.msg }</span>

      <p className="min-w-[4rem] text-xs text-gray-300 inline-flex items-end justify-end">
        <span className='absolute right-2 bottom-1'>{ message.time }</span>
      </p>
    </div>
  )
}
export default memo(Message)
