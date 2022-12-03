// Types
import type { InputHTMLAttributes } from 'react'

interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  validationError?: string | null
}

export default function BaseInput(props: BaseInputProps) {
  const { label, validationError = null, ...inputAttrs } = props

  return (
    <div className="relative">
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-100">
        {label}
      </label>
      <div className="mt-1">
        <input
          {...inputAttrs}
          className="block w-full appearance-none rounded-md border border-gray-300 dark:bg-gray-800/70 px-3 py-2 text placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
        />
      </div>
      {validationError !== null && (
        <p className="text-xs text-red-400 absolute -bottom-5 left-0.5">{validationError}</p>
      )}
    </div>
  )
}
