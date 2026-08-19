import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuthCard, { item } from '../components/auth/AuthCard'
import PasswordField from '../components/auth/PasswordField'
import { SubmitButton } from '../components/auth/Buttons'
import { KeyIcon, CheckIcon } from '../components/auth/icons'
import GradientBackground from '../components/GradientBackground'
import { api } from '../lib/api'

// Página a la que llega el kinesiólogo desde el mail de reset
// (/restablecer-password?token_hash=...&type=recovery&email=...), según
// back/email-templates/reset-password.html.
export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token_hash')
  const email = params.get('email')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (confirm !== password) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setError(null)
    setLoading(true)
    api
      .post<{ message: string }>('/auth/reset-password', { email, token, password })
      .then(() => setDone(true))
      .catch((err) => setError(err instanceof Error ? err.message : 'Algo salió mal. Intentá de nuevo.'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <GradientBackground />
      <div className="relative z-10 w-full max-w-[544px]">
        <AuthCard icon={done ? <CheckIcon /> : <KeyIcon />} title={done ? 'Contraseña actualizada' : 'Nueva contraseña'}>
          {(!token || !email) && !done ? (
            <motion.div variants={item} initial="hidden" animate="show">
              <div className="mb-6 rounded-2xl bg-rose-50 p-5 text-center">
                <span className="material-symbols-rounded text-[44px] text-rose-400">error</span>
                <p className="text-text-label font-bold mt-3 leading-snug">
                  Link inválido: falta el token de restablecimiento.
                </p>
              </div>
              <Link
                to="/olvidaste-contraseña"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-6 py-3 hover:bg-[#C83890] transition-colors"
              >
                Pedir un link nuevo
              </Link>
            </motion.div>
          ) : done ? (
            <motion.div variants={item} initial="hidden" animate="show">
              <div className="mb-6 rounded-2xl bg-emerald-50 p-5 text-center">
                <span className="material-symbols-rounded text-[44px] text-emerald-500">task_alt</span>
                <p className="text-text-label font-bold mt-3 leading-snug">
                  Tu contraseña se actualizó correctamente. Ya podés iniciar sesión.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-6 py-3 hover:bg-[#C83890] transition-colors"
              >
                Ir a iniciar sesión
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <motion.div variants={item} className="mb-6">
                <PasswordField
                  label="Nueva contraseña"
                  placeholder="Min 8 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  autoComplete="new-password"
                />
              </motion.div>

              <motion.div variants={item} className="mb-8">
                <PasswordField
                  label="Confirmar contraseña"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value)
                    setError(null)
                  }}
                  autoComplete="new-password"
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
                  Guardar contraseña
                </SubmitButton>
              </motion.div>
            </form>
          )}
        </AuthCard>
      </div>
    </div>
  )
}
