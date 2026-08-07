import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuthCard, { item } from '../components/auth/AuthCard'
import Field from '../components/auth/Field'
import PasswordField from '../components/auth/PasswordField'
import { SubmitButton, GoogleButton } from '../components/auth/Buttons'
import OrDivider from '../components/auth/OrDivider'
import { RegisterIcon } from '../components/auth/icons'
import GradientBackground from '../components/GradientBackground'
import { useAuth } from '../context/AuthContext'

type Form = { nombre: string; apellido: string; email: string; password: string; confirm: string }
type Errors = Partial<Record<keyof Form, string>>

export default function Register() {
  const navigate = useNavigate()
  const { register, loading, error, clearError } = useAuth()

  const [form, setForm] = useState<Form>({ nombre: '', apellido: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Errors>({})

  const set = (k: keyof Form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    clearError()
  }

  function validate(): Errors {
    const next: Errors = {}
    if (!form.nombre.trim()) next.nombre = 'Requerido.'
    if (!form.apellido.trim()) next.apellido = 'Requerido.'
    if (!form.email.trim()) next.email = 'Ingresá tu email.'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Email inválido.'
    if (form.password.length < 8) next.password = 'Mínimo 8 caracteres.'
    if (form.confirm !== form.password) next.confirm = 'Las contraseñas no coinciden.'
    return next
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return
    try {
      await register({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        password: form.password
      })
      navigate('/home', { replace: true })
    } catch {
      // Error surfaced via useAuth().error
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <GradientBackground />
      <div className="relative z-10 w-full max-w-[544px]">
        <AuthCard icon={<RegisterIcon />} title="Registrarse">
      <form onSubmit={handleSubmit} noValidate>
        <motion.div variants={item} className="mb-6 grid grid-cols-2 gap-5">
          <Field label="Nombre" placeholder="Federico" value={form.nombre} onChange={set('nombre')} error={errors.nombre} />
          <Field label="Apellido" placeholder="Holis" value={form.apellido} onChange={set('apellido')} error={errors.apellido} />
        </motion.div>

        <motion.div variants={item} className="mb-6">
          <Field label="Email" type="email" placeholder="nombre@clinica.com" value={form.email} onChange={set('email')} error={errors.email} />
        </motion.div>

        <motion.div variants={item} className="mb-6">
          <PasswordField label="Contraseña" placeholder="Min 8 caracteres" value={form.password} onChange={set('password')} error={errors.password} />
        </motion.div>

        <motion.div variants={item} className="mb-8">
          <PasswordField label="Confirmar contraseña" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
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
            Registrarse
          </SubmitButton>
        </motion.div>
      </form>

      <motion.div variants={item} className="my-8">
        <OrDivider />
      </motion.div>

      <motion.div variants={item}>
        <GoogleButton />
      </motion.div>

      <motion.p variants={item} className="text-center mt-6 text-text-label text-sm">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="text-accent font-bold hover:underline">Iniciar sesión</Link>
      </motion.p>
    </AuthCard>
      </div>
    </div>
  )
}
