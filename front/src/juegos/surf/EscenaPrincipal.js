import Phaser from 'phaser'
import { reiniciarReaccion, objetivoAparece, objetivoTocado } from '../../ia/reaccion'
import { kinetixAI } from '../../ia/KinetixAI'
import { FELICITACIONES } from './mensajes'
import { cuerpoEnPantalla, arcoDelPez, posicionEnArco } from './aparicion'
import { nivelPara, parametrosDe } from './dificultad'
import { leerZona, radioAlAzar } from './curva'
import { leerRutina } from '../rutina'
import pecesUrl from '../../assets/juegos/surf/peces.png'

const TOPE_RONDA_S = 300   // si en 5 minutos no se atrapó la cantidad pedida, la ronda se da por terminada (que la grabación no quede andando)
const FIN_MS = 1200        // entre el último pez y la pantalla de fin: se alcanza a ver y a oír el festejo
const ESTANCADO_S = 14     // segundos sin atrapar nada → "¡No te rindas!" (los peces tardan: es un juego para adultos mayores)
const MENSAJE_MS = 3000    // cuánto se muestra cada felicitación
const APARECE_MS = 700     // el pez entra con un fundido, no de golpe

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
const AMPLITUD_VERTICAL = 6    // cuánto sube y baja cada pez (px, hacia cada lado)
const TRONCO_REF = 170         // largo de tronco (px) de un paciente en un celular en vertical, si no se lo ve
const VELOCIDAD_TRONCOS = 0.25 // troncos por segundo a velocidad 1, a lo largo de la curva
const DERIVA_MIN_MS = 2500     // una pasada de ida por la curva nunca es más rápida que esto

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
    this.cierre?.remove()
    this.ocultarMensaje?.remove()
    this._apariciones?.forEach((e) => e.remove())
    this._apariciones = []
    for (const p of this.peces) {
      this.tweens.killTweensOf(p.img)
      this.tweens.killTweensOf(p.t)
      p.img.destroy()
    }
    this.peces = []
    reiniciarReaccion()
    this.puntos = 0
    this.tiempo = 0              // segundos jugados desde el primer pez
    this.cronometrando = false   // el reloj arranca al atrapar el primer pez
    this.jugando = false
    this.mensaje = null
    this.sinAcierto = 0
    this.nivel = nivelPara(0, this.rutina) // nivel de dificultad alcanzado (0 = el más fácil, ver dificultad.js)
    this._lado = 1               // de qué lado de la curva sale el próximo pez (se va alternando)
    this._despacharEstado()
  }

  // Los peces, los recorridos y las distancias se agrandan con la pantalla (un televisor se mira de lejos y
  // es mucho más grande), pero nunca por debajo de lo de un celular en vertical.
  _escalaPantalla() {
    const { width, height } = this.scale
    return Math.min(2.2, Math.max(1, Math.min(width, height) / 400))
  }

  // Mantiene en el agua tantos peces como pide el nivel de dificultad, pero de a uno y con tiempo entre cada
  // aparición (ver `espera` y `entre` en dificultad.js: es un juego para adultos mayores y el kinesiólogo pidió
  // una cadencia mucho menor). Los que ya están programados cuentan como presentes.
  _rellenarPeces() {
    const nivel = parametrosDe(nivelPara(this.puntos, this.rutina))
    let espera = 0
    for (let n = this.peces.length + this._apariciones.length; n < nivel.pecesALaVez; n++) {
      espera += Phaser.Math.Between(...(espera === 0 ? nivel.espera : nivel.entre))
      const evento = this.time.delayedCall(espera, () => {
        this._apariciones = this._apariciones.filter((e) => e !== evento)
        if (this.jugando) this.spawnearPez()
      })
      this._apariciones.push(evento)
    }
  }

  _empezar() {
    this.rutina = leerRutina('surf') // cuántos peces atrapar y qué dificultad: lo que eligió el kinesiólogo en "Antes de empezar"
    this._resetear()
    this.zona = leerZona() // dónde aparecen los peces: el alto y el ancho que eligió el kinesiólogo en "Antes de empezar"
    this.jugando = true
    this.spawnearPez()
  }

  _arrancarCronometro() {
    this.cronometrando = true
    // El pez de la consigna ya se está reemplazando solo (ver tocarPez). Cuenta hacia arriba: la ronda termina
    // al atrapar la cantidad pedida, no por tiempo.
    this.relojTiempo = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this._descontarTiempo,
      callbackScope: this,
    })
  }

  spawnearPez() {
    const { width, height } = this.scale
    const nivel = parametrosDe(nivelPara(this.puntos, this.rutina))
    const escala = this._escalaPantalla()
    const apaisada = width > height * 1.2
    // Dónde hay cámara: con la vista "alejada" esa zona es más chica que la pantalla, y fuera de ella el
    // paciente no podría alcanzar los peces. Abajo no se limita (la curva queda sobre los hombros); arriba, por
    // debajo de los carteles.
    const cam = kinetixAI.areaVideo()
    const camAncho = cam.x1 - cam.x0
    const camAlto = cam.y1 - cam.y0
    let xMin = Math.max(30, cam.x0 + camAncho * 0.05)
    let xMax = Math.min(width - 30, cam.x1 - camAncho * 0.05)
    if (xMax - xMin < 100) { xMin = 30; xMax = width - 30 }
    const yMin = Math.max(height * (apaisada ? 0.17 : 0.19), cam.y0 + camAlto * 0.04) // apaisada: debajo de los contadores de arriba

    // La curva: un arco por encima del paciente, centrado en sus hombros (ver aparicion.js). Cada pez sale en un
    // punto al azar de la zona elegida (alto y ancho, ver curva.js), o sea a cualquier altura de esa zona. Sin el
    // tronco a la vista (la IA no lo ve) se usa el centro de la pantalla.
    const cuerpo = cuerpoEnPantalla(kinetixAI.ultimosLandmarks, (lm) => kinetixAI.aPantalla(lm))
    const centro = cuerpo ?? { x: width / 2, y: height * 0.42 }
    const tronco = cuerpo?.tronco ?? TRONCO_REF * escala
    this._lado = -this._lado
    const arco = arcoDelPez(centro, tronco, { radio: radioAlAzar(this.zona), ancho: this.zona.ancho, deriva: nivel.deriva }, { xMin, xMax, yMin }, this._lado)
    const ancho = Phaser.Math.Between(ANCHO_MIN, ANCHO_MAX) * escala * nivel.tam
    const inicio = posicionEnArco(arco, arco.a0)

    const img = this.add.image(inicio.x, inicio.y, Phaser.Utils.Array.GetRandom(NOMBRES_PEZ))
      .setDepth(2)
      .setScale(ancho / ANCHO_TEXTURA)
      .setAlpha(0)
      .setInteractive()

    // t.a: dónde va por la curva (ángulo); t.bob: el sube y baja suave. update() los pasa a x e y.
    const pez = {
      id: `pez_${Date.now()}_${Phaser.Math.Between(0, 99999)}`,
      img,
      radio: ancho * 0.72, // lo que se toca crece con el pez
      arco,
      t: { a: arco.a0, bob: 0 },
      amplitud: AMPLITUD_VERTICAL * escala,
    }
    img.on('pointerdown', () => this.tocarPez(pez))

    // Entra con un fundido
    this.tweens.add({ targets: img, alpha: 1, duration: APARECE_MS, ease: 'Sine.easeOut' })
    // Se desplaza despacio por la curva, yendo y viniendo (frena suave en cada punta)
    const largo = arco.R * Math.abs(arco.a1 - arco.a0)
    const velocidad = tronco * VELOCIDAD_TRONCOS * nivel.vel * Phaser.Math.FloatBetween(0.85, 1.15) // px/s
    this.tweens.add({
      targets: pez.t, a: arco.a1, duration: Math.max(DERIVA_MIN_MS, (largo / velocidad) * 1000),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
    // y sube y baja un poco, a otro ritmo para que no se vea sincronizado
    this.tweens.add({
      targets: pez.t, bob: pez.amplitud, duration: 1100 + Math.random() * 800,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
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
    const nivelNuevo = nivelPara(this.puntos, this.rutina)
    const subio = nivelNuevo > this.nivel
    this.nivel = nivelNuevo
    const mensaje = subio ? `nivel${nivelNuevo + 1}` : FELICITACIONES[(this.puntos - 1) % FELICITACIONES.length]
    this._mostrarMensaje(mensaje, true)

    window.dispatchEvent(new CustomEvent('kinetix:surf:punto', { detail: { mensaje } }))
    if (this.puntos >= this.rutina.repeticiones) this._cerrarRonda()

    this.tweens.killTweensOf(pez.img)
    this.tweens.killTweensOf(pez.t)
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
    if (this.tiempo >= TOPE_RONDA_S) this._finJuego()
  }

  // Se atrapó el último pez: no sale ninguno más y la pantalla de fin llega un momento después
  _cerrarRonda() {
    this.jugando = false
    this.relojTiempo?.remove()
    this._apariciones.forEach((e) => e.remove())
    this._apariciones = []
    this.cierre = this.time.delayedCall(FIN_MS, () => this._finJuego())
  }

  _despacharEstado() {
    window.dispatchEvent(new CustomEvent('kinetix:surf', {
      detail: {
        puntos: this.puntos,
        tiempo: this.tiempo,
        cronometrando: this.cronometrando,
        mensaje: this.mensaje,
        nivel: this.nivel + 1,
        meta: this.rutina?.repeticiones ?? null, // cuántos peces hay que atrapar en la ronda
      },
    }))
  }

  _finJuego() {
    this.jugando = false
    this.relojTiempo?.remove()
    window.dispatchEvent(new CustomEvent('kinetix:surf:fin', {
      detail: { puntos: this.puntos, duracion_segundos: Math.max(1, this.tiempo), nivel_maximo: this.nivel + 1, rutina: { ...this.rutina } },
    }))
  }

  update() {
    // Cada pez sigue su curva; mira hacia donde nada (el dibujo mira a la izquierda: se da vuelta yendo a la derecha)
    for (const p of this.peces) {
      const { x, y } = posicionEnArco(p.arco, p.t.a)
      if (Math.abs(x - p.img.x) > 0.02) p.img.setFlipX(x > p.img.x)
      p.img.setPosition(x, y + p.t.bob)
    }
    window.kinetixPeces = this.peces.map(p => ({
      id: p.id,
      x: p.img.x,
      y: p.img.y,
      radio: p.radio,
    }))
  }
}
