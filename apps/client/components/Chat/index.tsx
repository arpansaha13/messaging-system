import ChatBody from './ChatBody'
import ChatHeader from './ChatHeader'
import ChatFooter from './ChatFooter'

export default function Chat() {
  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <div className="flex-grow flex flex-col justify-end bg-slate-200/50 dark:bg-gray-900">
        <ChatBody />
      </div>
      <ChatFooter />
    </div>
  )
}
