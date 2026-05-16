import apiFetch from './apiFetch';

// Auth service for backend endpoints:
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me (optional)
// POST /api/auth/logout (optional)
// POST /api/auth/refresh (optional)

export async function register(payload) {
  const resp = await apiFetch('/api/auth/register', { method: 'POST', body: payload });
  return resp.data;
}

export async function login(payload) {
  const resp = await apiFetch('/api/auth/login', { method: 'POST', body: payload });
  const data = resp.data;
  // Store token automatically if backend returns one at data.token
  try {
    if (data && data.token && typeof window !== 'undefined') localStorage.setItem('token', data.token);
  } catch (e) { }
  return data;
}

export async function me() {
  const resp = await apiFetch('/api/auth/me', { method: 'GET' });
  return resp.data;
}

export async function logout() {
  try { await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => null); } catch (e) { }
  clearToken();
  return true;
}

export async function refresh() {
  const resp = await apiFetch('/api/auth/refresh', { method: 'POST' });
  const data = resp.data;
  if (data && data.token) setToken(data.token);
  return data;
}

export function setToken(token) {
  try { if (typeof window !== 'undefined') localStorage.setItem('token', token); } catch (e) { }
}

export function clearToken() {
  try { if (typeof window !== 'undefined') localStorage.removeItem('token'); } catch (e) { }
}

export default { register, login, me, logout, refresh, setToken, clearToken };
