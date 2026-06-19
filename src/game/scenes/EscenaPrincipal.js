import Phaser from 'phaser'

export default class EscenaPrincipal extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaPrincipal' })
  }

  preload() {}

  create() {
    const { width, height } = this.scale

    // Fondo provisional — en el paso siguiente va la imagen del mar
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a6b8a)

    this.add.text(width / 2, height / 2 - 20, 'Juego de Surf', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 40, 'Phaser funcionando', {
      fontSize: '22px',
      color: '#a0d8ef',
    }).setOrigin(0.5)
  }

  update() {}
}
