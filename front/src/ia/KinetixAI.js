import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

// Índices de landmarks en MediaPipe Pose
const LM = {
  MUÑECA_IZQ: 15,
  MUÑECA_DER: 16,
  TOBILLO_IZQ: 27,
  TOBILLO_DER: 28,
}

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'

// Evita llamar onStickerTocado dos veces para el mismo elemento
// antes de que Phaser lo elimine de la lista
const _tocadosReciente = new Set()
function _marcarTocado(id) {
  if (_tocadosReciente.has(id)) return false
  _tocadosReciente.add(id)
  setTimeout(() => _tocadosReciente.delete(id), 800)
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
  }

  async init() {
    if (this.landmarker) return
    const vision = await FilesetResolver.forVisionTasks(WASM_URL)
    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
    })
  }

  async start(gameMode, video) {
    await this.init()
    this.gameMode = gameMode
    this.video = video
    this.running = true
    this._piernaLevantada = false
    _tocadosReciente.clear()
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
      const result = this.landmarker.detectForVideo(this.video, now)
      if (result.landmarks.length > 0) this._interpret(result.landmarks[0])
    }
    this._rafId = requestAnimationFrame(() => this._loop())
  }

  // Convierte landmark normalizado [0,1] → píxeles de pantalla.
  // Invierte X porque el video se muestra en espejo (scaleX(-1)).
  _toScreen(lm) {
    return {
      x: (1 - lm.x) * window.innerWidth,
      y: lm.y * window.innerHeight,
    }
  }

  _colisiona(punto, cx, cy, radio) {
    const dx = punto.x - cx
    const dy = punto.y - cy
    return dx * dx + dy * dy < (radio * 1.8) ** 2 // margen extra de tolerancia
  }

  _interpret(landmarks) {
    const manoIzq = this._toScreen(landmarks[LM.MUÑECA_IZQ])
    const manoDer = this._toScreen(landmarks[LM.MUÑECA_DER])

    switch (this.gameMode) {
      case 'surf': {
        const peces = window.kinetixPeces ?? []
        for (const pez of peces) {
          if (
            _marcarTocado(pez.id) &&
            (this._colisiona(manoIzq, pez.x, pez.y, pez.radio) ||
              this._colisiona(manoDer, pez.x, pez.y, pez.radio))
          ) {
            window.kinetix?.onStickerTocado?.(pez.id)
          }
        }
        break
      }

      case 'flamenco': {
        const tIzq = landmarks[LM.TOBILLO_IZQ]
        const tDer = landmarks[LM.TOBILLO_DER]
        // Y crece hacia abajo → tobillo levantado tiene Y menor
        const levantada = tDer.y < tIzq.y - 0.06
        if (levantada !== this._piernaLevantada) {
          this._piernaLevantada = levantada
          if (levantada) window.kinetix?.onPiernaLevantada?.()
          else window.kinetix?.onPiernaBajada?.()
        }
        break
      }

      case 'estrellas': {
        const estrellas = window.kinetixEstrellas ?? []
        for (const est of estrellas) {
          if (
            _marcarTocado(est.id) &&
            (this._colisiona(manoIzq, est.x, est.y, est.radio) ||
              this._colisiona(manoDer, est.x, est.y, est.radio))
          ) {
            window.kinetix?.onStickerTocado?.(est.id)
          }
        }
        break
      }
    }
  }
}

export const kinetixAI = new KinetixAI()
