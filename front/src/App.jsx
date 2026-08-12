import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AuthRoute from './components/auth/AuthRoute'
import PublicRoute from './components/auth/PublicRoute'
import AppLayout from './components/layout/AppLayout'

// Auth
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import AuthCallback from './pages/AuthCallback.tsx'

// Dashboard (dentro del AppLayout)
import Home from './pages/Home.tsx'
import Pacientes from './pages/Pacientes.tsx'
import CrearPaciente from './pages/CrearPaciente.tsx'
import DetallePaciente from './pages/DetallePaciente.tsx'
import SeleccionJuego from './pages/SeleccionJuego.tsx'
import Analisis from './pages/Analisis.tsx'

// Juegos full-screen (sin AppLayout)
import GamePage from './juegos/surf/GamePage'
import FlamencoPage from './juegos/flamenco/FlamencoPage'
import EstrellasPage from './juegos/estrellas/EstrellasPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Dashboard con sidebar */}
          <Route element={<AuthRoute><AppLayout /></AuthRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/pacientes/nuevo" element={<CrearPaciente />} />
            <Route path="/pacientes/:id" element={<DetallePaciente />} />
            <Route path="/juego" element={<SeleccionJuego />} />
            <Route path="/analisis" element={<Analisis />} />
          </Route>

          {/* Juegos full-screen (protegidos, sin sidebar) */}
          <Route path="/juego/surf" element={<AuthRoute><GamePage /></AuthRoute>} />
          <Route path="/juego/flamenco" element={<AuthRoute><FlamencoPage /></AuthRoute>} />
          <Route path="/juego/estrellas" element={<AuthRoute><EstrellasPage /></AuthRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<PublicRoute><Login /></PublicRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
