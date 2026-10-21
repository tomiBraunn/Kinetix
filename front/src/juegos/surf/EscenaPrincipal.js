import Phaser from 'phaser'
import { reiniciarReaccion, objetivoAparece, objetivoTocado } from '../../ia/reaccion'
import { kinetixAI } from '../../ia/KinetixAI'
import { FELICITACIONES } from './mensajes'
import { cuerpoEnPantalla, elegirPunto, recorridoAlejandose, zonaAlcance } from './aparicion'
import { nivelPara, parametrosDe } from './dificultad'
import pecesUrl from '../../assets/juegos/surf/peces.png'

const DURACION_JUEGO = 30
const ESTANCADO_S = 6      // segundos sin atrapar nada → "¡No te rindas!"
const MENSAJE_MS = 3000    // cuánto se muestra cada felicitación
// Entre un pez y el siguiente pasa un rato (ms): el que reemplaza a uno atrapado tarda en aparecer y,
// cuando faltan varios (al subir de nivel), entran de a uno. Sin esto aparecían todos juntos y de golpe.
const RETRASO_PEZ_MS = [500, 900]
const ENTRE_PECES_MS = [700, 1100]

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
const TRONCO_REF = 170         // largo de tronco (px) de un paciente en un celular en vertical, si no se lo ve
const VELOCIDAD_TRONCOS = 0.25 // troncos por segundo a velocidad 1: lo que antes eran ~40 px/s en el celular

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
    this._apariciones?.forEach((e) => e.remove())
    this._apariciones = []
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
    this.nivel = 0               // nivel de dificultad alcanzado (0 = el más fácil, ver dificultad.js)
    this._despacharEstado()
  }

  // Los peces, los recorridos y las distancias se agrandan con la pantalla (un televisor se mira de lejos y
  // es mucho más grande), pero nunca por debajo de lo de un celular en vertical.
  _escalaPantalla() {
    const { width, height } = this.scale
    return Math.min(2.2, Math.max(1, Math.min(width, height) / 400))
  }

  // Mantiene en el agua tantos peces como pide el nivel de dificultad, pero de a uno y con un retraso entre
  // cada aparición (ver RETRASO_PEZ_MS). Los que ya están programados cuentan como presentes.
  _rellenarPeces() {
    const { pecesALaVez } = parametrosDe(nivelPara(this.puntos))
    let espera = 0
    for (let n = this.peces.length + this._apariciones.length; n < pecesALaVez; n++) {
      espera += espera === 0 ? Phaser.Math.Between(...RETRASO_PEZ_MS) : Phaser.Math.Between(...ENTRE_PECES_MS)
      const evento = this.time.delayedCall(espera, () => {
        this._apariciones = this._apariciones.filter((e) => e !== evento)
        if (this.jugando) this.spawnearPez()
      })
      this._apariciones.push(evento)
    }
  }

  _empezar() {
    this._resetear()
    this.jugando = true
    this.spawnearPez()
  }

  _arrancarCronometro() {
    this.cronometrando = true
    // El pez de la consigna ya se está reemplazando solo (ver tocarPez)
    this.relojTiempo = this.time.addEvent({
      delay: 1000,
      repeat: DURACION_JUEGO - 1,
      callback: this._descontarTiempo,
      callbackScope: this,
    })
  }

  spawnearPez() {
    const { width, height } = this.scale
    const nivel = parametrosDe(nivelPara(this.puntos))
    const escala = this._escalaPantalla()
    const apaisada = width > height * 1.2
    const margen = 50
    // Los peces tienen que caer donde hay cámara: con la vista "alejada" esa zona es
    // más chica que la pantalla, y fuera de ella el paciente no los podría alcanzar.
    const cam = kinetixAI.areaVideo()
    const camAncho = cam.x1 - cam.x0
    const camAlto = cam.y1 - cam.y0
    let xMin = Math.max(margen, cam.x0 + camAncho * 0.08)
    let xMax = Math.min(width - margen, cam.x1 - camAncho * 0.08)
    if (xMax - xMin < 100) { xMin = margen; xMax = width - margen }
    // Debajo de los carteles de arriba y por encima de la tabla. Apaisada el alto es poco: los carteles
    // son una columna en el centro (se esquivan abajo) y el resto del alto se usa.
    const arriba = height * (apaisada ? 0.12 : 0.24)
    const abajo = height * (apaisada ? 0.85 : 0.66)
    let yMin = Math.max(arriba, cam.y0 + camAlto * 0.08)
    let yMax = Math.min(abajo, cam.y1 - camAlto * 0.08)
    if (yMax - yMin < 60) { yMin = arriba; yMax = abajo }
    // Carteles (columna central de 402 px): arriba solo apaisada (en vertical ya queda por encima de la
    // zona) y abajo siempre, donde están la cámara chica y los botones.
    const cx = width / 2
    const evitar = [{ x0: cx - 205, x1: cx + 205, y0: height - 125, y1: height }]
    if (apaisada) evitar.push({ x0: cx - 205, x1: cx + 205, y0: 0, y1: 215 })
    // ...y que no se pise con los que ya están nadando (dos peces uno encima del otro parecen uno solo)
    for (const o of this.peces) evitar.push({ x0: o.img.x - 80 * escala, x1: o.img.x + 80 * escala, y0: o.img.y - 55 * escala, y1: o.img.y + 55 * escala })

    // Entre una distancia mínima y una máxima al cuerpo (ver aparicion.js): antes caían encima del pecho del
    // paciente (se tocaban sin estirar el brazo) o donde el brazo no llega. Los dos límites suben con el
    // nivel (ver dificultad.js). Sin el tronco a la vista (la IA no lo ve) queda como siempre.
    const cuerpo = cuerpoEnPantalla(kinetixAI.ultimosLandmarks, (lm) => kinetixAI.aPantalla(lm), nivel.distMin, nivel.alcance)
    const zona = zonaAlcance({ xMin, xMax, yMin, yMax }, cuerpo)
    const { x, y } = elegirPunto(zona, cuerpo, Math.random, 40, evitar)

    // Nada de lado a lado: recorre entre 0,4 y 1 tronco. Con cuerpo, hacia afuera (así va y vuelve sin pasar
    // nunca más cerca de lo que apareció); sin cuerpo, hacia donde haya lugar.
    const tronco = cuerpo?.tronco ?? TRONCO_REF * escala
    let recorrido = Phaser.Math.FloatBetween(tronco * 0.4, tronco * 1.0)
    let dir = x + recorrido <= zona.xMax && (x - recorrido < zona.xMin || Math.random() < 0.5) ? 1 : -1
    if (cuerpo) ({ dir, recorrido } = recorridoAlejandose(x, cuerpo, zona.xMin, zona.xMax, recorrido))
    const velocidad = tronco * VELOCIDAD_TRONCOS * nivel.vel * Phaser.Math.FloatBetween(0.75, 1.25) // px/s
    const amplitud = AMPLITUD_VERTICAL * escala
    const ancho = Phaser.Math.Between(ANCHO_MIN, ANCHO_MAX) * escala * nivel.tam

    const img = this.add.image(x, y - amplitud, Phaser.Utils.Array.GetRandom(NOMBRES_PEZ))
      .setDepth(2)
      .setScale(ancho / ANCHO_TEXTURA)
      .setFlipX(dir > 0) // el dibujo mira a la izquierda: se da vuelta para mirar hacia donde nada
      .setInteractive()

    const pez = {
      id: `pez_${Date.now()}_${Phaser.Math.Between(0, 99999)}`,
      img,
      radio: ancho * 0.72, // lo que se toca crece con el pez (antes 42 px fijos con peces de 44 a 72)
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
      y: y + amplitud,
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
    // Al pasar de nivel se avisa en vez de la felicitación de siempre
    const nivelNuevo = nivelPara(this.puntos)
    const subio = nivelNuevo > this.nivel
    this.nivel = nivelNuevo
    const mensaje = subio ? `nivel${nivelNuevo + 1}` : FELICITACIONES[(this.puntos - 1) % FELICITACIONES.length]
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
        if (this.jugando) this._rellenarPeces()
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
        nivel: this.nivel + 1,
      },
    }))
  }

  _finJuego() {
    this.jugando = false
    window.dispatchEvent(new CustomEvent('kinetix:surf:fin', {
      detail: { puntos: this.puntos, duracion_segundos: DURACION_JUEGO, nivel_maximo: this.nivel + 1 },
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
