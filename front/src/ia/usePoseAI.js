import { useEffect, useRef } from 'react'
import { kinetixAI } from './KinetixAI'
import { getStream } from './CameraStream'
import { useReintentos, imagenFalla, imagenOk, modeloFalla, modeloOk } from './estadoCamara'

const IMAGEN_MS = 8000 // si en este tiempo el video no tiene un cuadro, se avisa que la cámara no manda imagen

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
 *   Si la cámara o el detector fallan no hay nada que dibujar: eso se cuenta en estadoCamara.js y lo muestra AvisoCamara.
 */
export function usePoseAI(gameMode, enabled = true, headerH = 0) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const siluetaRef = useRef(null)
  const pausadaRef = useRef(false) // venía de una pausa: al reanudar se conserva lo acumulado
  const corrioRef = useRef(false)  // ya detectó alguna vez: el primer arranque no es una reanudación
  const reintentos = useReintentos() // "Reintentar" del aviso de cámara: se vuelve a arrancar todo

  useEffect(() => {
    if (!enabled) {
      kinetixAI.stop()
      // Solo es "pausa" si ya había arrancado: antes de la primera vez (instrucciones) hay que empezar de
      // cero, porque el singleton trae la vista y las métricas del juego anterior.
      pausadaRef.current = corrioRef.current
      // Mientras no detecta (instrucciones, pausa) se adelanta la carga del modelo, que tarda. Si falla se avisa
      // ya (sin conexión, aparato sin soporte) y no recién cuando el paciente está parado frente a la cámara.
      kinetixAI.init().then(modeloOk, modeloFalla)
      return
    }

    const reanudando = pausadaRef.current
    pausadaRef.current = false
    corrioRef.current = true
    const canvasW = window.innerWidth
    const canvasH = window.innerHeight - headerH

    // Reutiliza el stream de cámara que ya abrió la página. Si todavía no está, reintenta cada
    // 200 ms mientras el efecto siga vivo: el permiso de cámara puede tardar bastante más que
    // unos segundos y, si se rendía antes, la detección no arrancaba nunca.
    let cancelado = false
    let espera = null
    let sinImagen = null
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
      video.setAttribute('playsinline', '')
      video.setAttribute('muted', '')
      // Puesto en la página (casi invisible) y con play() explícito: en el WebView de iOS un <video> suelto que
      // consume un MediaStream puede quedarse sin decodificar cuadros, y entonces la detección nunca arranca.
      video.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;'
      video.dataset.kinetix = 'deteccion'
      document.body.appendChild(video)
      video.srcObject = stream
      video.play().catch(() => { /* el autoplay lo intenta igual */ })
      videoRef.current = video

      const arrancar = () => {
        clearTimeout(sinImagen)
        imagenOk()
        if (!cancelado) kinetixAI.start(gameMode, video, canvasW, canvasH, canvasRef.current, siluetaRef.current, { reanudando }).then(modeloOk, modeloFalla)
      }
      // Si el video no llega a tener ni un cuadro, la cámara "está abierta" pero ciega: se lo avisa al usuario
      sinImagen = setTimeout(() => { if (!cancelado && video.readyState < 2) imagenFalla() }, IMAGEN_MS)
      video.addEventListener('loadeddata', arrancar, { once: true })

      // Por si loadeddata ya pasó
      if (video.readyState >= 2) arrancar()
    }

    tryStart()

    return () => {
      cancelado = true
      clearTimeout(espera)
      clearTimeout(sinImagen)
      kinetixAI.stop()
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.remove()
        videoRef.current = null
      }
    }
  }, [gameMode, enabled, headerH, reintentos])

  return { canvasRef, siluetaRef }
}
