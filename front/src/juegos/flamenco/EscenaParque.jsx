// Fondo del parque del Flamenco en capas (cielo, nubes, árboles, césped y flores) para poder
// animarlas por separado, igual que la escena del Surf. Las capas son imágenes del mismo tamaño
// que la ilustración original, con transparencia: apiladas calzan solas, sin posicionar nada a
// mano. La animación está en escenaParque.css.
import { useEffect, useRef } from 'react'
import './escenaParque.css'

// Medidas de la ilustración original (px). Todas las capas se exportan con este tamaño.
const IMG_W = 492
const IMG_H = 874

// Las capas todavía no están en el repo (las imágenes del Figma no se pudieron bajar), así que el
// glob puede dar {}. Su clave es la ruta completa: se indexa por nombre de archivo para no depender de eso.
const rutas = import.meta.glob('../../assets/juegos/flamenco/capas/*.webp', { eager: true, query: '?url', import: 'default' })
const urls = Object.fromEntries(Object.entries(rutas).map(([ruta, url]) => [ruta.split('/').pop(), url]))

// Capas esperadas, de atrás hacia adelante: el orden del DOM es el orden de apilado. La animación
// de entrada sale de la clase (escenaParque.css). Las nubes entran y derivan hacia el lado que se
// indica; si en la imagen real alguna queda del otro lado, se cambia acá.
const CAPAS = [
  { src: 'cielo.webp',       clase: 'cielo' },
  { src: 'nube-1.webp',      clase: 'nube', i: 0, entrada: 'parque-entrar-izq',    deriva: 'deriva-izq' },
  { src: 'nube-2.webp',      clase: 'nube', i: 1, entrada: 'parque-entrar-der',    deriva: 'deriva-der' },
  { src: 'nube-3.webp',      clase: 'nube', i: 2, entrada: 'parque-entrar-centro', deriva: 'deriva' },
  { src: 'lejos.webp',       clase: 'lejos' },
  { src: 'arboles-izq.webp', clase: 'arboles-izq' },
  { src: 'arboles-der.webp', clase: 'arboles-der' },
  { src: 'cesped.webp',      clase: 'cesped' },
  { src: 'flores.webp',      clase: 'flores', deriva: 'mecer' },
]
// Una capa que falta en la carpeta simplemente no se dibuja
const CAPAS_REALES = CAPAS.filter(c => urls[c.src])

// REEMPLAZO PROVISORIO hasta que estén las capas reales: mientras la carpeta esté vacía, el parque
// se dibuja con CSS (cielo en degradé, dos nubes y césped con colinas). Usa las mismas clases que
// las capas reales, así que respeta la misma secuencia de entrada (cielo 5 s, césped 5,5 s).
// Cuando se suban los .webp, esto deja de usarse solo y se puede borrar junto con sus reglas en el CSS.
const REEMPLAZO = [
  { clase: 'cielo',  dibujo: 'cielo-css' },
  { clase: 'nube',   i: 0, entrada: 'parque-entrar-izq', deriva: 'deriva-izq', dibujo: 'nube-css nube-css-1' },
  { clase: 'nube',   i: 1, entrada: 'parque-entrar-der', deriva: 'deriva-der', dibujo: 'nube-css nube-css-2' },
  { clase: 'cesped', dibujo: 'cesped-css' },
]

// Cuándo termina de entrar el parque (ver escenaParque.css: cielo 5 s, árboles 5 s, césped a los
// 5,5 s con 1 s de subida y flores a los 6,2 s). Ahí recién empieza el juego. Con "reducir
// movimiento" no hay animación y no se espera.
const ENTRADA_MS = 7000

// Cada capa ocupa todo su marco; la deriva va en un div interior para no pisar la animación de entrada
function Capas({ lista }) {
  return lista.map(c => (
    <div key={c.src ?? c.dibujo} className={`capa ${c.clase} absolute inset-0`} style={{ '--i': c.i, '--entrada': c.entrada }}>
      <div className={`${c.deriva ?? ''} size-full`}>
        {c.src ? <img src={urls[c.src]} alt="" className="block size-full" /> : <div className={c.dibujo} />}
      </div>
    </div>
  ))
}

export default function EscenaParque({ activa, onEntro }) {
  const entroRef = useRef(onEntro)
  useEffect(() => { entroRef.current = onEntro })

  useEffect(() => {
    if (!activa) return
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = setTimeout(() => entroRef.current?.(), sinMovimiento ? 600 : ENTRADA_MS)
    return () => clearTimeout(id)
  }, [activa])

  return (
    <div className={`parque absolute inset-0 overflow-hidden ${activa ? 'activa' : ''}`} aria-hidden="true">
      {CAPAS_REALES.length > 0 ? (
        // Las capas comparten un marco con la proporción de la ilustración, ajustado como
        // object-fit: cover, para que queden alineadas entre sí.
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: `max(100cqw, calc(100cqh * ${IMG_W} / ${IMG_H}))`, aspectRatio: `${IMG_W} / ${IMG_H}` }}
        >
          <Capas lista={CAPAS_REALES} />
        </div>
      ) : (
        <Capas lista={REEMPLAZO} />
      )}
    </div>
  )
}
