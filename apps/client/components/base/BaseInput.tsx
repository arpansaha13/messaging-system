// Types
import type { InputHTMLAttributes, RefObject } from 'react'

interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  innerRef?: RefObject<HTMLInputElement>
  validationError?: string | null
}

export default function BaseInput(props: BaseInputProps) {
  const { label, innerRef, validationError = null, ...inputAttrs } = props

  return (
    <div className="relative">
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-100">
        {label}
      </label>
      <div className="mt-1">
        <input
          ref={innerRef}
          {...inputAttrs}
          className="text block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm dark:bg-gray-800/70"
        />
      </div>
      {validationError !== null && (
        <p className="absolute -bottom-5 left-0.5 text-xs text-red-400">{validationError}</p>
      )}
    </div>
  )
}
