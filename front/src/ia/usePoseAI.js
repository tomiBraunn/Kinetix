import { useEffect, useRef } from 'react'
import { kinetixAI } from './KinetixAI'

/**
 * Hook que arranca MediaPipe Pose para el juego indicado.
 * Abre su propia cámara para MediaPipe (el video de Phaser
 * sigue siendo el de fondo; el navegador reutiliza el mismo
 * dispositivo sin pedir permiso dos veces).
 *
 * @param {'surf'|'flamenco'|'estrellas'} gameMode
 * @param {boolean} enabled  false para desactivar (ej. cuando el juego está pausado)
 */
export function usePoseAI(gameMode, enabled = true) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const video = document.createElement('video')
    video.autoplay = true
    video.playsInline = true
    video.muted = true
    videoRef.current = video

    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        video.srcObject = stream
        video.onloadeddata = () => {
          if (!cancelled) kinetixAI.start(gameMode, video)
        }
      })
      .catch(err => console.warn('[KinetixAI] Cámara no disponible:', err))

    return () => {
      cancelled = true
      kinetixAI.stop()
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [gameMode, enabled])
}
