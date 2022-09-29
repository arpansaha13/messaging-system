import { memo, useEffect, useRef, useState } from 'react'
// Icons
import { MicrophoneIcon } from '@heroicons/react/24/solid'
import { PaperClipIcon , FaceSmileIcon } from '@heroicons/react/24/outline'
// Components
import TextArea from './TextArea'
// Stores
import { useChatStore } from '../../stores/useChatStore'
import { useDraftStore } from '../../stores/useDraftStore'
import { useChatListStore } from '../../stores/useChatListStore'
// Types
import type { KeyboardEvent } from 'react'

const ChatFooter = () => {
  const send = useChatStore(state => state.send)
  const addDraft = useDraftStore(state => state.add)
  const drafts = useDraftStore(state => state.drafts)
  const removeDraft = useDraftStore(state => state.remove)
  const activeChat = useChatListStore(state => state.activeChat)!

  const [ value, setValue ] = useState('')
  const prevChat = useRef<string>(activeChat)

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && value) {
      send(activeChat, value)
      setValue('')
    }
  }

  useEffect(() => {
    // Store the draft, if any.
    if (value) {
      addDraft(prevChat.current, value)
      setValue('')
    }
    // Retrieve the draft, if any.
    if (drafts.has(activeChat)) {
      setValue(drafts.get(activeChat)!)
      removeDraft(activeChat)
    }
    prevChat.current = activeChat
  }, [activeChat])

  return (
    <div className='px-4 py-2.5 w-full flex items-center text-gray-400 bg-gray-800 space-x-1'>
      <button className='p-1 btn-icon'>
        <FaceSmileIcon className='w-7 h-7 flex-shrink-0' />
      </button>

      <button className='p-2 rounded-full hover:bg-gray-700/70 btn-icon'>
        <PaperClipIcon className='w-6 h-6 flex-shrink-0' />
      </button>

      <div className='px-1 flex-grow'>
        <TextArea value={ value } setValue={ setValue } handleKeyDown={ handleKeyDown } />
      </div>

      <button className='p-2 btn-icon'>
        <MicrophoneIcon className='w-6 h-6 flex-shrink-0' />
      </button>
    </div>
  )
}
export default memo(ChatFooter)
