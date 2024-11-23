import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  validationError?: string | null
}

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { label, validationError = null, ...inputAttrs } = props

  return (
    <div className="relative">
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-100">
        {label}
      </label>
      <div className="mt-1">
        <input
          ref={ref}
          {...inputAttrs}
          className="text focus:border-brand-500 focus:ring-brand-500 block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none sm:text-sm dark:bg-gray-800/70"
        />
      </div>
      {validationError !== null && (
        <p className="absolute -bottom-5 left-0.5 text-xs text-red-400">{validationError}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
