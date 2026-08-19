import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

// Juegos full-screen (sin AppLayout)
import SeleccionJuego from './pages/SeleccionJuego.jsx'
import GamePage from './juegos/surf/GamePage'
import FlamencoPage from './juegos/flamenco/FlamencoPage'
import EstrellasPage from './juegos/estrellas/EstrellasPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/verificar-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
        <Route path="/olvidaste-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
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
        </Route>

        {/* Selección de juego + juegos full-screen (públicos para pruebas de IA sin backend) */}
        <Route path="/juego" element={<SeleccionJuego />} />
        <Route path="/juego/surf" element={<GamePage />} />
        <Route path="/juego/flamenco" element={<FlamencoPage />} />
        <Route path="/juego/estrellas" element={<EstrellasPage />} />

        {/* Catch-all */}
        <Route path="*" element={<PublicRoute><Login /></PublicRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
