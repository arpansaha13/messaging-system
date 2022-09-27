import { memo } from 'react'

const TypeArea = () => {
  return (
    <div>
      <label htmlFor="type-area" className="sr-only">
        Type a message
      </label>
      <div className="relative">
        <input
          id="type-area"
          name="type-area"
          className="block w-full rounded-lg bg-gray-700/70 text-gray-200 px-3 py-2.5 placeholder-gray-400 focus:outline-none"
          placeholder="Type a message"
          type="type-area"
        />
      </div>
    </div>
  )
}

export default memo(TypeArea)
