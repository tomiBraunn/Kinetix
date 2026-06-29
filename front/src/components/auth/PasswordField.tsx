import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import Field from './Field'
import { Icon } from './icons'

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
  error?: string
  helper?: string
}

export default function PasswordField({ label, error, helper, ...props }: PasswordFieldProps) {
  const [show, setShow] = useState(false)

  return (
    <Field
      label={label}
      error={error}
      helper={helper}
      type={show ? 'text' : 'password'}
      adornment={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="flex text-accent-light transition-transform active:scale-90"
        >
          <Icon name={show ? 'visibility' : 'visibility_off'} size={22} />
        </button>
      }
      {...props}
    />
  )
}
