import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthRoute from './components/auth/AuthRoute'
import PublicRoute from './components/auth/PublicRoute'
import AppLayout from './components/layout/AppLayout'

// Público
import Landing from './pages/Landing.tsx'
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
import Analisis from './pages/Analisis.tsx'
import ResultadoSesion from './pages/ResultadoSesion.tsx'

// Juegos full-screen (sin AppLayout)
import SeleccionJuego from './pages/SeleccionJuego.jsx'
import GamePage from './juegos/surf/GamePage'
import FlamencoPage from './juegos/flamenco/FlamencoPage'
import EstrellasPage from './juegos/estrellas/EstrellasPage'

// Todos los dominios de Vercel (kinetix-webapp, kinetix-ai, etc.) sirven el
// mismo build — la landing vive solo en kinetix-ai.vercel.app, el resto de
// la app (login/dashboard) en los demás dominios.
const LANDING_HOST = 'kinetix-ai.vercel.app'
const isLandingHost = typeof window !== 'undefined' && window.location.hostname === LANDING_HOST

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/"
          element={isLandingHost ? <Landing /> : <Navigate to="/login" replace />}
        />
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
          <Route path="/games" element={<Games />} />
          <Route path="/analisis" element={<Analisis />} />
          <Route path="/sesiones/:sesionId" element={<ResultadoSesion />} />
        </Route>

        {/* Selección de juego + juegos full-screen (públicos para pruebas de IA sin backend) */}
        <Route path="/juego" element={<SeleccionJuego />} />
        <Route path="/juego/surf" element={<GamePage />} />
        <Route path="/juego/flamenco" element={<FlamencoPage />} />
        <Route path="/juego/estrellas" element={<EstrellasPage />} />

        {/* Catch-all: en kinetix-ai (solo landing) todo lo demás vuelve a "/" */}
        <Route
          path="*"
          element={isLandingHost ? <Navigate to="/" replace /> : <PublicRoute><Login /></PublicRoute>}
        />
      </Routes>
    </BrowserRouter>
  )
}
