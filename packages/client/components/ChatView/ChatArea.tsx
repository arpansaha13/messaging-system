import { useEffect, useRef } from 'react'
// Components
import Message from './Message'
// Types
import type { MessageType } from '../../types'

interface ChatAreaProps {
  messages: MessageType[]
  height: number
}

export default function ChatArea({ messages, height }: ChatAreaProps) {
  const elRef = useRef<HTMLDivElement>(null)

  // Keep scroll position at bottom
  useEffect(() => {
    if (elRef.current) elRef.current.scrollTop = elRef.current.scrollHeight
  })

  return (
    <div
      className="flex flex-col justify-end"
      style={{ height: `${height}px` }}
    >
      <div
        ref={elRef}
        className="px-20 py-4 max-h-full overflow-y-scroll scrollbar"
      >
        {messages.map((message, i) => {
          return <Message key={i} message={message} />
        })}
      </div>
    </div>
  )
}
