import Phaser from 'phaser'

const NUM_PECES = 5
const RADIO_PEZ = 35
const DURACION_JUEGO = 60

export default class EscenaPrincipal extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaPrincipal' })
  }

  preload() {}

  create() {
    const { width, height } = this.scale

    this.peces = []
    this.puntos = 0
    this.tiempoRestante = DURACION_JUEGO
    this.jugando = true

    this._crearUI(width)

    for (let i = 0; i < NUM_PECES; i++) {
      this.spawnearPez()
    }

    this.time.addEvent({
      delay: 1000,
      repeat: DURACION_JUEGO - 1,
      callback: this._descontarTiempo,
      callbackScope: this,
    })

    // Tecla T = simula que la IA detectó un toque (para testing)
    this.input.keyboard.on('keydown-T', () => {
      if (this.peces.length > 0) this.tocarPez(this.peces[0])
    })

    // Contrato con la IA: Micaela llama a esta función cuando detecta un toque
    window.kinetix = window.kinetix || {}
    window.kinetix.onStickerTocado = (id) => {
      const pez = this.peces.find(p => p.id === id)
      if (pez) this.tocarPez(pez)
    }
  }

  _crearUI(width) {
    const estilo = {
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }
    this.textoPuntos = this.add.text(20, 20, 'Puntos: 0', estilo)
    this.textoTiempo = this.add.text(width - 20, 20, '1:00', estilo).setOrigin(1, 0)
  }

  spawnearPez() {
    const { width, height } = this.scale
    const margen = 80
    const x = Phaser.Math.Between(margen, width - margen)
    const y = Phaser.Math.Between(height * 0.48, height * 0.85)

    const gfx = this.add.graphics()
    this._dibujarPez(gfx)
    gfx.x = x
    gfx.y = y

    const pez = {
      id: `pez_${Date.now()}_${Phaser.Math.Between(0, 99999)}`,
      gfx,
      x,
      y,
      radio: RADIO_PEZ,
    }

    gfx.setInteractive(new Phaser.Geom.Circle(0, 0, RADIO_PEZ), Phaser.Geom.Circle.Contains)
    gfx.on('pointerdown', () => this.tocarPez(pez))

    // Animación de flotación suave
    this.tweens.add({
      targets: gfx,
      y: y - 12,
      duration: 900 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.peces.push(pez)
  }

  _dibujarPez(gfx) {
    // Cola
    gfx.fillStyle(0xff8800)
    gfx.fillTriangle(-RADIO_PEZ, 0, -RADIO_PEZ - 22, -16, -RADIO_PEZ - 22, 16)
    // Cuerpo
    gfx.fillStyle(0xffcc00)
    gfx.fillCircle(0, 0, RADIO_PEZ)
    // Ojo
    gfx.fillStyle(0x000000)
    gfx.fillCircle(RADIO_PEZ * 0.45, -RADIO_PEZ * 0.2, 5)
  }

  tocarPez(pez) {
    if (!this.jugando) return
    const idx = this.peces.indexOf(pez)
    if (idx === -1) return

    this.peces.splice(idx, 1)
    this.puntos++
    this.textoPuntos.setText(`Puntos: ${this.puntos}`)

    this.tweens.killTweensOf(pez.gfx)
    this.tweens.add({
      targets: pez.gfx,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        pez.gfx.destroy()
        if (this.jugando) this.spawnearPez()
      },
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
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(0, 0, width, height)

    this.add.text(width / 2, height / 2 - 40, '¡Tiempo!', {
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 30, `Peces atrapados: ${this.puntos}`, {
      fontSize: '32px',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)
  }

  update() {
    // Publica las posiciones actuales para que la IA detecte los toques
    window.kinetixPeces = this.peces.map(p => ({
      id: p.id,
      x: p.gfx.x,
      y: p.gfx.y,
      radio: p.radio,
    }))
  }
}
