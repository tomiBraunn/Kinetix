import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Phaser from 'phaser'
import EscenaPrincipal from './EscenaPrincipal'
import { openCamera, closeCamera } from '../../ia/CameraStream'

// Solo el canvas de Phaser (los peces, transparente). El fondo de mar y la tabla
// los pone GamePage, y el paciente aparece recortado en su propio canvas (silueta).
// No se muestra el video de la cámara: la silueta se ve sobre el mar.
const PhaserGame = forwardRef(function PhaserGame({ headerHeight = 0 }, ref) {
  const contenedorRef = useRef(null)
  const gameRef       = useRef(null)

  useImperativeHandle(ref, () => ({
    getGameCanvas: () => gameRef.current?.canvas ?? null,
    // El canvas de Phaser tiene que seguir el tamaño del área si la ventana cambia
    redimensionar: (w, h) => gameRef.current?.scale.resize(w, h),
  }), [])

  useEffect(() => {
    if (gameRef.current) return

    // Abre la cámara; usePoseAI y la grabación toman el stream compartido
    openCamera().catch(err => console.warn('Cámara no disponible:', err))

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight - headerHeight,
      parent: contenedorRef.current,
      transparent: true,
      scene: [EscenaPrincipal],
    })

    return () => {
      closeCamera()
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div ref={contenedorRef} className="absolute inset-0 z-[1]" />
})

export default PhaserGame
