import Phaser from 'phaser'
import { reiniciarReaccion, objetivoAparece, objetivoTocado } from '../../ia/reaccion'
import { kinetixAI } from '../../ia/KinetixAI'
import { FELICITACIONES } from './mensajes'
import pecesUrl from '../../assets/juegos/surf/peces.png'

const NUM_PECES = 2
const DURACION_JUEGO = 30
const ESTANCADO_S = 6      // segundos sin atrapar nada → "¡No te rindas!"
const MENSAJE_MS = 3000    // cuánto se muestra cada felicitación

// La hoja de peces (Figma 833:442) es un PNG de 2×2 peces. Cada recorte es
// [x0, y0, x1, y1] como fracción del PNG, así no depende de su resolución.
const RECORTES = {
  naranja:  [0.1155, 0.0625, 0.4489, 0.5170],
  amarillo: [0.6079, 0.1023, 0.9110, 0.4545],
  verde:    [0.1345, 0.5512, 0.4299, 0.8921],
  violeta:  [0.6269, 0.5511, 0.9110, 0.8977],
}
const NOMBRES_PEZ = Object.keys(RECORTES)

// Cada pez se redibuja a este ancho (px) al cargar: reducir el PNG original de
// ~465 px a ~50 directo en la GPU lo deja dentado (Phaser no hace mipmaps con
// texturas que no son potencia de 2, como esta de 1536×1024).
const ANCHO_TEXTURA = 192
// Ancho en pantalla (px). En el diseño los peces van de 37 a 79 px (los hay
// lejanos y cercanos); acá un rango parecido, algo más grande porque hay que
// verlos y tocarlos.
const ANCHO_MIN = 44
const ANCHO_MAX = 72
const AMPLITUD_VERTICAL = 14   // cuánto sube y baja cada pez (px, hacia cada lado)

export default class EscenaPrincipal extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaPrincipal' })
  }

  preload() {
    this.load.image('peces', pecesUrl)
  }

  create() {
    if (this.textures.exists('peces')) {
      const hoja = this.textures.get('peces').getSourceImage()
      for (const [nombre, [x0, y0, x1, y1]] of Object.entries(RECORTES)) {
        const sx = x0 * hoja.width, sy = y0 * hoja.height
        const sw = (x1 - x0) * hoja.width, sh = (y1 - y0) * hoja.height
        const lienzo = this.textures.createCanvas(nombre, ANCHO_TEXTURA, Math.round((ANCHO_TEXTURA * sh) / sw))
        lienzo.context.imageSmoothingQuality = 'high'
        lienzo.context.drawImage(hoja, sx, sy, sw, sh, 0, 0, lienzo.width, lienzo.height)
        lienzo.refresh()
      }
      this.textures.remove('peces')
    }

    this.peces = []
    this._resetear()

    // Contrato con la IA y con GamePage
    window.kinetix = window.kinetix || {}
    window.kinetix.onStickerTocado = (id) => {
      const pez = this.peces.find(p => p.id === id)
      if (pez) this.tocarPez(pez)
    }
    window.kinetix.pausar = () => {
      if (this.jugando) { this.jugando = false; this.scene.pause() }
    }
    window.kinetix.reanudar = () => {
      this.scene.resume()
      this.jugando = true
    }
    // Termina la calibración: aparece el primer pez ("Tocá los peces con tus
    // manos"). Se puede llamar de nuevo para otra ronda.
    window.kinetix.empezar = () => this._empezar()

    // Tecla T = simula toque de IA (testing)
    this.input.keyboard.on('keydown-T', () => {
      if (this.peces.length > 0) this.tocarPez(this.peces[0])
    })
  }

  _resetear() {
    this.relojTiempo?.remove()
    this.ocultarMensaje?.remove()
    for (const p of this.peces) {
      this.tweens.killTweensOf(p.img)
      p.img.destroy()
    }
    this.peces = []
    reiniciarReaccion()
    this.puntos = 0
    this.tiempo = 0              // segundos jugados (0 → DURACION_JUEGO)
    this.cronometrando = false   // el reloj arranca al atrapar el primer pez
    this.jugando = false
    this.mensaje = null
    this.sinAcierto = 0
    this._despacharEstado()
  }

  _empezar() {
    this._resetear()
    this.jugando = true
    this.spawnearPez()
  }

  _arrancarCronometro() {
    this.cronometrando = true
    // El pez de la consigna ya se está reemplazando solo (ver tocarPez)
    for (let i = 1; i < NUM_PECES; i++) this.spawnearPez()
    this.relojTiempo = this.time.addEvent({
      delay: 1000,
      repeat: DURACION_JUEGO - 1,
      callback: this._descontarTiempo,
      callbackScope: this,
    })
  }

  spawnearPez() {
    const { width, height } = this.scale
    const margen = 50
    // Los peces tienen que caer donde hay cámara: con la vista "alejada" esa zona es
    // más chica que la pantalla, y fuera de ella el paciente no los podría alcanzar.
    const cam = kinetixAI.areaVideo()
    const camAncho = cam.x1 - cam.x0
    const camAlto = cam.y1 - cam.y0
    let xMin = Math.max(margen, cam.x0 + camAncho * 0.08)
    let xMax = Math.min(width - margen, cam.x1 - camAncho * 0.08)
    if (xMax - xMin < 100) { xMin = margen; xMax = width - margen }
    // Debajo de los carteles de arriba (cuenta + mensaje) y por encima de la tabla
    let yMin = Math.max(height * 0.24, cam.y0 + camAlto * 0.08)
    let yMax = Math.min(height * 0.66, cam.y1 - camAlto * 0.08)
    if (yMax - yMin < 60) { yMin = height * 0.24; yMax = height * 0.66 }

    const x = Phaser.Math.Between(xMin, xMax)
    const y = Phaser.Math.Between(yMin, yMax)

    // Nada de lado a lado: recorre entre el 20% y el 45% del ancho disponible, hacia donde haya lugar
    const span = xMax - xMin
    const recorrido = Phaser.Math.Between(span * 0.2, span * 0.45)
    const dir = x + recorrido <= xMax && (x - recorrido < xMin || Math.random() < 0.5) ? 1 : -1
    const velocidad = span * Phaser.Math.FloatBetween(0.10, 0.17) // px/s: cruzar el ancho lleva ~6–10 s

    const img = this.add.image(x, y - AMPLITUD_VERTICAL, Phaser.Utils.Array.GetRandom(NOMBRES_PEZ))
      .setDepth(2)
      .setScale(Phaser.Math.Between(ANCHO_MIN, ANCHO_MAX) / ANCHO_TEXTURA)
      .setFlipX(dir > 0) // el dibujo mira a la izquierda: se da vuelta para mirar hacia donde nada
      .setInteractive()

    const pez = {
      id: `pez_${Date.now()}_${Phaser.Math.Between(0, 99999)}`,
      img,
      radio: 42,
    }

    img.on('pointerdown', () => this.tocarPez(pez))

    // Va y vuelve (frenando suave en cada punta) y se da vuelta al cambiar de sentido
    this.tweens.add({
      targets: img,
      x: x + dir * recorrido,
      duration: (recorrido / velocidad) * 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onYoyo: () => img.toggleFlipX(),
      onRepeat: () => img.toggleFlipX(),
    })
    // y sube y baja un poco, a otro ritmo para que no se vea sincronizado
    this.tweens.add({
      targets: img,
      y: y + AMPLITUD_VERTICAL,
      duration: 850 + Math.random() * 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.peces.push(pez)
    objetivoAparece(pez.id)
  }

  tocarPez(pez) {
    if (!this.jugando) return
    const idx = this.peces.indexOf(pez)
    if (idx === -1) return

    this.peces.splice(idx, 1)
    this.puntos++
    objetivoTocado(pez.id)

    if (!this.cronometrando) this._arrancarCronometro()
    this.sinAcierto = 0
    const mensaje = FELICITACIONES[(this.puntos - 1) % FELICITACIONES.length]
    this._mostrarMensaje(mensaje, true)

    window.dispatchEvent(new CustomEvent('kinetix:surf:punto', { detail: { mensaje } }))

    this.tweens.killTweensOf(pez.img)
    this.tweens.add({
      targets: pez.img,
      scale: 0,
      alpha: 0,
      duration: 220,
      ease: 'Back.easeIn',
      onComplete: () => {
        pez.img.destroy()
        if (this.jugando) this.spawnearPez()
      },
    })
  }

  _mostrarMensaje(clave, temporal) {
    this.ocultarMensaje?.remove()
    this.mensaje = clave
    if (temporal) {
      this.ocultarMensaje = this.time.delayedCall(MENSAJE_MS, () => {
        this.mensaje = null
        this._despacharEstado()
      })
    }
    this._despacharEstado()
  }

  _descontarTiempo() {
    this.tiempo++
    this.sinAcierto++
    if (this.sinAcierto >= ESTANCADO_S && this.mensaje !== 'norindas') this._mostrarMensaje('norindas', false)
    this._despacharEstado()
    if (this.tiempo >= DURACION_JUEGO) this._finJuego()
  }

  _despacharEstado() {
    window.dispatchEvent(new CustomEvent('kinetix:surf', {
      detail: {
        puntos: this.puntos,
        tiempo: this.tiempo,
        cronometrando: this.cronometrando,
        mensaje: this.mensaje,
      },
    }))
  }

  _finJuego() {
    this.jugando = false
    window.dispatchEvent(new CustomEvent('kinetix:surf:fin', {
      detail: { puntos: this.puntos, duracion_segundos: DURACION_JUEGO },
    }))
  }

  update() {
    window.kinetixPeces = this.peces.map(p => ({
      id: p.id,
      x: p.img.x,
      y: p.img.y,
      radio: p.radio,
    }))
  }
}
