import { useNavigate } from 'react-router-dom'
import PhaserGameFlamenco from './PhaserGameFlamenco'

export default function FlamencoPage() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <button
        onClick={() => navigate('/juegos')}
        style={{
          position: 'absolute', top: 16, left: 16, zIndex: 10,
          background: 'rgba(0,0,0,0.5)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14,
        }}
      >
        ← Volver
      </button>
      <PhaserGameFlamenco />
    </div>
  )
}
