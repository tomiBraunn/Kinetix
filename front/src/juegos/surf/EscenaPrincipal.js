import Phaser from 'phaser'
import { reiniciarReaccion, objetivoAparece, objetivoTocado } from '../../ia/reaccion'

const NUM_PECES = 4
const DURACION_JUEGO = 30

// Paleta de peces — variedad de colores en vez de un solo pez repetido
const COLORES_PEZ = [0xff8a3d, 0xffc93d, 0x3ddbb8, 0xa78bfa, 0xf472b6]

const PEZ_W = 78
const PEZ_H = 46

export default class EscenaPrincipal extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaPrincipal' })
  }

  preload() {}

  create() {
    const { width, height } = this.scale

    reiniciarReaccion()
    this.peces = []
    this.puntos = 0
    this.tiempoRestante = DURACION_JUEGO
    this.instruccion = 0
    this.jugando = false

    // Fondo de mar dibujado a mano (degradé + burbujas) — sin depender de
    // ninguna imagen externa, así nunca queda en blanco.
    this._dibujarFondo(width, height)

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

  _dibujarFondo(width, height) {
    const gfx = this.add.graphics().setDepth(0)

    // Degradé vertical simulando el mar (claro arriba, más profundo abajo)
    const franjas = 24
    for (let i = 0; i < franjas; i++) {
      const t = i / (franjas - 1)
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x7fd8e8),
        Phaser.Display.Color.ValueToColor(0x2b6fb0),
        franjas - 1,
        i,
      )
      gfx.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      gfx.fillRect(0, (height / franjas) * i, width, height / franjas + 1)
    }

    // Burbujas decorativas
    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(0, width)
      const y = Phaser.Math.Between(0, height * 0.85)
      const r = Phaser.Math.Between(3, 9)
      gfx.fillStyle(0xffffff, 0.18)
      gfx.fillCircle(x, y, r)
    }
  }

  _dibujarPez(gfx, w, h, color) {
    const r = h / 2
    // Cuerpo
    gfx.fillStyle(color, 1)
    gfx.fillEllipse(0, 0, w - r, h)
    // Cola
    gfx.fillTriangle(w / 2 - r * 0.6, 0, w / 2 + r * 0.7, -h * 0.55, w / 2 + r * 0.7, h * 0.55)
    // Panza clara
    gfx.fillStyle(0xffffff, 0.35)
    gfx.fillEllipse(-r * 0.3, h * 0.12, w * 0.55, h * 0.4)
    // Ojo
    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(-w * 0.22, -h * 0.08, r * 0.22)
    gfx.fillStyle(0x1a1a2e, 1)
    gfx.fillCircle(-w * 0.2, -h * 0.08, r * 0.11)
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

    const color = Phaser.Utils.Array.GetRandom(COLORES_PEZ)
    const img = this.add.graphics().setDepth(2)
    this._dibujarPez(img, PEZ_W, PEZ_H, color)
    img.x = x
    img.y = y
    if (Math.random() > 0.5) img.scaleX = -1

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
    objetivoAparece(pez.id)
  }

  tocarPez(pez) {
    if (!this.jugando) return
    const idx = this.peces.indexOf(pez)
    if (idx === -1) return

    this.peces.splice(idx, 1)
    this.puntos++
    objetivoTocado(pez.id)

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
    window.dispatchEvent(new CustomEvent('kinetix:surf:fin', {
      detail: { puntos: this.puntos, duracion_segundos: DURACION_JUEGO },
    }))
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
