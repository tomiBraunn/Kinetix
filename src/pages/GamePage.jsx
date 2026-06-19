import { useNavigate } from 'react-router-dom'
import PhaserGame from '../game/PhaserGame'

export default function GamePage() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          background: 'rgba(0,0,0,0.5)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 8,
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        ← Volver
      </button>
      <PhaserGame />
    </div>
  )
}
