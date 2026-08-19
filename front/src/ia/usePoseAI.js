import { useEffect, useRef } from 'react'
import { kinetixAI } from './KinetixAI'
import { getStream } from './CameraStream'

/**
 * Arranca MediaPipe Pose sobre el stream de cámara compartido (abierto por Phaser).
 * @param {'surf'|'flamenco'|'estrellas'} gameMode
 * @param {boolean} enabled  false para pausar la detección
 * @param {number}  headerH  altura del header en px (solo surf usa 58, el resto 0)
 */
export function usePoseAI(gameMode, enabled = true, headerH = 0) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      kinetixAI.stop()
      return
    }

    const canvasW = window.innerWidth
    const canvasH = window.innerHeight - headerH

    // Reutiliza el stream de cámara que ya abrió Phaser
    // Si Phaser todavía no lo abrió, espera 200ms y reintenta
    function tryStart(retries = 10) {
      const stream = getStream()
      if (!stream) {
        if (retries <= 0) {
          console.warn('[usePoseAI] Stream no disponible')
          return
        }
        setTimeout(() => tryStart(retries - 1), 200)
        return
      }

      // Crea un video element oculto que consume el mismo stream
      const video = document.createElement('video')
      video.autoplay = true
      video.playsInline = true
      video.muted = true
      video.srcObject = stream
      videoRef.current = video

      video.addEventListener('loadeddata', () => {
        kinetixAI.start(gameMode, video, canvasW, canvasH)
      }, { once: true })

      // Por si loadeddata ya pasó
      if (video.readyState >= 2) {
        kinetixAI.start(gameMode, video, canvasW, canvasH)
      }
    }

    tryStart()

    return () => {
      kinetixAI.stop()
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current = null
      }
    }
  }, [gameMode, enabled, headerH])
}
