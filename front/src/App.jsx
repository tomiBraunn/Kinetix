import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import Home from './pages/Home.tsx'
import AuthCallback from './pages/AuthCallback.tsx'
import Pacientes from './pages/Pacientes.tsx'
import CrearPaciente from './pages/CrearPaciente.tsx'
import DetallePaciente from './pages/DetallePaciente.tsx'
import AuthRoute from './components/auth/AuthRoute'
import PublicRoute from './components/auth/PublicRoute'
import AppLayout from './components/layout/AppLayout'
import SeleccionJuego from './pages/SeleccionJuego.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route
          element={
            <AuthRoute>
              <AppLayout />
            </AuthRoute>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/nuevo" element={<CrearPaciente />} />
          <Route path="/pacientes/:id" element={<DetallePaciente />} />
          <Route path="/juego" element={<SeleccionJuego />} />
        </Route>

        <Route
          path="*"
          element={<PublicRoute><Login /></PublicRoute>}
        />
      </Routes>
    </BrowserRouter>
  )
}