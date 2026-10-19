// Mascota de un juego (diseño: Figma "Kinetix · Marketing", nodos 294:16 el pez y 296:18 el flamingo).
// Cada pose es un SVG de composición completa con root width/height propios y preserveAspectRatio="none":
// se escala SOLO por ancho (`className` con un w-…) y el alto sale solo de la proporción del archivo;
// fijar los dos lados la deformaría.
//
// "reposo" es el dibujo original del Figma. Las demás poses (assets/juegos/mascotas/poses/<especie>-<pose>.svg)
// son un boceto derivado de ese dibujo —patas nuevas, alas rotadas, el pez inclinado— hasta que Mia las dibuje
// con su estilo: alcanza con reemplazar los archivos, con los mismos nombres.
import './mascota.css'

const archivos = import.meta.glob('../assets/juegos/mascotas/**/*.svg', { eager: true, query: '?url', import: 'default' })
const BASE = '../assets/juegos/mascotas/'
const ORIGINAL = { flamingo: 'flamingo.svg', pez: 'pez.svg' }
const urlDe = (especie, pose) => archivos[`${BASE}poses/${especie}-${pose}.svg`] ?? archivos[BASE + ORIGINAL[especie]]

/**
 * La cola del globo y la mascota debajo, para poner dentro de un globo de consigna (que es `absolute` y tiene
 * el borde y el fondo de siempre): así la mascota queda pegada al globo sin importar cuántas líneas tenga.
 * Va por encima del paciente (el globo está en z-20, la silueta en z-15). `colaIzq` es dónde cae la cola, en px
 * desde el borde izquierdo del globo: tiene que quedar sobre la cabeza de la mascota.
 */
export function MascotaDelGlobo({ children, colaIzq = 13 }) {
  return (
    <>
      <span aria-hidden="true" style={{ left: colaIzq }} className="absolute -bottom-[8px] size-[14px] rotate-45 border-b-[1.475px] border-r-[1.475px] border-primary bg-[#fffbfb]" />
      <div aria-hidden="true" className="absolute -left-[14px] top-full mt-[10px]">{children}</div>
    </>
  )
}

/**
 * @param especie  'flamingo' | 'pez'
 * @param habla    se mueve un poco más mientras suena la voz
 */
export default function Mascota({ especie, pose = 'reposo', habla = false, className = '' }) {
  // Decorativa: lo que dice ya está escrito en pantalla y la voz lo lee
  return (
    <div className={`w-fit ${habla ? 'mascota-habla' : ''}`}>
      {/* key por pose: al cambiar de pose el dibujo nuevo entra con un fundido corto */}
      <img key={pose} src={urlDe(especie, pose)} alt="" aria-hidden="true" draggable="false" data-pose={pose} className={`mascota block h-auto ${className}`} />
    </div>
  )
}
