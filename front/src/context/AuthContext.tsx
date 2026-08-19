import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, ApiError, SESSION_EXPIRED_EVENT } from '../lib/api'
import { clearSession, getStoredUser, getToken, saveSession, type StoredKinesiologo } from '../lib/auth'

type AuthResponse = {
  token: string
  kinesiologo: StoredKinesiologo
}

type AuthContextValue = {
  user: StoredKinesiologo | null
  token: string | null
  status: 'loading' | 'authed' | 'guest'
  error: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<StoredKinesiologo>
  register: (data: { nombre: string; apellido: string; email: string; password: string }) => Promise<boolean>
  loginWithGoogle: (idToken: string) => Promise<StoredKinesiologo>
  applySession: (token: string, user: StoredKinesiologo) => void
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function describeError(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'Algo salió mal. Intentá de nuevo.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initial render: read from localStorage synchronously so the first paint
  // already knows if we're authed (no flash of the login screen).
  const [user, setUser] = useState<StoredKinesiologo | null>(() => getStoredUser())
  const [token, setToken] = useState<string | null>(() => getToken())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const status = useMemo<'loading' | 'authed' | 'guest'>(() => {
    if (user && token) return 'authed'
    return 'guest'
  }, [user, token])

  // Keep multiple tabs in sync: if one tab logs out, all of them do.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'kinetix_token' || e.key === 'kinetix_user') {
        setToken(getToken())
        setUser(getStoredUser())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const finishAuth = useCallback((res: AuthResponse) => {
    saveSession(res.token, res.kinesiologo)
    setToken(res.token)
    setUser(res.kinesiologo)
    setError(null)
    return res.kinesiologo
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.post<AuthResponse>('/auth/login', { email, password })
        return finishAuth(res)
      } catch (err) {
        setError(describeError(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [finishAuth],
  )

  const register = useCallback(
    async (data: { nombre: string; apellido: string; email: string; password: string }): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.post<AuthResponse & { message?: string }>('/auth/register', data)
        if (res.token) {
          finishAuth(res)
          return true // cuenta creada y ya verificada (dev sin mailer)
        }
        return false // requiere verificación por email
      } catch (err) {
        setError(describeError(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [finishAuth],
  )

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.post<AuthResponse>('/auth/google/callback', { id_token: idToken })
        return finishAuth(res)
      } catch (err) {
        setError(describeError(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [finishAuth],
  )

  // Used by the Google redirect flow: AuthCallback receives the token + user
  // in the URL and hands them here so the context state updates (not just
  // localStorage). Without this, AuthRoute would still see status==='guest'
  // right after the redirect and bounce back to /login.
  const applySession = useCallback((nextToken: string, nextUser: StoredKinesiologo) => {
    saveSession(nextToken, nextUser)
    setToken(nextToken)
    setUser(nextUser)
    setError(null)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  // api.ts dispatches this when a request comes back 403 (token inválido o
  // expirado) — clearSession() ya corrió ahí, acá solo sincronizamos el
  // estado de React para que AuthRoute mande a /login.
  useEffect(() => {
    function onSessionExpired() {
      setToken(null)
      setUser(null)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value: AuthContextValue = {
    user,
    token,
    status,
    error,
    loading,
    login,
    register,
    loginWithGoogle,
    applySession,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
