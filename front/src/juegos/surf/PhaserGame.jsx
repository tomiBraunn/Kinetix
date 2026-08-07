import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import EscenaPrincipal from './EscenaPrincipal'

export default function PhaserGame({ headerHeight = 0 }) {
  const contenedorRef = useRef(null)
  const videoRef      = useRef(null)
  const gameRef       = useRef(null)
  const streamRef     = useRef(null)

  useEffect(() => {
    if (gameRef.current) return

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(err => console.warn('Cámara no disponible:', err))

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight - headerHeight,
      parent: contenedorRef.current,
      transparent: true,
      scene: [EscenaPrincipal],
    })

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#1a6eaa' }}>
      <video
        ref={videoRef}
        autoPlay playsInline muted
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          zIndex: 0,
        }}
      />
      <div
        ref={contenedorRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
      />
    </div>
  )
}
