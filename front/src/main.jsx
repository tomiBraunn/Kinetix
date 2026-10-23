import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

// Vite injects import.meta.env.VITE_GOOGLE_CLIENT_ID at build time. If the
// placeholder is still in .env, the Google SDK will fail silently in the
// popup — surface it loudly in the console instead.
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
if (!googleClientId || googleClientId.startsWith('YOUR_')) {
  console.warn('[Kinetix] VITE_GOOGLE_CLIENT_ID no está configurado. El botón de Google no va a funcionar hasta que lo pongas en /.env')
}

// Service worker para que se pueda instalar como app (ver public/sw.js). Solo en la versión publicada.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider
      clientId={googleClientId || ''}
      onScriptLoadError={() => console.error('Failed to load Google Identity Services')}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
