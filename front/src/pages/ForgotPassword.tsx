import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuthCard, { item } from '../components/auth/AuthCard'
import Field from '../components/auth/Field'
import { SubmitButton } from '../components/auth/Buttons'
import { KeyIcon, MailIcon } from '../components/auth/icons'
import GradientBackground from '../components/GradientBackground'
import { api } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Ingresá un email válido.')
      return
    }
    setError(null)
    setLoading(true)
    api
      .post<{ message: string }>('/auth/forgot-password', { email })
      .then(() => setDone(true))
      .catch((err) => setError(err instanceof Error ? err.message : 'Algo salió mal. Intentá de nuevo.'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <GradientBackground />
      <div className="relative z-10 w-full max-w-[544px]">
        <AuthCard icon={done ? <MailIcon /> : <KeyIcon />} title={done ? 'Revisá tu email' : 'Restablecer contraseña'}>
          {done ? (
            <motion.div variants={item} initial="hidden" animate="show">
              <div className="mb-6 rounded-2xl bg-violet-50 p-5 text-center">
                <span className="material-symbols-rounded text-[44px] text-accent">mark_email_read</span>
                <p className="text-text-label font-bold mt-3 leading-snug">
                  Si existe una cuenta con ese email, te enviamos un link para restablecer tu contraseña.
                </p>
                <p className="text-text-muted text-sm font-medium mt-2">
                  El link expira en 1 hora. Revisá también la carpeta de spam.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-6 py-3 hover:bg-[#C83890] transition-colors"
              >
                Volver a iniciar sesión
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <motion.div variants={item} className="mb-6">
                <Field
                  label="Email"
                  type="email"
                  placeholder="kine@clinica.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  autoComplete="email"
                />
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
                  Enviar link
                </SubmitButton>
              </motion.div>

              <motion.p variants={item} className="text-center mt-6 text-text-label text-sm">
                ¿Te acordás tu contraseña?{' '}
                <Link to="/login" className="text-accent font-bold hover:underline">Iniciar sesión</Link>
              </motion.p>
            </form>
          )}
        </AuthCard>
      </div>
    </div>
  )
}
