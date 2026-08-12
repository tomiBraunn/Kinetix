// Google Material Symbols (Rounded), rendered via the CSS font.
// The icon name is the ligature text inside the span.

type IconProps = {
  name: string
  size?: number
  className?: string
  fill?: boolean
}

export function Icon({ name, size = 24, className = '', fill = false }: IconProps) {
  return (
    <span
      className={`material-symbols-rounded select-none ${className}`}
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 600` }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

// Header badge icons, in Kinetix primary blue.
export function LoginIcon() {
  return <Icon name="login" size={20} className="text-primary" />
}

export function RegisterIcon() {
  return <Icon name="person_add" size={20} className="text-primary" />
}

export function MailIcon() {
  return <Icon name="mail" size={20} className="text-primary" />
}

export function KeyIcon() {
  return <Icon name="key" size={20} className="text-primary" />
}

export function CheckIcon() {
  return <Icon name="task_alt" size={20} className="text-primary" />
}
