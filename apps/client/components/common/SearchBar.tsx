import { memo, useRef } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid'

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
}

const SearchBar = ({ id, value, setValue, ...attrs }: SearchBarProps) => {
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

      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon
            className="pointer-events-none h-4 w-4 text-gray-600 dark:text-gray-400"
            aria-hidden="true"
          />
        </div>

        <input
          ref={inputRef}
          id={id}
          {...attrs}
          className="block w-full rounded-lg text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 py-2 pl-16 pr-8 text-sm shadow dark:shadow-gray-950/40 border-none placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-none"
          value={value}
          onChange={e => setValue(e.target.value)}
        />

        <div className={value ? 'absolute inset-y-0 right-0 flex items-center pr-2' : 'hidden'}>
          <button onClick={clear}>
            <XMarkIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  )
}
export default memo(SearchBar)
