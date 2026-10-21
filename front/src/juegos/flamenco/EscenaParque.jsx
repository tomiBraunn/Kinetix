// Fondo del parque del Flamenco en capas (cielo, nubes, árboles, césped y flores) para poder
// animarlas por separado, igual que la escena del Surf. Las capas son imágenes del mismo tamaño
// con transparencia: apiladas calzan solas, sin posicionar nada a mano. Salen de la ilustración
// del Figma (image 16), separadas por color y con relleno detrás de lo que tapa cada capa.
// La animación está en escenaParque.css.
import { useEffect, useRef } from 'react'
import './escenaParque.css'

// Medidas de las capas (px). Todas se exportan con este tamaño; solo importa la proporción.
const IMG_W = 720
const IMG_H = 1280

// La clave del glob es la ruta completa: se indexa por nombre de archivo
const rutas = import.meta.glob('../../assets/juegos/flamenco/capas/*.webp', { eager: true, query: '?url', import: 'default' })
const urls = Object.fromEntries(Object.entries(rutas).map(([ruta, url]) => [ruta.split('/').pop(), url]))

// Capas de atrás hacia adelante: el orden del DOM es el orden de apilado. La animación de entrada
// sale de la clase (escenaParque.css). Las nubes entran y derivan hacia el lado que se indica:
// nube-1 son las tres de la izquierda, nube-2 la grande de arriba a la derecha y nube-3 las dos
// del medio a la derecha. El césped va antes que los árboles porque los troncos se paran sobre él.
const CAPAS = [
  { src: 'cielo.webp',       clase: 'cielo' },
  { src: 'nube-1.webp',      clase: 'nube', i: 0, entrada: 'parque-entrar-izq',    deriva: 'deriva-izq' },
  { src: 'nube-2.webp',      clase: 'nube', i: 1, entrada: 'parque-entrar-der',    deriva: 'deriva-der' },
  { src: 'nube-3.webp',      clase: 'nube', i: 2, entrada: 'parque-entrar-centro', deriva: 'deriva' },
  { src: 'lejos.webp',       clase: 'lejos' },
  { src: 'cesped.webp',      clase: 'cesped' },
  { src: 'arboles-izq.webp', clase: 'arboles-izq' },
  { src: 'arboles-der.webp', clase: 'arboles-der' },
  { src: 'flores.webp',      clase: 'flores', deriva: 'mecer' },
]

// Cuándo termina de entrar el parque (ver escenaParque.css: cielo 5 s, árboles 5 s, césped a los
// 5,5 s con 1 s de subida y flores a los 6,2 s). Ahí recién empieza el juego. Con "reducir
// movimiento" no hay animación y no se espera.
const ENTRADA_MS = 7000
const ESPERA_MIN_MS = 3000 // tiempo mínimo entre que la página lo pide y el aviso: que se alcance a leer el mensaje

// `onEntro` solo se pasa cuando la página espera que la escena haya entrado (después de la calibración): la escena
// empieza a entrar antes, con la guía de la mascota, así que lo que falta es poco (pero al menos ESPERA_MIN_MS).
export default function EscenaParque({ activa, onEntro }) {
  const entroRef = useRef(onEntro)
  const desdeRef = useRef(null) // desde cuándo está entrando
  const quiereAviso = !!onEntro
  useEffect(() => { entroRef.current = onEntro })
  useEffect(() => { desdeRef.current = activa ? (desdeRef.current ?? performance.now()) : null }, [activa])

  useEffect(() => {
    if (!activa || !quiereAviso) return
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const faltan = Math.max(ESPERA_MIN_MS, ENTRADA_MS - (performance.now() - desdeRef.current))
    const id = setTimeout(() => entroRef.current?.(), sinMovimiento ? 600 : faltan)
    return () => clearTimeout(id)
  }, [activa, quiereAviso])

  return (
    <div className={`parque absolute inset-0 overflow-hidden ${activa ? 'activa' : ''}`} aria-hidden="true">
      {/* Las capas comparten un marco con la proporción de la ilustración, ajustado como
          object-fit: cover, para que queden alineadas entre sí. Cada una ocupa todo el marco;
          la deriva va en un div interior para no pisar la animación de entrada. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: `max(100cqw, calc(100cqh * ${IMG_W} / ${IMG_H}))`, aspectRatio: `${IMG_W} / ${IMG_H}` }}
      >
        {CAPAS.map(c => (
          <div key={c.src} className={`capa ${c.clase} absolute inset-0`} style={{ '--i': c.i, '--entrada': c.entrada }}>
            <div className={`${c.deriva ?? ''} size-full`}>
              <img src={urls[c.src]} alt="" className="block size-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
