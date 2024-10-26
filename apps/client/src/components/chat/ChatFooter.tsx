'use client'

export interface ChatFooterProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const ChatFooter = (props: Readonly<ChatFooterProps>) => {
  const { value, onChange, onKeyDown } = props

  return (
    <div className="flex-grow px-1">
      <div>
        <label htmlFor="type-area" className="sr-only">
          Type a message
        </label>
        <div className="relative">
          <input
            type="text"
            id="type-area"
            name="type-area"
            autoFocus
            placeholder="Type a message"
            className="block w-full rounded-lg border-none bg-white px-3 py-2.5 text-sm text-gray-500 placeholder-gray-400 shadow focus:border-none focus:outline-none focus:ring-0 dark:bg-gray-700/70 dark:text-gray-200"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </div>
  )
}

ChatFooter.displayName = 'ChatFooter'
export default ChatFooter
