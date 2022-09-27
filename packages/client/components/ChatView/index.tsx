import ChatArea from './ChatArea'
import ChatHeader from './ChatHeader'
import ChatFooter from './ChatFooter'

export default function ChatView() {
  return (
    <div className={ 'flex flex-col h-full' }>
      <ChatHeader />

      <div className='px-20 flex-grow bg-gray-900 overflow-auto'>
        <ChatArea />
      </div>

      <ChatFooter />
    </div>
  )
}
