import { useEffect, useRef } from 'react'
// Components
import Message from './Message'
// Types
import type { MessageType } from '../../types'

interface ChatAreaProps {
  messages: Map<number, MessageType> | null
  height: number
}

export default function ChatArea({ messages, height }: ChatAreaProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapItr = messages?.entries() ?? null

  // TODO: refactor this code to make it cleaner
  const renderMap: JSX.Element[] | null =
    mapItr === null
      ? null
      : (() => {
          const temp: JSX.Element[] = []
          let mapEntry = mapItr.next()

          while (!mapEntry.done) {
            temp.push(
              <Message key={mapEntry.value[0]} message={mapEntry.value[1]} />,
            )
            mapEntry = mapItr.next()
          }
          return temp
        })()

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
        {renderMap}
      </div>
    </div>
  )
}
