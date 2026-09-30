import { useCallback, useRef } from 'react'
import { getStream } from './CameraStream'

function grabar(stream) {
  if (!stream) return null
  try {
    const chunks = []
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm' })
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    rec.start()
    return { rec, chunks }
  } catch (e) {
    console.warn('[useSessionRecorder] no se pudo iniciar la grabación:', e)
    return null
  }
}

function detenerYArmarBlob(entry) {
  if (!entry) return Promise.resolve(undefined)
  const { rec, chunks } = entry
  if (rec.state === 'inactive') return Promise.resolve(new Blob(chunks, { type: 'video/webm' }))
  return new Promise((resolve) => {
    rec.addEventListener('stop', () => resolve(new Blob(chunks, { type: 'video/webm' })), { once: true })
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
