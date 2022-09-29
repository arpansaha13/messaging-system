import Message from './Message'

import type { MessageType } from '../../types'

interface ChatAreaProps {
  messages: MessageType[]
}

export default function ChatArea({ messages }: ChatAreaProps) {
  return (
    <div className='h-full flex flex-col justify-end'>
      {
        messages.map((message, i) => {
          return (
            <Message key={ message.time } message={ message } />
          )
        })
      }
    </div>
  )
}
