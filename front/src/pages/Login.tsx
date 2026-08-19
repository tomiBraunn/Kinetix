import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuthCard, { item } from '../components/auth/AuthCard'
import Field from '../components/auth/Field'
import PasswordField from '../components/auth/PasswordField'
import { SubmitButton, GoogleButton } from '../components/auth/Buttons'
import OrDivider from '../components/auth/OrDivider'
import { LoginIcon } from '../components/auth/icons'
import GradientBackground from '../components/GradientBackground'
import { useAuth } from '../context/AuthContext'

type Errors = { email?: string; password?: string }

type LocationState = { from?: string }

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loading, error, clearError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})

  const redirectTo = (location.state as LocationState | null)?.from ?? '/home'

  function validate(): Errors {
    const next: Errors = {}
    if (!email.trim()) next.email = 'Ingresá tu email.'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = 'Ese email no parece válido.'
    if (!password) next.password = 'Ingresá tu contraseña.'
    return next
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch {
      // Error is surfaced through useAuth().error — no extra work here.
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <GradientBackground />
      <div className="relative z-10 w-full max-w-[544px]">
        <AuthCard icon={<LoginIcon />} title="Iniciar sesión">
      <form onSubmit={handleSubmit} noValidate>
        <motion.div variants={item} className="mb-6">
          <Field
            label="Email"
            type="email"
            placeholder="kin@tix.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearError()
            }}
            error={errors.email}
            autoComplete="email"
          />
        </motion.div>

        <motion.div variants={item} className="mb-7">
          <PasswordField
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearError()
            }}
            error={errors.password}
            autoComplete="current-password"
          />
        </motion.div>

        <motion.div variants={item} className="mb-8 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-5 w-5 rounded-md border-accent accent-accent" />
            <span className="text-text-label text-[15px] font-semibold">Recordarme</span>
          </label>
          <Link to="/olvidaste-contraseña" className="text-accent text-[15px] font-bold hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mb-4 text-rose-500 text-sm font-semibold text-center"
          >
            {error}
          </motion.p>
        )}

        <motion.div variants={item}>
          <SubmitButton type="submit" loading={loading}>
            Iniciar sesión
          </SubmitButton>
        </motion.div>
      </form>

      <motion.div variants={item} className="my-8">
        <OrDivider />
      </motion.div>

      <motion.div variants={item}>
        <GoogleButton disabled={loading} />
      </motion.div>

      <motion.p variants={item} className="text-center mt-6 text-text-label text-sm">
        ¿No tenés cuenta?{' '}
        <Link to="/register" className="text-accent font-bold hover:underline">Registrarse</Link>
      </motion.p>

      <motion.p variants={item} className="text-center mt-4 text-text-muted text-sm">
        <Link to="/" className="font-bold hover:underline hover:text-accent">← Volver</Link>
      </motion.p>
    </AuthCard>
      </div>
    </div>
  )
}
