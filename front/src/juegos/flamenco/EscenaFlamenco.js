import Phaser from 'phaser'

const DURACION_JUEGO = 60

export default class EscenaFlamenco extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaFlamenco' })
  }

  preload() {}

  create() {
    const { width, height } = this.scale

    this.piernaArriba = false
    this.timerActual  = 0
    this.mejorTiempo  = 0
    this.intentos     = 0
    this.tiempoRestante = DURACION_JUEGO
    this.jugando = true

    this._crearIndicador(width, height)

    this.time.addEvent({
      delay: 1000,
      repeat: DURACION_JUEGO - 1,
      callback: this._descontarTiempo,
      callbackScope: this,
    })

    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: this._actualizarTimer,
      callbackScope: this,
    })

    // Tecla L = simula pierna levantada/bajada (testing sin cámara)
    this.input.keyboard.on('keydown-L', () => {
      if (this.piernaArriba) this._piernaBajada()
      else this._piernaLevantada()
    })

    window.kinetix = window.kinetix || {}
    window.kinetix.onPiernaLevantada = () => this._piernaLevantada()
    window.kinetix.onPiernaBajada    = () => this._piernaBajada()
    window.kinetix.pausar   = () => { this.jugando = false }
    window.kinetix.reanudar = () => { this.jugando = true }
  }

  _crearIndicador(width, height) {
    this.indicadorGfx = this.add.graphics()
    this._dibujarIndicador(false)
  }

  _dibujarIndicador(activo) {
    this.indicadorGfx.clear()
    const { width, height } = this.scale
    const cx = width / 2
    const cy = height * 0.75
    const r  = 60

    if (activo) {
      this.indicadorGfx.fillStyle(0xff5faa, 0.18)
      this.indicadorGfx.fillCircle(cx, cy, r + 32)
      this.indicadorGfx.fillStyle(0xff5faa, 0.38)
      this.indicadorGfx.fillCircle(cx, cy, r + 16)
      this.indicadorGfx.fillStyle(0xff5faa, 1)
      this.indicadorGfx.fillCircle(cx, cy, r)
      // silueta pierna levantada
      this.indicadorGfx.fillStyle(0xffffff, 1)
      this.indicadorGfx.fillRoundedRect(cx - 11, cy - 40, 22, 56, 8)
      this.indicadorGfx.fillRoundedRect(cx - 22, cy - 8, 44, 14, 5)
    } else {
      this.indicadorGfx.fillStyle(0x334455, 0.7)
      this.indicadorGfx.fillCircle(cx, cy, r)
      // silueta pierna abajo
      this.indicadorGfx.fillStyle(0x7788aa, 1)
      this.indicadorGfx.fillRoundedRect(cx - 18, cy - 12, 36, 22, 6)
    }
  }

  _dispatch() {
    window.dispatchEvent(new CustomEvent('kinetix:flamenco', {
      detail: {
        tiempoRestante: this.tiempoRestante,
        timerActual:    this.timerActual,
        mejorTiempo:    this.mejorTiempo,
        intentos:       this.intentos,
        piernaArriba:   this.piernaArriba,
      },
    }))
  }

  _piernaLevantada() {
    if (!this.jugando || this.piernaArriba) return
    this.piernaArriba = true
    this.intentos++
    this._dibujarIndicador(true)
    this.tweens.add({
      targets:  this.indicadorGfx,
      scaleX:   1.1,
      scaleY:   1.1,
      duration: 600,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    })
    window.dispatchEvent(new CustomEvent('kinetix:flamenco:pierna', { detail: { levantada: true } }))
    this._dispatch()
  }

  _piernaBajada() {
    if (!this.jugando || !this.piernaArriba) return
    this.piernaArriba = false
    if (this.timerActual > this.mejorTiempo) this.mejorTiempo = this.timerActual
    this.timerActual = 0
    this.tweens.killTweensOf(this.indicadorGfx)
    this.indicadorGfx.setScale(1)
    this._dibujarIndicador(false)
    window.dispatchEvent(new CustomEvent('kinetix:flamenco:pierna', { detail: { levantada: false } }))
    this._dispatch()
  }

  _actualizarTimer() {
    if (!this.jugando || !this.piernaArriba) return
    this.timerActual = parseFloat((this.timerActual + 0.1).toFixed(1))
    this._dispatch()
  }

  _descontarTiempo() {
    if (!this.jugando) return
    this.tiempoRestante--
    this._dispatch()
    if (this.tiempoRestante <= 0) this._finJuego()
  }

  _finJuego() {
    this.jugando = false
    if (this.piernaArriba && this.timerActual > this.mejorTiempo) {
      this.mejorTiempo = this.timerActual
    }
    window.dispatchEvent(new CustomEvent('kinetix:flamenco:fin', {
      detail: {
        mejor_tiempo_segundos: parseFloat(this.mejorTiempo.toFixed(1)),
        intentos:              this.intentos,
        duracion_segundos:     DURACION_JUEGO,
      },
    }))

    const { width, height } = this.scale
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.68)
    overlay.fillRect(0, 0, width, height)

    this.add.text(width / 2, height / 2 - 70, '¡Tiempo!', {
      fontSize: '56px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2, `Mejor: ${this.mejorTiempo.toFixed(1)}s`, {
      fontSize: '38px', color: '#ffdd44',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 58, `Intentos: ${this.intentos}`, {
      fontSize: '28px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)
  }

  update() {}
}
