import Phaser from 'phaser'

const NUM_PECES = 4
const DURACION_JUEGO = 60

const FONDO_URL = 'https://www.figma.com/api/mcp/asset/548027f9-9c0e-4e7d-ac2b-022b57cbd07f'

const PECES = [
  { key: 'pez_naranja_a', url: 'https://www.figma.com/api/mcp/asset/1e7ef848-2887-4608-80d8-2a1ac677d64b' },
  { key: 'pez_naranja_b', url: 'https://www.figma.com/api/mcp/asset/585ea7c5-6005-473e-8c40-be438a845530' },
  { key: 'pez_naranja_c', url: 'https://www.figma.com/api/mcp/asset/d7b216fa-668e-4acc-89ba-3e587e6ee9c9' },
  { key: 'pez_amarillo_a', url: 'https://www.figma.com/api/mcp/asset/28122d2c-d056-4174-9b84-485b615c3c50' },
  { key: 'pez_amarillo_b', url: 'https://www.figma.com/api/mcp/asset/7847b9f0-32f1-45ce-8e58-a501fbe33620' },
  { key: 'pez_verde_a', url: 'https://www.figma.com/api/mcp/asset/98932ba1-61ed-4685-b6d8-e39eb80eaf24' },
  { key: 'pez_verde_b', url: 'https://www.figma.com/api/mcp/asset/8ccddf20-b85a-497d-8373-06ecb7216082' },
  { key: 'pez_violeta_a', url: 'https://www.figma.com/api/mcp/asset/6983cd16-a2c5-4a85-8aa8-310c43d9e721' },
  { key: 'pez_violeta_b', url: 'https://www.figma.com/api/mcp/asset/cba3b645-2b16-4ad5-a184-94da77229871' },
  { key: 'pez_violeta_c', url: 'https://www.figma.com/api/mcp/asset/aef3a872-c56f-4452-9fc7-1e34caa404cd' },
]

const PEZ_W = 90
const PEZ_H = 75

export default class EscenaPrincipal extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaPrincipal' })
  }

  preload() {
    this.load.image('fondo_surf', FONDO_URL)
    PECES.forEach(p => this.load.image({ key: p.key, url: p.url }))
  }

  create() {
    const { width, height } = this.scale

    this.peces = []
    this.puntos = 0
    this.tiempoRestante = DURACION_JUEGO
    this.instruccion = 0
    this.jugando = false

    // Fondo ilustrado cubre todo el canvas
    this.add.image(width / 2, height / 2, 'fondo_surf')
      .setDisplaySize(width, height)
      .setDepth(0)

    // Tabla de surf encima del fondo
    this._dibujarTabla(width, height)

    // Countdown 3-2-1 y luego inicia
    this._countdown(width, height)

    // Contrato con la IA
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
  }

  _dibujarTabla(width, height) {
    const gfx = this.add.graphics().setDepth(1)
    const bx = width / 2
    const by = height * 0.93
    gfx.fillStyle(0xe8d8a8)
    gfx.fillEllipse(bx, by, 230, 52)
    gfx.fillStyle(0x5dd8d0)
    gfx.fillEllipse(bx, by, 190, 32)
    gfx.lineStyle(3, 0xc8a830)
    gfx.strokeEllipse(bx, by, 230, 52)
  }

  _countdown(width, height) {
    const overlay = this.add.graphics().setDepth(10)
    overlay.fillStyle(0x000000, 0.3)
    overlay.fillRect(0, 0, width, height)

    const txt = this.add.text(width / 2, height / 2, '3', {
      fontSize: '130px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 10,
    }).setOrigin(0.5).setDepth(11)

    ;['3', '2', '1', '¡Ya!'].forEach((n, i) => {
      this.time.delayedCall(i * 1000, () => {
        txt.setText(n)
        this.tweens.add({
          targets: txt,
          scale: { from: 1.4, to: 1 },
          duration: 380,
          ease: 'Bounce.easeOut',
        })
      })
    })

    // A los 3.5s destruye el overlay e inicia el juego
    this.time.delayedCall(3500, () => {
      this.tweens.add({
        targets: [txt, overlay],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          txt.destroy()
          overlay.destroy()
          this._iniciarJuego()
        },
      })
    })
  }

  _iniciarJuego() {
    this.jugando = true

    for (let i = 0; i < NUM_PECES; i++) {
      this.spawnearPez()
    }

    this.time.addEvent({
      delay: 1000,
      repeat: DURACION_JUEGO - 1,
      callback: this._descontarTiempo,
      callbackScope: this,
    })

    this._despacharEstado()

    // Fases de instrucción para el HUD de React
    this.time.delayedCall(4000, () => { this.instruccion = 1; this._despacharEstado() })
    this.time.delayedCall(9000, () => { this.instruccion = 2; this._despacharEstado() })

    // Tecla T = simula toque de IA (testing)
    this.input.keyboard.on('keydown-T', () => {
      if (this.peces.length > 0) this.tocarPez(this.peces[0])
    })
  }

  spawnearPez() {
    const { width, height } = this.scale
    const margen = 90
    const x = Phaser.Math.Between(margen, width - margen)
    const y = Phaser.Math.Between(height * 0.1, height * 0.68)

    const config = Phaser.Utils.Array.GetRandom(PECES)
    const img = this.add.image(x, y, config.key)
    img.setDisplaySize(PEZ_W, PEZ_H)
    img.setDepth(2)
    if (Math.random() > 0.5) img.setFlipX(true)

    // Hitbox explícito en coordenadas locales (origen al centro)
    img.setInteractive(
      new Phaser.Geom.Rectangle(-PEZ_W / 2, -PEZ_H / 2, PEZ_W, PEZ_H),
      Phaser.Geom.Rectangle.Contains,
    )

    const pez = {
      id: `pez_${Date.now()}_${Phaser.Math.Between(0, 99999)}`,
      img,
      radio: 42,
    }

    img.on('pointerdown', () => this.tocarPez(pez))

    this.tweens.add({
      targets: img,
      y: y - 14,
      duration: 850 + Math.random() * 450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.peces.push(pez)
  }

  tocarPez(pez) {
    if (!this.jugando) return
    const idx = this.peces.indexOf(pez)
    if (idx === -1) return

    this.peces.splice(idx, 1)
    this.puntos++

    window.dispatchEvent(new CustomEvent('kinetix:surf:punto'))
    this._despacharEstado()

    if (this.instruccion < 2) {
      this.instruccion = 2
      this._despacharEstado()
    }

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

  _descontarTiempo() {
    this.tiempoRestante--
    this._despacharEstado()
    if (this.tiempoRestante <= 0) this._finJuego()
  }

  _despacharEstado() {
    window.dispatchEvent(new CustomEvent('kinetix:surf', {
      detail: {
        puntos: this.puntos,
        tiempoRestante: this.tiempoRestante,
        instruccionActual: this.instruccion,
      },
    }))
  }

  _finJuego() {
    this.jugando = false
    const { width, height } = this.scale

    const overlay = this.add.graphics().setDepth(20)
    overlay.fillStyle(0x000000, 0.62)
    overlay.fillRect(0, 0, width, height)

    this.add.text(width / 2, height / 2 - 40, '¡Tiempo!', {
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(21)

    this.add.text(width / 2, height / 2 + 30, `Peces atrapados: ${this.puntos}`, {
      fontSize: '32px',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(21)
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
