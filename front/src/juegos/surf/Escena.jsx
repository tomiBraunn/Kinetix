// Fondo del Surf en capas (cielo, nubes, olas y tabla) para poder animarlas por
// separado. Las capas salen de la imagen original del fondo, separada con un script
// (cielo sin nubes, mar con sus crestas y cada nube suelta), así que apiladas
// quedan igual que el diseño. La animación está en escena.css.
import { useEffect, useRef } from 'react'
import './escena.css'
import cielo from '../../assets/juegos/surf/capas/cielo.webp'
import olas from '../../assets/juegos/surf/capas/olas.webp'
import tabla from '../../assets/juegos/surf/tabla.png'

const nubesUrl = import.meta.glob('../../assets/juegos/surf/capas/nube-*.webp', { eager: true, query: '?url', import: 'default' })
const urlNube = (nombre) => nubesUrl[`../../assets/juegos/surf/capas/${nombre}`]

// Medidas de la imagen original (px) y posición de cada capa dentro de ella
const IMG_W = 941
const IMG_H = 1672
const MAR_Y = 874      // fila donde empieza la capa de olas (las crestas suben un poco sobre el horizonte)
const TIRAS = 48       // cuántas franjas horizontales forman el mar para que ondule

// borde: la nube está cortada por ese borde de la imagen (solo puede moverse hacia afuera)
const NUBES = [
  { src: 'nube-1.webp', x: 0,   y: 145, w: 305, borde: 'izq' },
  { src: 'nube-2.webp', x: 618, y: 167, w: 323, borde: 'der' },
  { src: 'nube-3.webp', x: 0,   y: 454, w: 292, borde: 'izq' },
  { src: 'nube-4.webp', x: 552, y: 491, w: 389, borde: 'der' },
  { src: 'nube-5.webp', x: 0,   y: 613, w: 225, borde: 'izq' },
  { src: 'nube-6.webp', x: 231, y: 652, w: 216, borde: null },
  { src: 'nube-7.webp', x: 738, y: 685, w: 203, borde: 'der' },
]
const MOVIMIENTO = {
  izq:  { entrada: 'entrar-izq',    deriva: 'deriva-izq' },
  der:  { entrada: 'entrar-der',    deriva: 'deriva-der' },
  null: { entrada: 'entrar-centro', deriva: 'deriva' },
}

const pct = (v, total) => `${(v / total) * 100}%`

// Cuándo termina de entrar el fondo, las olas y la tabla (ver escena.css: 5 s de fade del
// fondo, olas a los 5 s y tabla a los 6 s). Ahí recién empieza el juego; las nubes siguen
// entrando mientras tanto. Con "reducir movimiento" no hay animación y no se espera.
const ENTRADA_MS = 7000

export default function Escena({ activa, onEntro }) {
  const entroRef = useRef(onEntro)
  useEffect(() => { entroRef.current = onEntro })

  useEffect(() => {
    if (!activa) return
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = setTimeout(() => entroRef.current?.(), sinMovimiento ? 600 : ENTRADA_MS)
    return () => clearTimeout(id)
  }, [activa])

  return (
    <div className={`escena absolute inset-0 overflow-hidden ${activa ? 'activa' : ''}`} aria-hidden="true">
      {/* Las capas comparten un marco con la proporción de la imagen original, ajustado
          como object-fit: cover, para que queden alineadas entre sí. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: `max(100cqw, calc(100cqh * ${IMG_W} / ${IMG_H}))`, aspectRatio: `${IMG_W} / ${IMG_H}` }}
      >
        <img src={cielo} alt="" className="capa absolute inset-0 block size-full" />

        {NUBES.map((n, i) => (
          <div key={n.src} className="absolute" style={{ left: pct(n.x, IMG_W), top: pct(n.y, IMG_H), width: pct(n.w, IMG_W) }}>
            <div className="capa nube" style={{ '--i': i, '--entrada': MOVIMIENTO[n.borde].entrada }}>
              <div className={MOVIMIENTO[n.borde].deriva} style={{ '--i': i }}>
                <img src={urlNube(n.src)} alt="" className="block w-full" />
              </div>
            </div>
          </div>
        ))}

        <div className="capa mar absolute inset-x-0 bottom-0" style={{ top: pct(MAR_Y, IMG_H) }}>
          <div className="marea size-full">
            {Array.from({ length: TIRAS }, (_, i) => (
              <div key={i} className="ola" style={{ '--i': i, '--n': TIRAS, '--img': `url(${olas})` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de surf, apoyada abajo (el paciente se para sobre ella) */}
      <div className="absolute left-1/2 top-[calc(100%-53px)] aspect-[316/126.517] w-[min(78.6vw,46dvh)] -translate-x-1/2 -translate-y-1/2 rotate-[12.48deg]">
        <div className="capa tabla size-full">
          <div className="balanceo size-full">
            <div className="absolute inset-0 overflow-hidden">
              <img src={tabla} alt="" className="absolute left-0 top-[-27.5%] h-[166.51%] w-full max-w-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
