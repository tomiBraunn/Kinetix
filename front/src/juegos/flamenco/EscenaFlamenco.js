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
    this.timerActual = 0
    this.mejorTiempo = 0
    this.intentos = 0
    this.tiempoRestante = DURACION_JUEGO
    this.jugando = true

    this._crearUI(width, height)
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

    // Tecla L = simula que la IA detectó pierna levantada/bajada (para testing)
    this.input.keyboard.on('keydown-L', () => {
      if (this.piernaArriba) this._piernaBajada()
      else this._piernaLevantada()
    })

    // Contrato con la IA: llama a estas funciones cuando detecta el movimiento
    window.kinetix = window.kinetix || {}
    window.kinetix.onPiernaLevantada = () => this._piernaLevantada()
    window.kinetix.onPiernaBajada = () => this._piernaBajada()
  }

  _crearUI(width, height) {
    const estiloBase = {
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }

    this.textoSesion = this.add
      .text(width - 20, 20, 'Sesión: 1:00', estiloBase)
      .setOrigin(1, 0)

    this.textoIntentos = this.add.text(20, 20, 'Intentos: 0', estiloBase)

    this.add
      .text(width / 2, height * 0.14, 'TIEMPO EN EQUILIBRIO', {
        fontSize: '16px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 3,
        letterSpacing: 3,
      })
      .setOrigin(0.5)

    this.textoTimer = this.add
      .text(width / 2, height * 0.24, '0.0s', {
        fontSize: '72px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)

    this.textoBest = this.add
      .text(width / 2, height * 0.42, 'Mejor: 0.0s', {
        fontSize: '26px',
        color: '#ffdd44',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)

    this.textoEstado = this.add
      .text(width / 2, height * 0.52, '¡Levantá la pierna! [L]', {
        fontSize: '26px',
        color: '#ff88aa',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
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
    const r = 55

    if (activo) {
      this.indicadorGfx.fillStyle(0xff5faa, 0.25)
      this.indicadorGfx.fillCircle(cx, cy, r + 24)
      this.indicadorGfx.fillStyle(0xff5faa, 1)
      this.indicadorGfx.fillCircle(cx, cy, r)
      // Silueta de pierna levantada
      this.indicadorGfx.fillStyle(0xffffff, 1)
      this.indicadorGfx.fillRoundedRect(cx - 10, cy - 34, 20, 50, 8)
      this.indicadorGfx.fillRoundedRect(cx - 18, cy - 6, 36, 12, 5)
    } else {
      this.indicadorGfx.fillStyle(0x333344, 0.8)
      this.indicadorGfx.fillCircle(cx, cy, r)
      // Silueta de pierna abajo
      this.indicadorGfx.fillStyle(0x888899, 1)
      this.indicadorGfx.fillRoundedRect(cx - 16, cy - 10, 32, 18, 6)
    }
  }

  _piernaLevantada() {
    if (!this.jugando || this.piernaArriba) return
    this.piernaArriba = true
    this.intentos++
    this.textoIntentos.setText(`Intentos: ${this.intentos}`)
    this.textoEstado.setText('¡Mantené el equilibrio!')
    this.textoEstado.setColor('#44ff88')
    this._dibujarIndicador(true)

    this.tweens.add({
      targets: this.indicadorGfx,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  _piernaBajada() {
    if (!this.jugando || !this.piernaArriba) return
    this.piernaArriba = false

    if (this.timerActual > this.mejorTiempo) {
      this.mejorTiempo = this.timerActual
      this.textoBest.setText(`Mejor: ${this.mejorTiempo.toFixed(1)}s`)
    }

    this.timerActual = 0
    this.textoTimer.setText('0.0s')
    this.textoEstado.setText('¡Levantá la pierna! [L]')
    this.textoEstado.setColor('#ff88aa')
    this.tweens.killTweensOf(this.indicadorGfx)
    this.indicadorGfx.setScale(1)
    this._dibujarIndicador(false)
  }

  _actualizarTimer() {
    if (!this.jugando || !this.piernaArriba) return
    this.timerActual = parseFloat((this.timerActual + 0.1).toFixed(1))
    this.textoTimer.setText(`${this.timerActual.toFixed(1)}s`)
  }

  _descontarTiempo() {
    this.tiempoRestante--
    const min = Math.floor(this.tiempoRestante / 60)
    const seg = this.tiempoRestante % 60
    this.textoSesion.setText(`Sesión: ${min}:${seg.toString().padStart(2, '0')}`)
    if (this.tiempoRestante <= 0) this._finJuego()
  }

  _finJuego() {
    this.jugando = false
    if (this.piernaArriba && this.timerActual > this.mejorTiempo) {
      this.mejorTiempo = this.timerActual
    }
    const { width, height } = this.scale

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.65)
    overlay.fillRect(0, 0, width, height)

    this.add
      .text(width / 2, height / 2 - 70, '¡Tiempo!', {
        fontSize: '56px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height / 2, `Mejor tiempo: ${this.mejorTiempo.toFixed(1)}s`, {
        fontSize: '34px',
        color: '#ffdd44',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height / 2 + 56, `Intentos: ${this.intentos}`, {
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
  }

  update() {
    window.kinetixFlamenco = {
      piernaArriba: this.piernaArriba,
      timerActual: this.timerActual,
      mejorTiempo: this.mejorTiempo,
      intentos: this.intentos,
    }
  }
}
