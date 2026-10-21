// Dibuja la consigna y las pastillas del juego en un canvas aparte. El grabador
// (useSessionRecorder) lo pone arriba de la cámara para el video de "gameplay":
// el resto de la pantalla es HTML y no se puede capturar a un video.
const AZUL = '#0f1387'
const GRIS = '#444748'

function rectRedondeado(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) // Safari < 16 no tiene roundRect
}

function envolver(ctx, texto, anchoMax) {
  const lineas = []
  let actual = ''
  for (const palabra of texto.split(' ')) {
    const prueba = actual ? `${actual} ${palabra}` : palabra
    if (actual && ctx.measureText(prueba).width > anchoMax) { lineas.push(actual); actual = palabra } else actual = prueba
  }
  if (actual) lineas.push(actual)
  return lineas
}

const mmss = (seg) => `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`

/**
 * @param canvas    el canvas a dibujar (se limpia entero)
 * @param consigna  texto del banner, o null
 * @param tiempo    segundos sostenidos para la pastilla de tiempo, o null para ocultarla
 * @param etiqueta  rótulo de la pastilla de tiempo ('Tiempo:', o 'Faltan:' cuando cuenta hacia atrás)
 * @param progreso  texto de la pastilla de arriba a la derecha, o null
 */
export function dibujarHud(canvas, { consigna, tiempo, etiqueta = 'Tiempo:', progreso }) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  ctx.clearRect(0, 0, w, canvas.height)
  ctx.textBaseline = 'middle'

  if (tiempo != null) {
    rectRedondeado(ctx, 18, 19, 126, 29, 10)
    ctx.fillStyle = 'rgba(228,226,235,0.71)'
    ctx.fill()
    ctx.strokeStyle = '#e3e3e3'
    ctx.stroke()
    ctx.fillStyle = GRIS
    ctx.font = "700 12px 'DM Sans', sans-serif"
    ctx.fillText(etiqueta, 44, 34)
    ctx.font = "900 12px 'DM Sans', sans-serif"
    ctx.fillText(mmss(tiempo), 95, 34)
  }

  if (progreso) {
    rectRedondeado(ctx, w - 18 - 204, 17, 204, 36, 18)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.fillStyle = AZUL
    ctx.font = "700 16px 'DM Sans', sans-serif"
    ctx.fillText(progreso, w - 18 - 204 + 12, 35)
  }

  if (consigna) {
    const ancho = Math.min(350, w - 52)
    const x = (w - ancho) / 2
    rectRedondeado(ctx, x, 84, ancho, 67, 22)
    ctx.fillStyle = '#fffbfb'
    ctx.fill()
    ctx.strokeStyle = '#2b319c'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.lineWidth = 1
    ctx.fillStyle = AZUL
    ctx.font = "700 18px 'DM Sans', sans-serif"
    ctx.textAlign = 'center'
    const lineas = envolver(ctx, consigna, ancho - 36)
    lineas.forEach((linea, i) => ctx.fillText(linea, w / 2, 84 + 33.5 + (i - (lineas.length - 1) / 2) * 22))
    ctx.textAlign = 'left'
  }
}
