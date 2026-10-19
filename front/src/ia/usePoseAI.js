import { useEffect, useRef } from 'react'
import { kinetixAI } from './KinetixAI'
import { getStream } from './CameraStream'

/**
 * Arranca MediaPipe Pose sobre el stream de cámara compartido (abierto por Phaser).
 * @param {'surf'|'flamenco'|'estrellas'} gameMode
 * @param {boolean} enabled  false para pausar la detección
 * @param {number}  headerH  altura del header en px (solo surf usa 58, el resto 0)
 * @returns {{ canvasRef: React.RefObject<HTMLCanvasElement>, siluetaRef: React.RefObject<HTMLCanvasElement> }}
 *   canvasRef: <canvas> chico opcional con la cámara (en espejo) + esqueleto, en vivo.
 *   siluetaRef: <canvas> de pantalla completa con el cuerpo del paciente
 *   recortado por segmentación (fondo transparente) — para superponer
 *   sobre el juego.
 */
export function usePoseAI(gameMode, enabled = true, headerH = 0) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const siluetaRef = useRef(null)
  const pausadaRef = useRef(false) // venía de una pausa: al reanudar se conserva lo acumulado

  useEffect(() => {
    if (!enabled) {
      kinetixAI.stop()
      pausadaRef.current = true
      return
    }

    const reanudando = pausadaRef.current
    pausadaRef.current = false
    const canvasW = window.innerWidth
    const canvasH = window.innerHeight - headerH

    // Reutiliza el stream de cámara que ya abrió la página. Si todavía no está, reintenta cada
    // 200 ms mientras el efecto siga vivo: el permiso de cámara puede tardar bastante más que
    // unos segundos y, si se rendía antes, la detección no arrancaba nunca.
    let cancelado = false
    let espera = null
    function tryStart(intentos = 0) {
      if (cancelado) return
      const stream = getStream()
      if (!stream) {
        if (intentos === 10) console.warn('[usePoseAI] Stream no disponible todavía, sigo esperando')
        espera = setTimeout(() => tryStart(intentos + 1), 200)
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
        if (!cancelado) kinetixAI.start(gameMode, video, canvasW, canvasH, canvasRef.current, siluetaRef.current, { reanudando })
      }, { once: true })

      // Por si loadeddata ya pasó
      if (video.readyState >= 2) {
        kinetixAI.start(gameMode, video, canvasW, canvasH, canvasRef.current, siluetaRef.current, { reanudando })
      }
    }

    tryStart()

    return () => {
      cancelado = true
      clearTimeout(espera)
      kinetixAI.stop()
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current = null
      }
    }
  }, [gameMode, enabled, headerH])

  return { canvasRef, siluetaRef }
}
