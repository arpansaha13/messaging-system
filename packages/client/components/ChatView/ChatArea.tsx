import { useEffect, useRef } from 'react'
// Components
import Message from './Message'
// Types
import type { MessageType } from '../../types/index.types'

interface ChatAreaProps {
  messages: Map<number, MessageType> | null
}

export default function ChatArea({ messages }: ChatAreaProps) {
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
            temp.push(<Message key={mapEntry.value[0]} message={mapEntry.value[1]} />)
            mapEntry = mapItr.next()
          }
          return temp
        })()

  // Keep scroll position at bottom
  useEffect(() => {
    if (elRef.current) elRef.current.scrollTop = elRef.current.scrollHeight
  })

  const HEADER_HEIGHT_PX = 60
  const FOOTER_HEIGHT_PX = 60
  const LAYOUT_Y_PADDING_REM = 2

  return (
    <div
      ref={elRef}
      className="px-20 py-4 overflow-y-scroll scrollbar"
      style={{
        maxHeight: `calc(100vh - ${HEADER_HEIGHT_PX}px - ${FOOTER_HEIGHT_PX}px - ${LAYOUT_Y_PADDING_REM}rem)`,
      }}
    >
      {renderMap}
    </div>
  )
}
