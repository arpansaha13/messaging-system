import ChatBody from './ChatBody'
import ChatHeader from './ChatHeader'
import ChatFooter from './ChatFooter'

export default function Chat() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 flex items-center justify-between bg-gray-100 dark:bg-gray-800 shadow-sm shadow-gray-400/30 dark:shadow-none relative z-10">
        <ChatHeader />
      </div>

      <div className="flex-grow flex flex-col justify-end bg-slate-200/50 dark:bg-gray-900 overflow-hidden">
        <ChatBody />
      </div>

      <div className="px-4 py-2.5 w-full flex items-center text-gray-900 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 space-x-1 shadow-[0_-1px_2px_0] shadow-gray-300/20 dark:shadow-none relative z-10">
        <ChatFooter />
      </div>
    </div>
  )
}
