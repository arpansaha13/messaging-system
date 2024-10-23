import { useRef } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid'

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
}

export default function SearchBar({ id, value, setValue, ...attrs }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function clear() {
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <>
      <label htmlFor={id} className="sr-only">
        Search
      </label>

      <div className="group relative overflow-hidden rounded-lg">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon
            className="group-focus-within:text-brand-600 dark:group-focus-within:text-brand-500 pointer-events-none h-4 w-4 text-gray-600 transition-colors dark:text-gray-400"
            aria-hidden="true"
          />
        </div>

        <span className="group-focus-within:bg-brand-600 dark:group-focus-within:bg-brand-500 absolute inset-x-0 bottom-0 h-0.5 transition-colors" />

        <input
          ref={inputRef}
          id={id}
          {...attrs}
          className="block w-full border-none bg-gray-200 py-2 pl-12 pr-8 text-sm text-gray-600 placeholder-gray-500 shadow focus:border-none focus:outline-none focus:ring-0 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-400 dark:shadow-gray-950/40"
          value={value}
          onChange={e => setValue(e.target.value)}
        />

        <div className={value ? 'absolute inset-y-0 right-0 flex items-center pr-2' : 'hidden'}>
          <button type="button" onClick={clear}>
            <XMarkIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  )
}
