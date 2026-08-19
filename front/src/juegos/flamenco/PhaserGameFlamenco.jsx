import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import EscenaFlamenco from './EscenaFlamenco'
import { openCamera, closeCamera } from '../../ia/CameraStream'

export default function PhaserGameFlamenco() {
  const contenedorRef = useRef(null)
  const videoRef = useRef(null)
  const gameRef = useRef(null)

  useEffect(() => {
    if (gameRef.current) return

    openCamera()
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream })
      .catch(err => console.warn('Cámara no disponible:', err))

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: contenedorRef.current,
      transparent: true,
      scene: [EscenaFlamenco],
    })

    return () => {
      closeCamera()
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
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
