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
    const rec = new MediaRecorder(stream, { mimeType })
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

  const start = useCallback(({ landmarksCanvas, gameCanvas }) => {
    const stream = getStream()

    crudoRef.current = grabar(stream)

    if (landmarksCanvas) {
      try {
        landmarksRef.current = grabar(landmarksCanvas.captureStream(30))
      } catch (e) {
        console.warn('[useSessionRecorder] captureStream de landmarks falló:', e)
      }
    }

    if (stream && gameCanvas) {
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
      composeVideoRef.current = video

      const dibujar = () => {
        if (video.readyState >= 2) {
          ctx.save()
          ctx.translate(w, 0)
          ctx.scale(-1, 1)
          ctx.drawImage(video, 0, 0, w, h)
          ctx.restore()
        }
        ctx.drawImage(gameCanvas, 0, 0, w, h)
        composeRafRef.current = requestAnimationFrame(dibujar)
      }
      composeRafRef.current = requestAnimationFrame(dibujar)

      try {
        gameplayRef.current = grabar(offscreen.captureStream(30))
      } catch (e) {
        console.warn('[useSessionRecorder] captureStream de gameplay falló:', e)
      }
    }
  }, [])

  const stop = useCallback(async () => {
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

    return { crudo, landmarks, gameplay }
  }, [])

  return { start, stop }
}
