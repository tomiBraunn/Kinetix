import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 }

// Official multicolor Google "G" logo (Material Symbols is monochrome, so the
// brand mark stays an inline SVG).
function GoogleLogo() {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden="true">
      <path d="M18.17 9.72c0-.63-.05-1.24-.16-1.82H9.75v3.45h4.73c-.2 1.1-.83 2.03-1.77 2.66v2.2h2.85c1.67-1.54 2.63-3.8 2.63-6.49z" fill="#4285F4" />
      <path d="M9.75 18.5c2.38 0 4.37-.79 5.82-2.14l-2.85-2.2c-.79.53-1.79.84-2.97.84-2.28 0-4.21-1.54-4.9-3.61H1.87v2.27A9.75 9.75 0 009.75 18.5z" fill="#34A853" />
      <path d="M4.85 11.39c-.18-.53-.28-1.1-.28-1.69s.1-1.16.28-1.69V5.74H1.87A9.75 9.75 0 000 9.7c0 1.42.3 2.77.87 4z" fill="#FBBC05" />
      <path d="M9.75 3.79c1.3 0 2.46.45 3.38 1.33l2.53-2.53C14.13 1.12 12.15 0 9.75 0A9.75 9.75 0 001.87 5.74l2.98 2.27c.69-2.07 2.62-3.61 4.9-3.61z" fill="#EA4335" />
    </svg>
  )
}

// Drop the DOM animation/drag handlers that collide with framer-motion's props.
type MotionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'
>

type SubmitProps = MotionButtonProps & {
  loading?: boolean
}

// Same dance as MotionButtonProps, but for the anchor-based Google button.
type MotionAnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'
> & {
  disabled?: boolean
}

// Pink primary button with tactile press feedback (skill Rule 5) and a
// shimmer loading state instead of a generic spinner.
export function SubmitButton({ children, loading, disabled, className, ...props }: SubmitProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98, y: 1 }}
      transition={spring}
      disabled={loading || disabled}
      className={`relative w-full h-[54px] overflow-hidden rounded-full bg-accent text-white text-lg font-black ` +
        `shadow-[0_12px_24px_-12px_rgba(224,64,160,0.6)] transition-colors hover:bg-[#C83890] ` +
        `disabled:cursor-not-allowed disabled:opacity-90 ${className ?? ''}`}
      {...props}
    >
      <span className={loading ? 'opacity-0' : 'opacity-100'}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-full w-1/3 animate-[shimmer_1.2s_infinite] bg-linear-to-r from-transparent via-white/30 to-transparent" />
        </span>
      )}
    </motion.button>
  )
}

// Redirect flow: just a styled link to the backend's /api/auth/google/redirect.
// No popups, no SDKs, no COOP issues.
export function GoogleButton({ disabled, className, ...props }: MotionAnchorProps) {
  return (
    <motion.a
      whileTap={{ scale: 0.98, y: 1 }}
      transition={spring}
      aria-disabled={disabled}
      href="/api/auth/google/redirect"
      className={`w-full h-[54px] rounded-full border border-text-label/25 flex items-center justify-center gap-3 ` +
        `transition-colors hover:bg-bg-input/50 ${disabled ? 'pointer-events-none opacity-90' : ''} ${className ?? ''}`}
      {...props}
    >
      <GoogleLogo />
      <span className="text-text-label text-base font-bold">Continua con Google</span>
    </motion.a>
  )
}
