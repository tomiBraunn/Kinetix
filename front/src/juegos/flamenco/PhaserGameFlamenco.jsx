import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Phaser from 'phaser'
import EscenaFlamenco from './EscenaFlamenco'
import { openCamera, closeCamera } from '../../ia/CameraStream'

const PhaserGameFlamenco = forwardRef(function PhaserGameFlamenco({ headerHeight = 0 }, ref) {
  const contenedorRef = useRef(null)
  const videoRef      = useRef(null)
  const gameRef       = useRef(null)

  useImperativeHandle(ref, () => ({
    getGameCanvas: () => gameRef.current?.canvas ?? null,
  }), [])

  useEffect(() => {
    if (gameRef.current) return

    openCamera()
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream })
      .catch(err => console.warn('Cámara no disponible:', err))

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight - headerHeight,
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
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#1a1a2e' }}>
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
})

export default PhaserGameFlamenco
