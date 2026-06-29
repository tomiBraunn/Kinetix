import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import googleG from '../../assets/google/google-g.png'

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 }

// Official Google "G" logo, downloaded from the Sign in with Google branding
// guidelines so it stays pixel-perfect to the brand mark.
function GoogleLogo() {
  return <img src={googleG} alt="" aria-hidden="true" width={18} height={18} />
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
