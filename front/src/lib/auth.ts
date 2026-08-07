// localStorage-backed session. Stored as JSON so we can keep both the JWT
// and the kinesiologo profile together, and clear them in one call.

const TOKEN_KEY = 'kinetix_token'
const USER_KEY = 'kinetix_user'

export type StoredKinesiologo = {
  id: string
  nombre: string
  apellido: string
  email: string
  avatar_url?: string | null
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredUser(): StoredKinesiologo | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredKinesiologo
  } catch {
    return null
  }
}

export function saveSession(token: string, user: StoredKinesiologo): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
