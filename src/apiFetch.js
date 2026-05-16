// apiFetch.js
// Simple fetch-based API client that expects backend wrapper: { success, data, meta, error }
// - Adds Authorization header from localStorage when present
// - Serializes JSON bodies automatically unless using FormData

const API_BASE = (typeof process !== 'undefined' && (process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL)) || 'http://localhost:3000';

export default async function apiFetch(path, opts = {}) {
  const base = API_BASE;
  const headers = { Accept: 'application/json', ...(opts.headers || {}) };

  // If body is a plain object and not FormData, stringify it and set content-type
  if (!headers['Content-Type'] && opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }

  try {
    let token = null;
    if (typeof window !== 'undefined') {
      try { token = localStorage.getItem('token'); } catch (e) { token = null; }
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${base}${path}`, { credentials: 'same-origin', ...opts, headers });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }

    if (!res.ok) {
      if (json && json.error) throw json.error;
      throw { code: 'NETWORK_ERROR', message: res.statusText || 'Network error' };
    }

    // If backend uses the wrapper (success/data/meta/error), respect it
    if (json && typeof json.success !== 'undefined') {
      if (!json.success) throw json.error || { code: 'API_ERROR', message: 'API returned success:false' };
      return json; // { success, data, meta, error }
    }

    // Fallback: normalize to wrapper
    return { success: true, data: json, meta: null, error: null };
  } catch (err) {
    if (err && err.code) throw err;
    throw { code: 'UNKNOWN_ERROR', message: err.message || String(err) };
  }
}
