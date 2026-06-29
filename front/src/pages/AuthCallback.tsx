import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type StoredKinesiologo = {
  id: string
  nombre: string
  apellido: string
  email: string
  avatar_url?: string | null
}

// Receives the JWT + user payload that the backend redirects with after a
// successful Google sign-in (redirect flow). Stores the session and bounces
// to /home, cleaning the URL so the token never lingers in the address bar.
export default function AuthCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { applySession } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errParam = params.get('error')
    if (errParam) {
      setError(errParam)
      navigate('/login', { replace: true })
      return
    }

    const token = params.get('token')
    const userRaw = params.get('user')

    if (!token || !userRaw) {
      setError('Missing token or user in callback')
      navigate('/login', { replace: true })
      return
    }

    try {
      const user = JSON.parse(userRaw) as StoredKinesiologo
      // Update the auth context (not just localStorage) so AuthRoute sees
      // status==='authed' and lets us into /home instead of bouncing to /login.
      applySession(token, user)
      navigate('/home', { replace: true })
    } catch {
      setError('Malformed user payload')
      navigate('/login', { replace: true })
    }
  }, [params, navigate, applySession])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        {error ? (
          <p className="text-rose-500 text-sm font-semibold">Error: {error}</p>
        ) : (
          <p className="text-[#604868] text-sm">Iniciando sesión con Google…</p>
        )}
      </div>
    </div>
  )
}
