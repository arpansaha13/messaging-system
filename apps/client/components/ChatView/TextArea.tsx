import { useEffect, useRef } from 'react'
// Types
import type { ChangeEvent, Dispatch, KeyboardEvent, SetStateAction } from 'react'

interface TextAreaProps {
  value: string
  setValue: Dispatch<SetStateAction<string>>
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
}

const TextArea = ({ value, setValue, onKeyDown }: TextAreaProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
  }

  // Shift focus to the textarea on every render
  useEffect(() => {
    inputRef.current?.focus()
  })

  return (
    <div>
      <label htmlFor="type-area" className="sr-only">
        Type a message
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id="type-area"
          name="type-area"
          className="block w-full rounded-lg bg-white dark:bg-gray-700/70 text-sm text-gray-500 dark:text-gray-200 px-3 py-2.5 border-none placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-none shadow-sm shadow-gray-300/30 dark:shadow-none"
          placeholder="Type a message"
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  )
}
// Frequently updates on state change.
export default TextArea
