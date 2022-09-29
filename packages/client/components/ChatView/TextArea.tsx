import { useEffect, useRef } from 'react'
// Types
import type { ChangeEvent, Dispatch, KeyboardEvent, SetStateAction } from 'react'

interface TextAreaProps {
  value: string
  setValue: Dispatch<SetStateAction<string>>
  handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
}

const TextArea = ({ value, setValue, handleKeyDown }: TextAreaProps) => {
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
          ref={ inputRef }
          id="type-area"
          name="type-area"
          className="block w-full rounded-lg bg-gray-700/70 text-gray-200 px-3 py-2.5 placeholder-gray-400 focus:outline-none"
          placeholder="Type a message"
          type="type-area"
          value={ value }
          onChange={ handleChange }
          onKeyDown= { handleKeyDown }
        />
      </div>
    </div>
  )
}
// Not memoizing this component because it will frequently update on state change.
export default TextArea
