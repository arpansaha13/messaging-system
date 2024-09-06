// Types
import type { InputHTMLAttributes, RefObject } from 'react'

interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  type?: InputHTMLAttributes<HTMLInputElement>['type']
  innerRef?: RefObject<HTMLInputElement>
  validationError?: string | null
}

export default function BaseInput(props: Readonly<BaseInputProps>) {
  const { label, innerRef, validationError = null, type = 'text', ...inputAttrs } = props

  return (
    <div className="relative">
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-100">
        {label}
      </label>
      <div className="mt-1">
        <input
          ref={innerRef}
          {...inputAttrs}
          type={type}
          pattern={getInputPattern(type)}
          className="text focus:border-brand-500 focus:ring-brand-500 user-invalid:border-red-500 user-invalid:focus:border-red-500 user-invalid:focus:ring-red-500 block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none sm:text-sm dark:bg-gray-800/70"
        />
      </div>
      {validationError !== null && (
        <p className="absolute -bottom-5 left-0.5 text-xs text-red-400">{validationError}</p>
      )}
    </div>
  )
}

function getInputPattern(type: string) {
  if (type === 'email') {
    return "(?!(^[.-].*|[^@]*.@|.*.{2,}.*)|^.{254}.)([a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@)(?!-.*|.*-.)([a-zA-Z0-9-]{1,63}.)+[a-zA-Z]{2,15}"
  }
}
