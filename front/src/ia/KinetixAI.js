import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { tiempoReaccionMediana } from './reaccion'
import { eficienciaDeTrayecto, coordinacionScore } from './trayectoria'
import { medirPiernas, evaluarPierna } from './piernas'

const WASM_URL  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'

// https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
const LM = {
  HOMBRO_IZQ:  11,
  HOMBRO_DER:  12,
  CODO_IZQ:    13,
  CODO_DER:    14,
  MUÑECA_IZQ:  15,
  MUÑECA_DER:  16,
  CADERA_IZQ:  23,
  CADERA_DER:  24,
  RODILLA_IZQ: 25,
  RODILLA_DER: 26,
  TOBILLO_IZQ: 27,
  TOBILLO_DER: 28,
}

// Vista sin alejar: el video centrado y a escala 1 (ver KinetixAI._encuadre)
const VISTA_BASE = { s: 1, px: 0.5, py: 0.5, qx: 0.5, qy: 0.5 }

// Evita disparar el mismo evento dos veces en el mismo objeto antes de que Phaser lo elimine
const _cooldown = new Set()
function sinCooldown(id, ms = 700) {
  if (_cooldown.has(id)) return false
  _cooldown.add(id)
  setTimeout(() => _cooldown.delete(id), ms)
  return true
}

// Pares de landmarks a unir para dibujar un esqueleto simple (hombros,
// brazos, torso y piernas) — subset legible, no los ~35 pares oficiales.
const HUESOS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
]

class KinetixAI {
  constructor() {
    this.landmarker = null
    this.running = false
    this.gameMode = null
    this.video = null
    this._rafId = null
    this._lastTs = -1
    this.ultimosLandmarks = null
    this._piernaLevantada = false
    this._piernaCnt = 0   // frames consecutivos con pierna arriba/abajo
    this._pedido = { lado: null, posicion: 'flamenco' } // qué se le pide al paciente ahora (ver pedirPierna)
    this._med = null      // última medición de las piernas (ver piernas.js)
    this._pierna = null   // lo que se evaluó de la pierna pedida en el último frame
    this._canvasW = window.innerWidth
    this._canvasH = window.innerHeight
    // Acumuladores para las métricas de "equilibrio" que se mandan al
    // backend al terminar la sesión — ver getMetricasResumen().
    this._muestrasCadera = []   // {x,y} del centro de cadera, cada frame (estabilidad)
    this._muestrasAngulo = []   // ángulo de rodilla o codo, cada frame (rango de movimiento)
    this._muestrasTronco = []   // inclinación del torso respecto de la vertical, en grados
    this._frames = { izq: 0, der: 0 } // frames con cada pierna levantada (Flamenco)
    this._trayManos = { izq: [], der: [] } // camino de cada muñeca desde el último toque
    this._eficiencias = []      // eficiencia (0–1) del trayecto de cada toque (coordinación)
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
          outputSegmentationMasks: true,
        })
        console.log(`[KinetixAI] Modelo listo (delegate: ${delegate})`)
        return
      } catch {
        console.warn(`[KinetixAI] ${delegate} falló, probando siguiente...`)
      }
    }
    throw new Error('[KinetixAI] No se pudo inicializar MediaPipe')
  }

  // reanudando: la detección se había pausado y sigue la misma partida. Se conserva lo
  // acumulado (métricas de la sesión), la vista calibrada y si la pierna estaba arriba;
  // si no, pausar descartaría todo eso y un pie bajado durante la pausa nunca avisaría.
  async start(gameMode, video, canvasW, canvasH, overlayCanvas, siluetaCanvas, { reanudando = false } = {}) {
    this.stop()
    await this.init()
    this.gameMode = gameMode
    this.video = video
    this._canvasW = canvasW ?? window.innerWidth
    this._canvasH = canvasH ?? window.innerHeight
    this.overlayCanvas = overlayCanvas ?? null
    this.overlayCtx = overlayCanvas?.getContext('2d') ?? null
    // Canvas de pantalla completa donde se recorta el cuerpo del paciente
    // (por segmentación de MediaPipe) y se superpone sobre el fondo del
    // juego — ver _drawSilueta().
    this.siluetaCanvas = siluetaCanvas ?? null
    this.siluetaCtx = siluetaCanvas?.getContext('2d') ?? null
    this.running = true
    if (!reanudando) {
      this._piernaLevantada = false
      this._piernaCnt = 0
      this._med = null
      this._pierna = null
      this.reiniciarMetricas()
      this.reiniciarVista()
      _cooldown.clear()
    }
    console.log(`[KinetixAI] Detectando poses → juego: ${gameMode} canvas: ${this._canvasW}x${this._canvasH}`)
    this._loop()
  }

  // Descarta lo acumulado hasta ahora para las métricas de la sesión. El Surf
  // lo llama cuando arranca el juego de verdad, así no cuentan los segundos de
  // instrucciones y calibración (el paciente todavía se está acomodando).
  reiniciarMetricas() {
    this._muestrasCadera = []
    this._muestrasAngulo = []
    this._muestrasTronco = []
    this._frames = { izq: 0, der: 0 }
    this._trayManos = { izq: [], der: [] }
    this._eficiencias = []
  }

  // ¿Hay una pierna levantada ahora? Los eventos de Flamenco solo avisan cuando
  // cambia, así que el juego lo consulta al empezar cada repetición.
  get piernaLevantada() {
    return this._piernaLevantada
  }

  // Qué se le pide al paciente (Flamenco): la pierna ('der' | 'izq'; null = cualquiera) y la
  // posición ('flamenco': pie despegado | 'alto': rodilla bien arriba). Los eventos
  // onPiernaLevantada/onPiernaBajada hablan siempre de esa pierna en esa posición.
  pedirPierna(lado = null, posicion = 'flamenco') {
    this._pedido = { lado, posicion }
    this._piernaCnt = 0
    // Lo que se venía cumpliendo valía para el pedido anterior: se vuelve a medir contra el nuevo
    if (this._med) this._piernaLevantada = evaluarPierna(this._med, this._pedido, false).cumple
  }

  // Lo último que se vio de la pierna pedida: { cumple, arriba, otra, altura } (ver piernas.js),
  // o null si no hay cuerpo a la vista.
  get pierna() {
    return this._pierna
  }

  stop() {
    this.running = false
    this.ultimosLandmarks = null
    this._pierna = null
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
        const landmarks = result.landmarks[0] ?? null
        const mask = result.segmentationMasks?.[0] ?? null
        this.ultimosLandmarks = landmarks // la calibración del Surf los lee desde React
        if (landmarks) this._interpret(landmarks)
        if (this.overlayCtx) this._drawOverlay(landmarks)
        if (this.siluetaCtx) this._drawSilueta(mask, landmarks)
        // MPMask es un recurso nativo (WebGL) — hay que liberarlo cada frame
        // o se acumula memoria de GPU.
        mask?.close()
      } catch { /* ignora errores de frame */ }
    }
    this._rafId = requestAnimationFrame(() => this._loop())
  }

  // Dibuja el video de la cámara (en espejo) + los landmarks detectados sobre
  // el canvas de overlay — para que la detección sea visible en pantalla/video.
  _drawOverlay(landmarks) {
    const ctx = this.overlayCtx
    const w = this.overlayCanvas.width
    const h = this.overlayCanvas.height

    // El cuerpo entero queda dentro del cuadro sin estirar el video: si la proporción
    // no coincide sobran franjas a los costados (se pintan del color de fondo).
    const vw = this.video.videoWidth || w
    const vh = this.video.videoHeight || h
    const escala = Math.min(w / vw, h / vh)
    const dw = vw * escala
    const dh = vh * escala
    const dx = (w - dw) / 2
    const dy = (h - dh) / 2

    ctx.save()
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
    ctx.fillStyle = '#0F1387'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(this.video, dx, dy, dw, dh)

    if (landmarks) {
      ctx.strokeStyle = '#34D399'
      ctx.lineWidth = 2
      for (const [a, b] of HUESOS) {
        const p1 = landmarks[a]
        const p2 = landmarks[b]
        if (!p1 || !p2) continue
        ctx.beginPath()
        ctx.moveTo(dx + p1.x * dw, dy + p1.y * dh)
        ctx.lineTo(dx + p2.x * dw, dy + p2.y * dh)
        ctx.stroke()
      }
      ctx.fillStyle = '#F472B6'
      for (const lm of landmarks) {
        if ((lm.visibility ?? 1) < 0.3) continue
        ctx.beginPath()
        ctx.arc(dx + lm.x * dw, dy + lm.y * dh, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  // Recorta el cuerpo del paciente del video (usando la máscara de
  // segmentación de MediaPipe) y lo dibuja sobre un canvas de pantalla
  // completa con fondo transparente — puesto por encima del canvas de
  // Phaser, así el paciente aparece "parado adentro" del juego en vez de
  // taparlo con el video completo de la cámara.
  _drawSilueta(mask, landmarks) {
    const ctx = this.siluetaCtx
    const w = this.siluetaCanvas.width
    const h = this.siluetaCanvas.height
    ctx.clearRect(0, 0, w, h)
    if (!mask) return

    const mw = mask.width
    const mh = mask.height
    if (!mw || !mh) return

    // Canvas chico reusado entre frames: pinta la máscara como un alfa
    // (blanco opaco = persona, transparente = fondo).
    if (!this._maskCanvas || this._maskCanvas.width !== mw || this._maskCanvas.height !== mh) {
      this._maskCanvas = document.createElement('canvas')
      this._maskCanvas.width = mw
      this._maskCanvas.height = mh
      this._maskCtx = this._maskCanvas.getContext('2d')
      this._maskImageData = this._maskCtx.createImageData(mw, mh)
    }
    const datos = mask.getAsFloat32Array()
    const px = this._maskImageData.data
    for (let i = 0; i < datos.length; i++) {
      const a = datos[i] * 255
      px[i * 4] = 255
      px[i * 4 + 1] = 255
      px[i * 4 + 2] = 255
      px[i * 4 + 3] = a
    }
    this._maskCtx.putImageData(this._maskImageData, 0, 0)

    // La silueta se encuadra como object-fit: cover (conserva la proporción y
    // recorta los bordes); si se estira el frame al tamaño del canvas queda
    // deformada. Ver _encuadre().
    const { dx, dy, dw, dh } = this._encuadre(w, h, this.video.videoWidth || mw, this.video.videoHeight || mh)

    ctx.save()
    // Mismo espejo que el resto de los overlays (el video se ve como espejo)
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(this._maskCanvas, dx, dy, dw, dh)
    // source-in: solo queda lo que se dibuje ahora donde ya había alfa
    // (la silueta) — recorta el video con la forma de la máscara.
    ctx.globalCompositeOperation = 'source-in'
    ctx.drawImage(this.video, dx, dy, dw, dh)
    ctx.restore()

    // Con la vista alejada el borde de abajo del video puede quedar a mitad de
    // pantalla (el cuerpo "se corta" ahí): se desvanece en el agua en vez de
    // terminar en una línea recta.
    const fin = dy + dh
    if (this._vistaA && fin < h - 2) {
      const fundido = Math.min(dh * 0.12, 90)
      const g = ctx.createLinearGradient(0, fin - fundido, 0, fin)
      g.addColorStop(0, 'rgba(0,0,0,1)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.globalCompositeOperation = 'destination-in'
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  // Encuadre base del video: object-fit: cover dentro de un canvas w×h (se
  // agranda hasta cubrir y se recorta el sobrante). Con la misma proporción
  // da (0,0,w,h).
  _encuadreBase(w, h, vw = this.video?.videoWidth, vh = this.video?.videoHeight) {
    if (!vw || !vh) return { dx: 0, dy: 0, dw: w, dh: h }
    const escala = Math.max(w / vw, h / vh)
    const dw = vw * escala
    const dh = vh * escala
    return { dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh }
  }

  // Rectángulo donde cae el frame del video, con la "vista" aplicada si hay
  // una. Es lo que ve el paciente: lo usan la silueta, los toques y la
  // calibración, así las tres coinciden.
  _encuadre(w, h, vw, vh) {
    const base = this._encuadreBase(w, h, vw, vh)
    const v = this._vistaAhora()
    if (!v) return base
    // La vista dice: el punto (px,py) del video —normalizado— va a la posición
    // (qx,qy) de la pantalla —como fracción de ancho y alto—, con el video a
    // escala `s` respecto del encuadre base. (X va espejada, como el video.)
    const dw = base.dw * v.s
    const dh = base.dh * v.s
    return { dx: w * (1 - v.qx) - v.px * dw, dy: h * v.qy - v.py * dh, dw, dh }
  }

  // ─── Vista: "alejar" al paciente ──────────────────────────────────────────
  // Si el paciente está cerca de la cámara su cuerpo sale enorme y el juego pide
  // demasiado espacio. En vez de pedirle que se aleje, se achica y se centra su
  // imagen (ver calibracion.js → vistaPara). Fuera del video queda transparente,
  // así que el paciente se ve más chico "parado en el mar".
  _vistaAhora() {
    if (!this._vistaA) return null
    const t = Math.min(1, (performance.now() - this._vistaT0) / this._vistaMs)
    const e = t * t * (3 - 2 * t) // arranque y llegada suaves
    const de = this._vistaDe
    const a = this._vistaA
    const mezcla = (k) => de[k] + (a[k] - de[k]) * e
    return { s: mezcla('s'), px: mezcla('px'), py: mezcla('py'), qx: mezcla('qx'), qy: mezcla('qy') }
  }

  fijarVista(vista, ms = 900) {
    this._vistaDe = this._vistaAhora() ?? VISTA_BASE
    this._vistaA = vista
    this._vistaT0 = performance.now()
    this._vistaMs = ms
  }

  reiniciarVista() {
    this._vistaA = null
  }

  // Encuadre base del video en el área de juego actual, sin la vista (la
  // calibración lo necesita para medir al paciente).
  encuadreBase() {
    const { w, h } = this._tam()
    return this._encuadreBase(w, h)
  }

  // Rectángulo de pantalla (en píxeles del área de juego) donde hay cámara. Con
  // la vista alejada es más chico que el área: los objetivos (peces) tienen que
  // caer ahí adentro para que el paciente los pueda alcanzar.
  areaVideo() {
    const { w, h } = this._tam()
    const { dx, dy, dw, dh } = this._encuadre(w, h)
    return { x0: w - dx - dw, x1: w - dx, y0: dy, y1: dy + dh }
  }

  // Tamaño actual del área de juego en píxeles. Si hay canvas de silueta se usa
  // el suyo, que la página mantiene al tamaño real del área aunque la ventana
  // cambie; _canvasW/_canvasH quedan de respaldo (los fija start() una sola vez).
  _tam() {
    return { w: this.siluetaCanvas?.width || this._canvasW, h: this.siluetaCanvas?.height || this._canvasH }
  }

  // Landmark normalizado del video → píxel del canvas del juego (en espejo,
  // igual que se ve en pantalla). Inversa de _pxToNorm().
  aPantalla(lm) {
    const { w, h } = this._tam()
    const { dx, dy, dw, dh } = this._encuadre(w, h)
    return { x: w - (dx + lm.x * dw), y: dy + lm.y * dh }
  }

  // Convierte posición Phaser (píxeles) → normalizado [0,1] en espacio del video.
  // Invierte X porque el video se muestra en espejo (scaleX(-1)).
  _pxToNorm(px, py) {
    const { w, h } = this._tam()
    const { dx, dy, dw, dh } = this._encuadre(w, h)
    return { x: (w - px - dx) / dw, y: (py - dy) / dh }
  }

  // Radio en píxeles → radio en unidades normalizadas del video.
  _radioNorm(px) {
    const { w, h } = this._tam()
    return px / this._encuadre(w, h).dw
  }

  _dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  // Ángulo (en grados) que forman los 3 puntos, con el vértice en `b` —
  // ej. ángulo de rodilla: a=cadera, b=rodilla, c=tobillo. 180° = pierna
  // recta, menos que eso = más flexionada.
  _angulo(a, b, c) {
    const v1 = { x: a.x - b.x, y: a.y - b.y }
    const v2 = { x: c.x - b.x, y: c.y - b.y }
    const mag1 = Math.hypot(v1.x, v1.y)
    const mag2 = Math.hypot(v2.x, v2.y)
    if (mag1 === 0 || mag2 === 0) return null
    const cos = Math.min(1, Math.max(-1, (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2)))
    return (Math.acos(cos) * 180) / Math.PI
  }

  // Corre en cada frame para los 3 juegos, antes de la lógica específica de
  // cada uno — junta las muestras para las métricas de equilibrio que se
  // mandan al backend al terminar (ver getMetricasResumen()).
  _muestrear(landmarks) {
    const visOk = (lm) => (lm?.visibility ?? 1) > 0.3
    const cIzq = landmarks[LM.CADERA_IZQ]
    const cDer = landmarks[LM.CADERA_DER]

    // Estabilidad: centro de cadera. Cuanto menos se mueve en toda la
    // sesión, más estable estuvo el paciente parado.
    if (visOk(cIzq) && visOk(cDer)) {
      this._muestrasCadera.push({ x: (cIzq.x + cDer.x) / 2, y: (cIzq.y + cDer.y) / 2 })
    }

    // Control del tronco: cuánto se inclina la línea hombros→caderas respecto
    // de la vertical.
    const hI = landmarks[LM.HOMBRO_IZQ], hD = landmarks[LM.HOMBRO_DER]
    if (visOk(hI) && visOk(hD) && visOk(cIzq) && visOk(cDer)) {
      const dx = (hI.x + hD.x) / 2 - (cIzq.x + cDer.x) / 2
      const dy = (hI.y + hD.y) / 2 - (cIzq.y + cDer.y) / 2
      this._muestrasTronco.push(Math.abs((Math.atan2(dx, -dy) * 180) / Math.PI))
    }

    // Apoyo por pierna (Flamenco): la pierna "levantada" es la del tobillo
    // más alto (y menor); el apoyo es en la otra.
    if (this.gameMode === 'flamenco') {
      const tI = landmarks[LM.TOBILLO_IZQ], tD = landmarks[LM.TOBILLO_DER]
      if (visOk(tI) && visOk(tD)) {
        if (tD.y - tI.y > 0.05) this._frames.izq += 1
        else if (tI.y - tD.y > 0.05) this._frames.der += 1
      }
    }

    // Rango de movimiento: ángulo de rodilla en Flamenco (la pierna que se
    // levanta), ángulo de codo en Surf/Estrellas (el brazo que se estira).
    if (this.gameMode === 'flamenco') {
      const rIzq = landmarks[LM.RODILLA_IZQ], rDer = landmarks[LM.RODILLA_DER]
      const tIzq = landmarks[LM.TOBILLO_IZQ], tDer = landmarks[LM.TOBILLO_DER]
      if (visOk(rIzq) && visOk(tIzq)) {
        const ang = this._angulo(cIzq, rIzq, tIzq)
        if (ang != null) this._muestrasAngulo.push(ang)
      }
      if (visOk(rDer) && visOk(tDer)) {
        const ang = this._angulo(cDer, rDer, tDer)
        if (ang != null) this._muestrasAngulo.push(ang)
      }
    } else {
      const hIzq = landmarks[LM.HOMBRO_IZQ], hDer = landmarks[LM.HOMBRO_DER]
      const koIzq = landmarks[LM.CODO_IZQ], koDer = landmarks[LM.CODO_DER]
      const mIzq = landmarks[LM.MUÑECA_IZQ], mDer = landmarks[LM.MUÑECA_DER]
      if (visOk(hIzq) && visOk(koIzq) && visOk(mIzq)) {
        const ang = this._angulo(hIzq, koIzq, mIzq)
        if (ang != null) this._muestrasAngulo.push(ang)
      }
      if (visOk(hDer) && visOk(koDer) && visOk(mDer)) {
        const ang = this._angulo(hDer, koDer, mDer)
        if (ang != null) this._muestrasAngulo.push(ang)
      }
    }
  }

  // Resumen para mandar a /api/sesiones/:id/finalizar al terminar el juego.
  // Devuelve null en cada campo si no hubo suficientes muestras confiables
  // (mejor no mandar un número que mandar uno inventado).
  getMetricasResumen() {
    let estabilidad_score = null
    if (this._muestrasCadera.length >= 10) {
      const xs = this._muestrasCadera.map((m) => m.x)
      const ys = this._muestrasCadera.map((m) => m.y)
      const media = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length
      const varianza = (arr) => { const m = media(arr); return media(arr.map((v) => (v - m) ** 2)) }
      const varTotal = varianza(xs) + varianza(ys)
      // Escala empírica: parado firme ronda 0.00005–0.0003 de varianza
      // (coords normalizadas 0–1); moviéndose bastante supera 0.01.
      estabilidad_score = Math.round(Math.max(0, Math.min(100, 100 - varTotal * 8000)))
    }

    let rango_movimiento_avg = null
    let rango_movimiento_max = null
    if (this._muestrasAngulo.length >= 5) {
      const base = this._muestrasAngulo[0] // ángulo de referencia: postura inicial
      const desvios = this._muestrasAngulo.map((a) => Math.abs(a - base))
      rango_movimiento_avg = Math.round(desvios.reduce((a, b) => a + b, 0) / desvios.length)
      rango_movimiento_max = Math.round(Math.max(...this._muestrasAngulo) - Math.min(...this._muestrasAngulo))
    }

    // Scores 0-100 (100 = sin desvío). Escalas empíricas, como la de estabilidad.
    let control_tronco = null
    if (this._muestrasTronco.length >= 10) {
      const prom = this._muestrasTronco.reduce((a, b) => a + b, 0) / this._muestrasTronco.length
      control_tronco = Math.round(Math.max(0, Math.min(100, 100 - prom * 5)))
    }

    let control_lateral = null
    if (this._muestrasCadera.length >= 10) {
      const xs = this._muestrasCadera.map((m) => m.x)
      const media = xs.reduce((a, b) => a + b, 0) / xs.length
      const desvio = Math.sqrt(xs.reduce((a, v) => a + (v - media) ** 2, 0) / xs.length)
      control_lateral = Math.round(Math.max(0, Math.min(100, 100 - desvio * 600)))
    }

    // % del tiempo con una pierna levantada en que se apoyó en cada una.
    let apoyo_der_pct = null
    let apoyo_izq_pct = null
    const levantadas = this._frames.izq + this._frames.der
    if (this.gameMode === 'flamenco' && levantadas >= 10) {
      apoyo_der_pct = Math.round((this._frames.izq / levantadas) * 100) // izquierda arriba = apoyo derecho
      apoyo_izq_pct = 100 - apoyo_der_pct
    }

    return {
      estabilidad_score, rango_movimiento_avg, rango_movimiento_max, control_tronco, control_lateral, apoyo_der_pct, apoyo_izq_pct,
      // El Flamenco no mide reacción: sin esto se colaría la de la última partida de Surf/Estrellas (el estado es del módulo)
      tiempo_reaccion_s: this.gameMode === 'flamenco' ? null : tiempoReaccionMediana(),
      coordinacion: this.gameMode === 'flamenco' ? null : coordinacionScore(this._eficiencias),
    }
  }

  // Guarda el camino de cada muñeca (solo Surf/Estrellas, donde se tocan
  // objetivos). Tope de muestras para no crecer sin límite si no hay toques.
  _seguirManos(manoIzq, manoDer) {
    const visible = (lm) => lm && (lm.visibility ?? 1) > 0.3
    if (visible(manoIzq)) this._trayManos.izq.push({ x: manoIzq.x, y: manoIzq.y })
    if (visible(manoDer)) this._trayManos.der.push({ x: manoDer.x, y: manoDer.y })
    for (const lado of ['izq', 'der']) {
      if (this._trayManos[lado].length > 600) this._trayManos[lado].splice(0, 300)
    }
  }

  // Al tocar un objetivo: cierra el trayecto de la mano que lo tocó y
  // empieza uno nuevo para el próximo objetivo.
  _cerrarTrayecto(lado) {
    const e = eficienciaDeTrayecto(this._trayManos[lado])
    if (e != null) this._eficiencias.push(e)
    this._trayManos = { izq: [], der: [] }
  }

  // Cuál de las dos muñecas está tocando (la más cercana al objetivo).
  _manoQueToca(manoIzq, manoDer, norm, radioNorm) {
    const dIzq = this._dist(manoIzq, norm)
    const dDer = this._dist(manoDer, norm)
    if (dIzq < radioNorm && (dDer >= radioNorm || dIzq <= dDer)) return 'izq'
    return dDer < radioNorm ? 'der' : null
  }

  _interpret(landmarks) {
    this._muestrear(landmarks)

    const manoIzq = landmarks[LM.MUÑECA_IZQ]
    const manoDer = landmarks[LM.MUÑECA_DER]
    if (this.gameMode === 'surf' || this.gameMode === 'estrellas') this._seguirManos(manoIzq, manoDer)

    switch (this.gameMode) {

      // ─── SURF ──────────────────────────────────────────────────────────────
      // Detecta si alguna muñeca está cerca de un pez.
      // window.kinetixPeces = [{id, x, y, radio}] en coords de Phaser canvas.
      case 'surf': {
        const peces = window.kinetixPeces ?? []
        for (const pez of peces) {
          const radioNorm = this._radioNorm(pez.radio * 1.8)
          const norm = this._pxToNorm(pez.x, pez.y)
          const lado = this._manoQueToca(manoIzq, manoDer, norm, radioNorm)
          if (lado && sinCooldown(pez.id)) {
            this._cerrarTrayecto(lado)
            console.log('[KinetixAI] Surf: pez tocado', pez.id)
            window.kinetix?.onStickerTocado?.(pez.id)
          }
        }
        break
      }

      // ─── FLAMENCO ──────────────────────────────────────────────────────────
      // Detecta si la pierna pedida (pedirPierna) está en la posición pedida: "flamenco" (pie
      // despegado del piso) o "alto" (rodilla bien arriba). Las medidas están en piernas.js.
      // Requiere 3 frames consecutivos para evitar falsos positivos.
      case 'flamenco': {
        const med = medirPiernas(landmarks)
        this._med = med
        this._pierna = med && evaluarPierna(med, this._pedido, this._piernaLevantada)
        if (!this._pierna) break // sin el torso a la vista no se decide nada
        const levantada = this._pierna.cumple

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
          const radioNorm = this._radioNorm(est.radio * 1.8)
          const norm = this._pxToNorm(est.x, est.y)
          const lado = this._manoQueToca(manoIzq, manoDer, norm, radioNorm)
          if (lado && sinCooldown(est.id)) {
            this._cerrarTrayecto(lado)
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
