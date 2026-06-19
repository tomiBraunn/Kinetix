import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import EscenaPrincipal from './scenes/EscenaPrincipal'

export default function PhaserGame() {
  const contenedorRef = useRef(null)
  const gameRef = useRef(null)

  useEffect(() => {
    if (gameRef.current) return

    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: contenedorRef.current,
      backgroundColor: '#1a6b8a',
      scene: [EscenaPrincipal],
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div
      ref={contenedorRef}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
    />
  )
}
