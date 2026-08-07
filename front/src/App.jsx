import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import SeleccionJuego from './pages/SeleccionJuego'
import GamePage from './juegos/surf/GamePage'
import FlamencoPage from './juegos/flamenco/FlamencoPage'
import EstrellasPage from './juegos/estrellas/EstrellasPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/juegos" element={<SeleccionJuego />} />
        <Route path="/juego" element={<GamePage />} />
        <Route path="/juego/flamenco" element={<FlamencoPage />} />
        <Route path="/juego/estrellas" element={<EstrellasPage />} />
      </Routes>
    </BrowserRouter>
  )
}
