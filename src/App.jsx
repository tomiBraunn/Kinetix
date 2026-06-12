import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import GamePage from './pages/GamePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/juego" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  )
}
