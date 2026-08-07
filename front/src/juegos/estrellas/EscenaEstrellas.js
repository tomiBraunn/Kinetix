import Phaser from 'phaser'

const NUM_ESTRELLAS = 3
const RADIO_ESTRELLA = 40
const DURACION_JUEGO = 60

export default class EscenaEstrellas extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaEstrellas' })
  }

  preload() {}

  create() {
    const { width, height } = this.scale

    this.estrellas = []
    this.puntos = 0
    this.equilibrioRoto = 0
    this.tiempoRestante = DURACION_JUEGO
    this.jugando = true

    this._crearUI(width)

    for (let i = 0; i < NUM_ESTRELLAS; i++) {
      this.spawnearEstrella()
    }

    this.time.addEvent({
      delay: 1000,
      repeat: DURACION_JUEGO - 1,
      callback: this._descontarTiempo,
      callbackScope: this,
    })

    // Tecla S = simula que la IA detectó un toque de mano (para testing)
    this.input.keyboard.on('keydown-S', () => {
      if (this.estrellas.length > 0) this.tocarEstrella(this.estrellas[0])
    })

    // Tecla M = simula que la IA detectó movimiento de pies (para testing)
    this.input.keyboard.on('keydown-M', () => {
      this._registrarMovimiento()
    })

    // Contrato con la IA
    window.kinetix = window.kinetix || {}
    window.kinetix.onStickerTocado = (id) => {
      const estrella = this.estrellas.find(e => e.id === id)
      if (estrella) this.tocarEstrella(estrella)
    }
    window.kinetix.onEquilibrioRoto = () => this._registrarMovimiento()
  }

  _crearUI(width) {
    const estilo = {
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }
    this.textoPuntos = this.add.text(20, 20, 'Estrellas: 0', estilo)
    this.textoTiempo = this.add.text(width - 20, 20, '1:00', estilo).setOrigin(1, 0)
    this.textoMovimiento = this.add
      .text(width / 2, 20, 'Movimientos: 0', {
        fontSize: '22px',
        color: '#ff8844',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
  }

  spawnearEstrella() {
    const { width, height } = this.scale
    const margen = 100
    const x = Phaser.Math.Between(margen, width - margen)
    const y = Phaser.Math.Between(height * 0.15, height * 0.82)

    const gfx = this.add.graphics()
    this._dibujarEstrella(gfx)
    gfx.x = x
    gfx.y = y

    const estrella = {
      id: `estrella_${Date.now()}_${Phaser.Math.Between(0, 99999)}`,
      gfx,
      x,
      y,
      radio: RADIO_ESTRELLA,
    }

    gfx.setInteractive(
      new Phaser.Geom.Circle(0, 0, RADIO_ESTRELLA),
      Phaser.Geom.Circle.Contains,
    )
    gfx.on('pointerdown', () => this.tocarEstrella(estrella))

    // Pulso suave
    this.tweens.add({
      targets: gfx,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 800 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.estrellas.push(estrella)
  }

  _dibujarEstrella(gfx) {
    const outerR = RADIO_ESTRELLA
    const innerR = RADIO_ESTRELLA * 0.42
    const puntas = 5

    // Halo exterior
    gfx.fillStyle(0xffdd44, 0.18)
    gfx.fillCircle(0, 0, outerR + 14)

    // Estrella
    const pts = []
    for (let i = 0; i < puntas * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR
      const angle = (i * Math.PI) / puntas - Math.PI / 2
      pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r })
    }
    gfx.fillStyle(0xffdd44, 1)
    gfx.fillPoints(pts, true)

    // Centro blanco
    gfx.fillStyle(0xffffff, 0.6)
    gfx.fillCircle(0, 0, innerR * 0.7)
  }

  tocarEstrella(estrella) {
    if (!this.jugando) return
    const idx = this.estrellas.indexOf(estrella)
    if (idx === -1) return

    this.estrellas.splice(idx, 1)
    this.puntos++
    this.textoPuntos.setText(`Estrellas: ${this.puntos}`)

    this.tweens.killTweensOf(estrella.gfx)
    this.tweens.add({
      targets: estrella.gfx,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 220,
      onComplete: () => {
        estrella.gfx.destroy()
        if (this.jugando) this.spawnearEstrella()
      },
    })
  }

  _registrarMovimiento() {
    if (!this.jugando) return
    this.equilibrioRoto++
    this.textoMovimiento.setText(`Movimientos: ${this.equilibrioRoto}`)

    // Parpadeo de aviso
    this.tweens.add({
      targets: this.textoMovimiento,
      alpha: 0,
      duration: 150,
      yoyo: true,
      repeat: 2,
    })
  }

  _descontarTiempo() {
    this.tiempoRestante--
    const min = Math.floor(this.tiempoRestante / 60)
    const seg = this.tiempoRestante % 60
    this.textoTiempo.setText(`${min}:${seg.toString().padStart(2, '0')}`)
    if (this.tiempoRestante <= 0) this._finJuego()
  }

  _finJuego() {
    this.jugando = false
    const { width, height } = this.scale

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.62)
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
      .text(width / 2, height / 2, `Estrellas alcanzadas: ${this.puntos}`, {
        fontSize: '32px',
        color: '#ffdd44',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height / 2 + 56, `Movimientos de pies: ${this.equilibrioRoto}`, {
        fontSize: '26px',
        color: '#ff8844',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
  }

  update() {
    window.kinetixEstrellas = this.estrellas.map(e => ({
      id: e.id,
      x: e.gfx.x,
      y: e.gfx.y,
      radio: e.radio,
    }))
  }
}
