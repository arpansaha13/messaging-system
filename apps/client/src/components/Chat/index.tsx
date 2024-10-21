import ChatBody from './Body'
import ChatHeader from './Header'
import ChatFooter from './Footer'
import ChatProvider from './context'

export default function Chat() {
  return (
    <ChatProvider>
      <div className="flex h-full flex-col">
        <div className="relative z-10 flex items-center justify-between bg-gray-100 px-4 py-2.5 shadow-sm shadow-gray-400/30 dark:bg-gray-800 dark:shadow-none">
          <ChatHeader />
        </div>

        <div className="flex flex-grow flex-col justify-end overflow-hidden bg-slate-200/50 dark:bg-gray-900">
          <ChatBody />
        </div>

        <div className="relative z-10 flex w-full items-center space-x-1 bg-gray-100 px-4 py-2.5 text-gray-900 shadow-[0_-1px_2px_0] shadow-gray-300/20 dark:bg-gray-800 dark:text-gray-400 dark:shadow-none">
          <ChatFooter />
        </div>
      </div>
    </ChatProvider>
  )
}
