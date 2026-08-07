import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'

// Pill input matching Kinetix brand. Label above, error below (skill Rule 6).
export const inputBase =
  'w-full h-[54px] bg-bg-input rounded-full px-6 text-[15px] font-medium text-text-label ' +
  'placeholder:text-text-placeholder outline-none transition-[box-shadow,background-color] duration-200 ' +
  'focus:bg-white focus:ring-2 focus:ring-accent/40'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  helper?: string
  adornment?: ReactNode
}

export default function Field({ label, error, helper, adornment, className, ...props }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-text-label text-base font-bold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${inputBase} ${adornment ? 'pr-14' : ''} ${
            error ? 'ring-2 ring-rose-400/60' : ''
          } ${className ?? ''}`}
          {...props}
        />
        {adornment && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2">{adornment}</span>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-rose-500 text-sm font-medium">
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-helper`} className="text-text-placeholder text-sm">
          {helper}
        </p>
      ) : null}
    </div>
  )
}
