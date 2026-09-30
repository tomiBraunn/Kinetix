import { useCallback, useRef } from 'react'
import { getStream } from './CameraStream'

// Safari/iOS (el motor detrás del WebView de la app mobile) no soporta
// grabar en WebM — MediaRecorder tira NotSupportedError. mp4/h264 sí anda
// ahí desde iOS 14.1. Se prueba en orden y se usa el primero soportado.
const MIME_CANDIDATOS = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4;codecs=h264',
  'video/mp4',
]

function mimeSoportado() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return null
  return MIME_CANDIDATOS.find((t) => MediaRecorder.isTypeSupported(t)) ?? null
}

// El backend valida el Content-Type exacto del archivo subido ('video/webm'
// o 'video/mp4', ver back/src/routes/sesiones.js) — sin los parámetros de
// códec, que sí necesita el propio MediaRecorder.
function mimeBase(mimeType) {
  return mimeType.split(';')[0]
}

function grabar(stream) {
  if (!stream) return null
  const mimeType = mimeSoportado()
  if (!mimeType) {
    console.warn('[useSessionRecorder] este navegador no soporta grabar video en ningun formato')
    return null
  }
  try {
    const chunks = []
    // Bitrate acotado: en un celular hay 3 encoders a la vez (más MediaPipe y Phaser)
    // y con el bitrate por defecto alguno puede quedar sin datos.
    const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1_500_000 })
    rec.onerror = (e) => console.warn('[useSessionRecorder] error de MediaRecorder:', e.error ?? e)
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    rec.start()
    return { rec, chunks, mimeType: mimeBase(mimeType) }
  } catch (e) {
    console.warn('[useSessionRecorder] no se pudo iniciar la grabación:', e)
    return null
  }
}

function detenerYArmarBlob(entry) {
  if (!entry) return Promise.resolve(undefined)
  const { rec, chunks, mimeType } = entry
  if (rec.state === 'inactive') return Promise.resolve(new Blob(chunks, { type: mimeType }))
  return new Promise((resolve) => {
    rec.addEventListener('stop', () => resolve(new Blob(chunks, { type: mimeType })), { once: true })
    rec.stop()
  })
}

const ESPERA_MAX_MS = 8000
const ESPERA_INTERVALO_MS = 300

// Fuera del componente a propósito: no depende de ningún estado de React,
// solo de los refs que se le pasan explícitamente.
function iniciarGrabaciones(stream, { landmarksCanvas, gameCanvas }, refs) {
  refs.crudoRef.current = grabar(stream)
  if (!refs.crudoRef.current) console.warn('[useSessionRecorder] no se pudo grabar el video crudo')

  if (landmarksCanvas) {
    try {
      refs.landmarksRef.current = grabar(landmarksCanvas.captureStream(30))
      if (!refs.landmarksRef.current) console.warn('[useSessionRecorder] no se pudo grabar el video de landmarks')
    } catch (e) {
      console.warn('[useSessionRecorder] captureStream de landmarks falló:', e)
    }
  }

  if (gameCanvas) {
    const w = gameCanvas.width
    const h = gameCanvas.height
    const offscreen = document.createElement('canvas')
    offscreen.width = w
    offscreen.height = h
    const ctx = offscreen.getContext('2d')

    const video = document.createElement('video')
    video.autoplay = true
    video.playsInline = true
    video.muted = true
    video.srcObject = stream
    // Safari a veces no arranca un <video> que nunca se agregó al DOM solo
    // con el atributo autoplay — pedirlo explícito no rompe nada en el resto.
    video.play().catch(() => {})
    refs.composeVideoRef.current = video

    const dibujar = () => {
      if (video.readyState >= 2) {
        ctx.save()
        ctx.translate(w, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0, w, h)
        ctx.restore()
      }
      ctx.drawImage(gameCanvas, 0, 0, w, h)
      refs.composeRafRef.current = requestAnimationFrame(dibujar)
    }
    refs.composeRafRef.current = requestAnimationFrame(dibujar)

    try {
      refs.gameplayRef.current = grabar(offscreen.captureStream(30))
      if (!refs.gameplayRef.current) console.warn('[useSessionRecorder] no se pudo grabar el video de gameplay')
    } catch (e) {
      console.warn('[useSessionRecorder] captureStream de gameplay falló:', e)
    }
  }
}

/**
 * Graba las 3 versiones de una sesión de juego (crudo, landmarks, gameplay) y
 * las entrega como Blobs listos para subir con subirVideosSesion().
 *
 * - crudo: el stream de cámara compartido (CameraStream.js), tal cual.
 * - landmarks: el <canvas> que ya dibuja KinetixAI (cámara + esqueleto), vía
 *   captureStream(). No hace falta componer nada, ya está dibujado en vivo.
 * - gameplay: un <canvas> offscreen donde se dibuja a mano, cuadro a cuadro,
 *   la cámara (espejada, igual que se ve en pantalla) + el canvas de Phaser
 *   encima — porque hoy están superpuestos con CSS, no en un mismo canvas.
 */
export function useSessionRecorder() {
  const crudoRef = useRef(null)
  const landmarksRef = useRef(null)
  const gameplayRef = useRef(null)
  const composeRafRef = useRef(null)
  const composeVideoRef = useRef(null)
  const esperaRef = useRef(null)

  const start = useCallback((args) => {
    // getStream() puede devolver null todavía si openCamera() no terminó (el
    // usuario puede tardar en aceptar el permiso, o la cámara del celular
    // tarda en inicializar) — antes esto abortaba la grabación en silencio
    // sin ningún aviso. Reintenta hasta 8s en vez de asumir que ya está listo.
    const intentar = (msEsperados) => {
      const stream = getStream()
      if (!stream) {
        if (msEsperados >= ESPERA_MAX_MS) {
          console.warn(`[useSessionRecorder] no hay stream de cámara después de ${ESPERA_MAX_MS}ms, no se va a grabar nada`)
          return
        }
        esperaRef.current = setTimeout(() => intentar(msEsperados + ESPERA_INTERVALO_MS), ESPERA_INTERVALO_MS)
        return
      }
      console.log(`[useSessionRecorder] stream listo (esperó ${msEsperados}ms), arrancando grabación`)
      iniciarGrabaciones(stream, args, { crudoRef, landmarksRef, gameplayRef, composeRafRef, composeVideoRef })
    }
    intentar(0)
  }, [])

  const stop = useCallback(async () => {
    if (esperaRef.current) clearTimeout(esperaRef.current)
    esperaRef.current = null
    if (composeRafRef.current) cancelAnimationFrame(composeRafRef.current)
    composeRafRef.current = null
    if (composeVideoRef.current) {
      composeVideoRef.current.srcObject = null
      composeVideoRef.current = null
    }

    const [crudo, landmarks, gameplay] = await Promise.all([
      detenerYArmarBlob(crudoRef.current),
      detenerYArmarBlob(landmarksRef.current),
      detenerYArmarBlob(gameplayRef.current),
    ])
    crudoRef.current = null
    landmarksRef.current = null
    gameplayRef.current = null

    console.log('[useSessionRecorder] tamaños (bytes):', { crudo: crudo?.size, landmarks: landmarks?.size, gameplay: gameplay?.size })
    return { crudo, landmarks, gameplay }
  }, [])

  return { start, stop }
}
