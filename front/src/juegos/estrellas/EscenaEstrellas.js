import Phaser from 'phaser'

const NUM_ESTRELLAS  = 3
const DURACION_JUEGO = 60

export default class EscenaEstrellas extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaEstrellas' })
  }

  preload() {}

  create() {
    const { width, height } = this.scale

    // Radio más grande en portrait (pantalla angosta → objetos más grandes)
    this.radio = width < 600 ? 58 : 42

    this.estrellas      = []
    this.puntos         = 0
    this.equilibrioRoto = 0
    this.tiempoRestante = DURACION_JUEGO
    this.jugando        = true

    for (let i = 0; i < NUM_ESTRELLAS; i++) {
      this.spawnearEstrella()
    }

    this.time.addEvent({
      delay: 1000,
      repeat: DURACION_JUEGO - 1,
      callback: this._descontarTiempo,
      callbackScope: this,
    })

    // Tecla S = simula toque de mano (testing sin cámara)
    this.input.keyboard.on('keydown-S', () => {
      if (this.estrellas.length > 0) this.tocarEstrella(this.estrellas[0])
    })

    // Tecla M = simula movimiento de pies (testing)
    this.input.keyboard.on('keydown-M', () => this._registrarMovimiento())

    window.kinetix = window.kinetix || {}
    window.kinetix.onStickerTocado  = (id) => {
      const est = this.estrellas.find(e => e.id === id)
      if (est) this.tocarEstrella(est)
    }
    window.kinetix.onEquilibrioRoto = () => this._registrarMovimiento()
    window.kinetix.pausar           = () => { this.jugando = false }
    window.kinetix.reanudar         = () => { this.jugando = true }
  }

  _dispatch() {
    window.dispatchEvent(new CustomEvent('kinetix:estrellas', {
      detail: {
        puntos:         this.puntos,
        tiempoRestante: this.tiempoRestante,
        movimientos:    this.equilibrioRoto,
      },
    }))
  }

  spawnearEstrella() {
    const { width, height } = this.scale
    const isPortrait = height > width

    // En portrait las estrellas van en la zona alcanzable con los brazos (parte alta/media)
    const margen = isPortrait ? 72 : 100
    const yMin   = isPortrait ? height * 0.13 : height * 0.15
    const yMax   = isPortrait ? height * 0.72 : height * 0.82

    const x = Phaser.Math.Between(margen, width - margen)
    const y = Phaser.Math.Between(yMin, yMax)

    const gfx = this.add.graphics()
    this._dibujarEstrella(gfx, this.radio)
    gfx.x = x
    gfx.y = y

    const estrella = {
      id: `est_${Date.now()}_${Phaser.Math.Between(0, 99999)}`,
      gfx,
      x,
      y,
      radio: this.radio,
    }

    gfx.setInteractive(
      new Phaser.Geom.Circle(0, 0, this.radio),
      Phaser.Geom.Circle.Contains,
    )
    gfx.on('pointerdown', () => this.tocarEstrella(estrella))

    this.tweens.add({
      targets:  gfx,
      scaleX:   1.14,
      scaleY:   1.14,
      duration: 750 + Math.random() * 450,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    })

    this.estrellas.push(estrella)
  }

  _dibujarEstrella(gfx, r) {
    const innerR = r * 0.42
    const puntas = 5

    // Halo exterior
    gfx.fillStyle(0xffdd44, 0.20)
    gfx.fillCircle(0, 0, r + 18)

    // Cuerpo estrella
    const pts = []
    for (let i = 0; i < puntas * 2; i++) {
      const radio = i % 2 === 0 ? r : innerR
      const angle = (i * Math.PI) / puntas - Math.PI / 2
      pts.push({ x: Math.cos(angle) * radio, y: Math.sin(angle) * radio })
    }
    gfx.fillStyle(0xffdd44, 1)
    gfx.fillPoints(pts, true)

    // Centro blanco
    gfx.fillStyle(0xffffff, 0.65)
    gfx.fillCircle(0, 0, innerR * 0.7)
  }

  tocarEstrella(estrella) {
    if (!this.jugando) return
    const idx = this.estrellas.indexOf(estrella)
    if (idx === -1) return

    this.estrellas.splice(idx, 1)
    this.puntos++

    window.dispatchEvent(new CustomEvent('kinetix:estrellas:punto'))
    this._dispatch()

    this.tweens.killTweensOf(estrella.gfx)
    this.tweens.add({
      targets:  estrella.gfx,
      scaleX:   2.2,
      scaleY:   2.2,
      alpha:    0,
      duration: 200,
      onComplete: () => {
        estrella.gfx.destroy()
        if (this.jugando) this.spawnearEstrella()
      },
    })
  }

  _registrarMovimiento() {
    if (!this.jugando) return
    this.equilibrioRoto++
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
    window.dispatchEvent(new CustomEvent('kinetix:estrellas:fin', {
      detail: {
        estrellas_alcanzadas: this.puntos,
        movimientos_pies:     this.equilibrioRoto,
        duracion_segundos:    DURACION_JUEGO,
      },
    }))

    const { width, height } = this.scale
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.68)
    overlay.fillRect(0, 0, width, height)

    this.add.text(width / 2, height / 2 - 80, '¡Tiempo!', {
      fontSize: '56px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2, `⭐ ${this.puntos} estrellas`, {
      fontSize: '38px', color: '#ffdd44',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 62, `Movimientos: ${this.equilibrioRoto}`, {
      fontSize: '26px', color: '#ff8844',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)
  }

  update() {
    // Expone posiciones para que KinetixAI pueda comparar con las muñecas
    window.kinetixEstrellas = this.estrellas.map(e => ({
      id:    e.id,
      x:     e.gfx.x,
      y:     e.gfx.y,
      radio: e.radio,
    }))
  }
}
