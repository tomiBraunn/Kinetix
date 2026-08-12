import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuthCard, { item } from '../components/auth/AuthCard'
import { MailIcon, CheckIcon } from '../components/auth/icons'
import GradientBackground from '../components/GradientBackground'
import { api } from '../lib/api'

// Página a la que llega el kinesiólogo desde el mail de verificación
// (/verificar-email?token_hash=...&type=signup&email=...), según
// back/email-templates/confirm-signup.html.
export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token_hash')
  const email = params.get('email')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token || !email) {
      setStatus('error')
      setMessage('Link inválido: falta el token de verificación.')
      return
    }
    let active = true
    api
      .post<{ message: string }>('/auth/verificar-email', { email, token })
      .then((res) => {
        if (!active) return
        setStatus('success')
        setMessage(res.message)
      })
      .catch((err) => {
        if (!active) return
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'No se pudo verificar el email.')
      })
    return () => {
      active = false
    }
  }, [token])

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <GradientBackground />
      <div className="relative z-10 w-full max-w-[544px]">
        <AuthCard icon={<MailIcon />} title="Verificación de email">
          <motion.div variants={item} initial="hidden" animate="show">
            {status === 'loading' && (
              <p className="text-text-muted text-sm font-semibold text-center">
                Verificando tu cuenta…
              </p>
            )}
            {status === 'success' && (
              <>
                <div className="mb-6 rounded-2xl bg-emerald-50 p-5 text-center">
                  <span className="material-symbols-rounded text-[44px] text-emerald-500">
                    task_alt
                  </span>
                  <p className="text-text-label font-bold mt-3 leading-snug">{message}</p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-6 py-3 hover:bg-[#C83890] transition-colors"
                >
                  <CheckIcon />
                  Ir a iniciar sesión
                </Link>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="mb-6 rounded-2xl bg-rose-50 p-5 text-center">
                  <span className="material-symbols-rounded text-[44px] text-rose-400">
                    error
                  </span>
                  <p className="text-text-label font-bold mt-3 leading-snug">{message}</p>
                </div>
                <Link
                  to="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-6 py-3 hover:bg-[#C83890] transition-colors"
                >
                  Registrarme de nuevo
                </Link>
              </>
            )}
          </motion.div>
        </AuthCard>
      </div>
    </div>
  )
}
