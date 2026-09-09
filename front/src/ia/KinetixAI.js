import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const WASM_URL  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'

// https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
const LM = {
  MUÑECA_IZQ:  15,
  MUÑECA_DER:  16,
  CADERA_IZQ:  23,
  CADERA_DER:  24,
  RODILLA_IZQ: 25,
  RODILLA_DER: 26,
  TOBILLO_IZQ: 27,
  TOBILLO_DER: 28,
}

// Evita disparar el mismo evento dos veces en el mismo objeto antes de que Phaser lo elimine
const _cooldown = new Set()
function sinCooldown(id, ms = 700) {
  if (_cooldown.has(id)) return false
  _cooldown.add(id)
  setTimeout(() => _cooldown.delete(id), ms)
  return true
}

class KinetixAI {
  constructor() {
    this.landmarker = null
    this.running = false
    this.gameMode = null
    this.video = null
    this._rafId = null
    this._lastTs = -1
    this._piernaLevantada = false
    this._piernaCnt = 0   // frames consecutivos con pierna arriba/abajo
    this._canvasW = window.innerWidth
    this._canvasH = window.innerHeight
  }

  async init() {
    if (this.landmarker) return
    console.log('[KinetixAI] Cargando modelo MediaPipe...')

    const vision = await FilesetResolver.forVisionTasks(WASM_URL)

    // Intenta GPU primero; cae a CPU si falla
    for (const delegate of ['GPU', 'CPU']) {
      try {
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })
        console.log(`[KinetixAI] Modelo listo (delegate: ${delegate})`)
        return
      } catch {
        console.warn(`[KinetixAI] ${delegate} falló, probando siguiente...`)
      }
    }
    throw new Error('[KinetixAI] No se pudo inicializar MediaPipe')
  }

  async start(gameMode, video, canvasW, canvasH) {
    this.stop()
    await this.init()
    this.gameMode = gameMode
    this.video = video
    this._canvasW = canvasW ?? window.innerWidth
    this._canvasH = canvasH ?? window.innerHeight
    this.running = true
    this._piernaLevantada = false
    this._piernaCnt = 0
    _cooldown.clear()
    console.log(`[KinetixAI] Detectando poses → juego: ${gameMode} canvas: ${this._canvasW}x${this._canvasH}`)
    this._loop()
  }

  stop() {
    this.running = false
    if (this._rafId) cancelAnimationFrame(this._rafId)
    this._rafId = null
  }

  _loop() {
    if (!this.running) return
    const now = performance.now()
    if (now !== this._lastTs && this.video?.readyState >= 2) {
      this._lastTs = now
      try {
        const result = this.landmarker.detectForVideo(this.video, now)
        if (result.landmarks.length > 0) {
          this._interpret(result.landmarks[0])
        }
      } catch { /* ignora errores de frame */ }
    }
    this._rafId = requestAnimationFrame(() => this._loop())
  }

  // Convierte posición Phaser (píxeles) → normalizado [0,1] en espacio del video.
  // Invierte X porque el video se muestra en espejo (scaleX(-1)).
  _pxToNorm(px, py) {
    return {
      x: 1 - px / this._canvasW,
      y: py / this._canvasH,
    }
  }

  _dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  _interpret(landmarks) {
    const manoIzq = landmarks[LM.MUÑECA_IZQ]
    const manoDer = landmarks[LM.MUÑECA_DER]

    switch (this.gameMode) {

      // ─── SURF ──────────────────────────────────────────────────────────────
      // Detecta si alguna muñeca está cerca de un pez.
      // window.kinetixPeces = [{id, x, y, radio}] en coords de Phaser canvas.
      case 'surf': {
        const peces = window.kinetixPeces ?? []
        for (const pez of peces) {
          // radio en normalizado (radio en px / ancho canvas)
          const radioNorm = (pez.radio * 1.8) / this._canvasW
          const norm = this._pxToNorm(pez.x, pez.y)
          const tocado =
            this._dist(manoIzq, norm) < radioNorm ||
            this._dist(manoDer, norm) < radioNorm
          if (tocado && sinCooldown(pez.id)) {
            console.log('[KinetixAI] Surf: pez tocado', pez.id)
            window.kinetix?.onStickerTocado?.(pez.id)
          }
        }
        break
      }

      // ─── FLAMENCO ──────────────────────────────────────────────────────────
      // Detecta si alguna rodilla está levantada respecto a la otra cadera.
      // Usa rodilla (no tobillo) porque es más visible y se levanta más.
      // Requiere 3 frames consecutivos para evitar falsos positivos.
      case 'flamenco': {
        const rIzq = landmarks[LM.RODILLA_IZQ]
        const rDer = landmarks[LM.RODILLA_DER]
        const cIzq = landmarks[LM.CADERA_IZQ]
        const cDer = landmarks[LM.CADERA_DER]

        // Visibilidad mínima para considerar el landmark confiable
        const visOk = (lm) => (lm.visibility ?? 1) > 0.4

        const derechaLevantada = visOk(rDer) && visOk(cIzq) && rDer.y < cIzq.y - 0.04
        const izquierdaLevantada = visOk(rIzq) && visOk(cDer) && rIzq.y < cDer.y - 0.04
        const levantada = derechaLevantada || izquierdaLevantada

        if (levantada === this._piernaLevantada) {
          this._piernaCnt = 0
        } else {
          this._piernaCnt++
          if (this._piernaCnt >= 3) {
            this._piernaCnt = 0
            this._piernaLevantada = levantada
            if (levantada) {
              console.log('[KinetixAI] Flamenco: pierna levantada')
              window.kinetix?.onPiernaLevantada?.()
            } else {
              console.log('[KinetixAI] Flamenco: pierna bajada')
              window.kinetix?.onPiernaBajada?.()
            }
          }
        }
        break
      }

      // ─── ESTRELLAS ─────────────────────────────────────────────────────────
      // Detecta si alguna muñeca está cerca de una estrella.
      // window.kinetixEstrellas = [{id, x, y, radio}] en coords de Phaser canvas.
      case 'estrellas': {
        const estrellas = window.kinetixEstrellas ?? []
        for (const est of estrellas) {
          const radioNorm = (est.radio * 1.8) / this._canvasW
          const norm = this._pxToNorm(est.x, est.y)
          const tocada =
            this._dist(manoIzq, norm) < radioNorm ||
            this._dist(manoDer, norm) < radioNorm
          if (tocada && sinCooldown(est.id)) {
            console.log('[KinetixAI] Estrellas: estrella tocada', est.id)
            window.kinetix?.onStickerTocado?.(est.id)
          }
        }
        break
      }
    }
  }
}

export const kinetixAI = new KinetixAI()
