import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Landing from './pages/Landing'
import SeleccionJuego from './pages/SeleccionJuego'
import GamePage from './juegos/surf/GamePage'
import FlamencoPage from './juegos/flamenco/FlamencoPage'
import EstrellasPage from './juegos/estrellas/EstrellasPage'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import Home from './pages/Home.tsx'
import AuthCallback from './pages/AuthCallback.tsx'
import AuthRoute from './components/auth/AuthRoute'
import PublicRoute from './components/auth/PublicRoute'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing pública */}
          <Route path="/" element={<Landing />} />

          {/* Auth */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/home" element={<AuthRoute><Home /></AuthRoute>} />

          {/* Juegos */}
          <Route path="/juegos" element={<SeleccionJuego />} />
          <Route path="/juego" element={<GamePage />} />
          <Route path="/juego/flamenco" element={<FlamencoPage />} />
          <Route path="/juego/estrellas" element={<EstrellasPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
