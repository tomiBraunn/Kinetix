import { useEffect } from 'react'
import { esAppMovil } from './lib/appMovil'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AuthRoute from './components/auth/AuthRoute'
import PublicRoute from './components/auth/PublicRoute'
import AppLayout from './components/layout/AppLayout'

// Público
import Landing from './pages/Landing.tsx'
import LandingNueva from './pages/landing/LandingNueva.tsx'
import Cartel from './pages/Cartel.tsx'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import VerifyEmail from './pages/VerifyEmail.tsx'
import ForgotPassword from './pages/ForgotPassword.tsx'
import ResetPassword from './pages/ResetPassword.tsx'
import AuthCallback from './pages/AuthCallback.tsx'

// Dashboard (dentro del AppLayout)
import Home from './pages/Home.tsx'
import Pacientes from './pages/Pacientes.tsx'
import CrearPaciente from './pages/CrearPaciente.tsx'
import DetallePaciente from './pages/DetallePaciente.tsx'
import Games from './pages/SeleccionJuego.tsx'
import JuegosPlaceholder from './pages/JuegosPlaceholder.tsx'
import Analisis from './pages/Analisis.tsx'
import ResultadoSesion from './pages/ResultadoSesion.tsx'

// Juegos full-screen (sin AppLayout)
import SeleccionJuego from './pages/SeleccionJuego.jsx'
import GamePage from './juegos/surf/GamePage'
import FlamencoPage from './juegos/flamenco/FlamencoPage'
import EstrellasPage from './juegos/estrellas/EstrellasPage'
import DemoPage from './pages/demo/DemoPage'
import MarcoMovil from './pages/demo/MarcoMovil'
import DemoAdmin from './pages/demo/DemoAdmin'

// Todos los dominios de Vercel (kinetix-webapp, kinetix-ai, etc.) sirven el
// mismo build — la landing vive solo en estos dominios (kinetix-ai.vercel.app y
// el dominio propio kinetixproject.com); en los demás va directo el login/dashboard.
const LANDING_HOSTS = ['kinetix-ai.vercel.app', 'kinetixproject.com', 'www.kinetixproject.com']
const isLandingHost = typeof window !== 'undefined' && LANDING_HOSTS.includes(window.location.hostname)

// gtag('config', ...) en index.html solo manda el page_view de la carga inicial.
// En una SPA hay que mandar el resto a mano en cada cambio de ruta.
function AnalyticsPageView() {
  const location = useLocation()
  useEffect(() => {
    window.gtag?.('event', 'page_view', {
      page_path: window.location.pathname + window.location.search,
      page_location: window.location.href,
    })
  }, [location])
  return null
}

// Sin paciente la sesión no se puede guardar: vuelve al selector de juego/paciente.
function ConPaciente({ children }) {
  const { search } = useLocation()
  if (new URLSearchParams(search).get('pacienteId')) return children
  return <Navigate to="/juego" replace />
}

// Admins (es_admin en el usuario guardado al iniciar sesión) también pueden jugar desde la compu
function esAdminGuardado() {
  try {
    return JSON.parse(localStorage.getItem('kinetix_user') || 'null')?.es_admin === true
  } catch {
    return false
  }
}

function SoloApp({ children }) {
  if (esAppMovil || esAdminGuardado()) return children
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a237e' }}>Los juegos solo están disponibles en la app de Kinetix</h1>
        <p style={{ color: '#64748b', marginTop: 8 }}>Abrí la app en el dispositivo del paciente para iniciar una sesión.</p>
      </div>
    </div>
  )
}

// La webapp (login, panel, juegos) vive bajo /webapp; la landing y la demo, en la raíz.
// Un solo build sirve las dos: se elige el router según la ruta, así los links internos
// de la webapp (navigate('/login'), <Link to="/home">...) no se tocan: el basename les agrega el prefijo.
const PREFIJO = '/webapp'
const esWebapp = (ruta) => ruta === PREFIJO || ruta.startsWith(PREFIJO + '/')

// Navegación completa (no del router) hacia otra "app": conserva ruta, parámetros y hash.
function Redirigir({ a }) {
  useEffect(() => { window.location.replace(a()) }, [a])
  return null
}
// Rutas viejas (/login, /home, /auth/callback?token=...): van a /webapp con todo lo que traían,
// para no romper links de mails, el login con Google ni la app instalada.
const aWebapp = () => PREFIJO + window.location.pathname + window.location.search + window.location.hash
const aLanding = () => '/'

function Webapp() {
  return (
    <BrowserRouter basename={PREFIJO}>
      <AnalyticsPageView />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/verificar-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
        <Route path="/olvidaste-contraseña" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/restablecer-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Dashboard con sidebar */}
        <Route element={<AuthRoute><AppLayout /></AuthRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/nuevo" element={<CrearPaciente />} />
          <Route path="/pacientes/:id" element={<DetallePaciente />} />
          <Route path="/games" element={esAppMovil || esAdminGuardado() ? <Games /> : <JuegosPlaceholder />} />
          <Route path="/analisis" element={<Analisis />} />
          <Route path="/sesiones/:sesionId" element={<ResultadoSesion />} />
        </Route>

        {/* Selección de juego + juegos full-screen (públicos para pruebas de IA sin backend) */}
        <Route path="/juego" element={<SoloApp><SeleccionJuego /></SoloApp>} />
        <Route path="/juego/surf" element={<SoloApp><ConPaciente><GamePage /></ConPaciente></SoloApp>} />
        <Route path="/juego/flamenco" element={<SoloApp><ConPaciente><FlamencoPage /></ConPaciente></SoloApp>} />
        <Route path="/juego/estrellas" element={<SoloApp><ConPaciente><EstrellasPage /></ConPaciente></SoloApp>} />

        {/* En los dominios con landing, lo desconocido vuelve a "/"; en los demás, al login */}
        <Route
          path="*"
          element={isLandingHost ? <Redirigir a={aLanding} /> : <PublicRoute><Login /></PublicRoute>}
        />
      </Routes>
    </BrowserRouter>
  )
}

function Landingsite() {
  return (
    <BrowserRouter>
      <AnalyticsPageView />
      <Routes>
        <Route path="/" element={isLandingHost ? <LandingNueva /> : <Redirigir a={() => PREFIJO + '/login'} />} />
        {/* Landing anterior, en un slash propio */}
        <Route path="/landing-vieja" element={isLandingHost ? <Landing /> : <Redirigir a={() => PREFIJO + '/login'} />} />

        {/* Demo en vivo de la landing: los juegos reales, sin cámara ni IA */}
        <Route path="/demo" element={<MarcoMovil><DemoPage /></MarcoMovil>} />
        <Route path="/demo/surf" element={<MarcoMovil><GamePage demo /></MarcoMovil>} />
        <Route path="/demo/flamenco" element={<MarcoMovil><FlamencoPage demo /></MarcoMovil>} />
        {/* Demo para admins: juego grabado + paciente + análisis, todo en un celular */}
        <Route path="/demoadmin" element={<DemoAdmin />} />

        {/* Cartel de la feria de tecnología */}
        <Route path="/cartel" element={<Cartel />} />

        {/* Cualquier otra ruta es una URL vieja de la webapp */}
        <Route path="*" element={<Redirigir a={aWebapp} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return esWebapp(window.location.pathname) ? <Webapp /> : <Landingsite />
}
