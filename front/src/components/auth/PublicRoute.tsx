import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'

// Wraps public routes (login, register). If a session already exists,
// bounce to /home so users don't see the form again.
export default function PublicRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  if (status === 'authed') return <Navigate to="/home" replace />
  return <>{children}</>
}
