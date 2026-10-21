// Piezas de pantalla del Surf, según los frames de Figma (archivo y8NlmFOJusZ1nl1jvvZdBo):
//   837:672 Antes de empezar · 837:625 y 833:509 consignas · 833:442/364/292/325/403 mensajes
//   833:539 Desafío completado. La lógica del juego está en GamePage.jsx.
import { useEffect, useRef, useState } from 'react'
import Logo from '../../components/Logo'
import { kinetixAI } from '../../ia/KinetixAI'
import { PUNTOS_SILUETA, evaluar, vistaPara } from '../../ia/calibracion'
import { hablar } from '../../ia/voz'
import { estiloSobreBotonApp } from '../../lib/appMovil'
import { MascotaDelGlobo } from '../Mascota'
import '../guia.css'
import { MENSAJES } from './mensajes'
import { LIMITES, PASOS_ZONA, leerZona, guardarZona, normalizarZona } from './curva'
import iconoMenu from '../../assets/juegos/surf/menu.svg'
import iconoPausa from '../../assets/juegos/surf/pausa.svg'
import iconoSalir from '../../assets/juegos/surf/salir.svg'
import iconoReloj from '../../assets/juegos/surf/reloj.svg'
import iconoPez from '../../assets/juegos/surf/pez.svg'
import circuloPaso from '../../assets/juegos/surf/circulo-paso.svg'
import circuloCheck from '../../assets/juegos/surf/circulo-check.svg'
import siluetaContorno from '../../assets/juegos/surf/silueta-contorno.svg'
import siluetaPuntos from '../../assets/juegos/surf/silueta-puntos.svg'

// ─── Barra superior ─────────────────────────────────────────────────────────
export function BarraSuperior({ conPausa, conSalir, pausado, onPausa, onSalir }) {
  return (
    <header className="relative z-30 flex h-12 shrink-0 items-center justify-between bg-bg-header pl-[15px] pr-[21px]">
      <div className="flex items-center gap-[13.5px]">
        <img src={iconoMenu} alt="" className="block h-[15px] w-[22.5px]" />
        {/* El Logo mide 36px de alto; el diseño lo usa a ~20px */}
        <div className="h-5 w-[67px]">
          <div className="w-max origin-top-left scale-[0.55]"><Logo /></div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] tracking-[0.7px] text-white">
        {conPausa && (
          <button onClick={onPausa} className="flex h-[25px] w-[73px] items-center justify-center gap-0.5 rounded-[20px] bg-[#b11c6c]">
            {pausado ? 'Reanudar' : 'Pausar'}
            {!pausado && <span className="size-5"><img src={iconoPausa} alt="" className="block size-full" /></span>}
          </button>
        )}
        {conSalir && (
          <button onClick={onSalir} className="flex h-[25px] min-w-[71px] items-center justify-center gap-[5px] rounded-[20px] bg-primary px-[9px]">
            Salir
            <span className="size-3"><img src={iconoSalir} alt="" className="block size-full" /></span>
          </button>
        )}
      </div>
    </header>
  )
}

// ─── Contadores (peces / tiempo) ────────────────────────────────────────────
const pastilla = 'flex h-[29px] items-center rounded-[10px] border border-[#e3e3e3] shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)] text-[11.798px] text-[#444748]'

const mmss = (seg) => `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`

// `meta`: cuántos peces hay que atrapar en la ronda (la elige el kinesiólogo); sin ella se muestra solo lo atrapado
export function Contadores({ puntos, tiempo, meta = null }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-5 z-20 mx-auto flex max-w-[402px] gap-[30px] px-[15px]">
      <div className={`${pastilla} ${meta ? 'w-[110px]' : 'w-[91px]'} bg-[rgba(228,226,235,0.75)] pl-[7px]`}>
        <img src={iconoPez} alt="" className="block h-[13px] w-[15px]" />
        <span className="ml-[7px] font-bold">Peces:</span>
        <span className="ml-[7px] font-black">{meta ? `${puntos}/${meta}` : puntos}</span>
      </div>
      <div className={`${pastilla} w-[126px] bg-[rgba(228,226,235,0.71)] pl-[9px]`}>
        <img src={iconoReloj} alt="" className="block size-[14px]" />
        <span className="ml-0.5 font-bold">Tiempo:</span>
        <span className="ml-[7px] font-black">{mmss(tiempo)}</span>
      </div>
    </div>
  )
}

// ─── Volumen de la música ───────────────────────────────────────────────────
// Abajo a la derecha (abajo a la izquierda está el esqueleto de la detección), con el
// mismo estilo de pastilla que los contadores (el diseño de Figma no trae este control).
// Silenciado, el slider queda en 0 pero se acuerda del volumen anterior para cuando se
// vuelve a activar.
export function ControlMusica({ volumen, silencio, onVolumen, onSilencio }) {
  const nivel = silencio ? 0 : volumen
  const icono = nivel === 0 ? 'volume_off' : nivel < 0.5 ? 'volume_down' : 'volume_up'
  return (
    <div style={estiloSobreBotonApp} className="pointer-events-none absolute inset-x-0 bottom-[15px] z-20 mx-auto flex max-w-[402px] justify-end px-[15px]">
      <div className="pointer-events-auto flex h-[38px] w-fit items-center gap-1 rounded-[10px] border border-[#e3e3e3] bg-[rgba(228,226,235,0.75)] pl-1 pr-3 shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)]">
        <button
          onClick={onSilencio}
          aria-label={silencio ? 'Activar la música' : 'Silenciar la música'}
          aria-pressed={silencio}
          className="grid size-[34px] place-items-center rounded-lg text-primary-dark"
        >
          <span className="material-symbols-rounded select-none text-[24px]" aria-hidden="true">{icono}</span>
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(nivel * 100)}
          onChange={(e) => onVolumen(e.target.value / 100)}
          aria-label="Volumen de la música"
          className="w-[96px] accent-[#b11c6c]"
        />
      </div>
    </div>
  )
}

// ─── Consigna numerada (pasos 1 y 2) ────────────────────────────────────────
// Con `mascota` (un <Mascota>) queda pegada abajo a la izquierda con la cola del globo apuntándole.
export function Consigna({ num, texto, mascota = null, colaIzq }) {
  return (
    <div role="status" className="globo-pop pointer-events-none absolute inset-x-[26px] top-[84px] z-20 mx-auto flex min-h-[67px] max-w-[350px] items-center gap-[9.5px] rounded-[22px] border-[1.475px] border-primary bg-[#fffbfb] py-2 pl-[12.5px] pr-3.5 shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)]">
      <span className="relative grid h-[29.494px] w-[28.511px] shrink-0 place-items-center text-[18px] font-bold text-white">
        <img src={circuloPaso} alt="" className="absolute inset-0 block size-full" />
        <span className="relative">{num}</span>
      </span>
      <p key={texto} className="globo-texto text-[18px] font-bold leading-[22px] text-primary-dark">{texto}</p>
      {mascota && <MascotaDelGlobo colaIzq={colaIzq}>{mascota}</MascotaDelGlobo>}
    </div>
  )
}

// ─── Mensajes de ánimo durante el juego (la escena elige cuál: mensajes.js) ──
// La alerta de movimiento (clave "alerta") es más larga: puede ocupar dos líneas y lleva otro color
export function Mensaje({ clave }) {
  const [antes, resaltado, despues] = MENSAJES[clave]
  const alerta = clave === 'alerta'
  return (
    <div role={alerta ? 'alert' : 'status'} className="pointer-events-none absolute inset-x-0 top-[106px] z-20 flex justify-center px-[26px]">
      <p className={`globo-pop flex w-[319px] max-w-full items-center justify-center rounded-[16px] border-b-4 bg-white/90 text-[18px] font-bold tracking-[-0.45px] text-[#0e111f] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] backdrop-blur-[4px] ${alerta ? 'min-h-[38px] whitespace-normal border-[rgba(217,119,6,0.45)] px-3 py-2 text-center leading-[22px]' : 'h-[38px] whitespace-nowrap border-[rgba(190,24,93,0.2)] pt-1'}`}>
        {/* en un span: como hijos sueltos del flex, el espacio final de `antes` se pierde */}
        <span>{antes}<em className={`font-bold italic ${alerta ? 'text-[#b45309]' : 'text-[#d6065c]'}`}>{resaltado}</em>{despues}</span>
      </p>
    </div>
  )
}

// ─── Guía de calibración: silueta de puntos ─────────────────────────────────
// El juego no arranca hasta que el paciente esté bien detectado y en el medio (la
// lógica está en calibracion.js). Los puntos pasan de rosa a verde cuando esa parte
// del cuerpo está detectada, y una pista dice qué hacer.
const PISTAS = {
  nucleo: 'Mostrá la cabeza, los hombros y la cintura frente a la cámara',
  izquierda: 'Correte un poco hacia tu izquierda',
  derecha: 'Correte un poco hacia tu derecha',
  cerca: 'Alejate un poco',
  lejos: 'Acercate un poco',
  rodillas: 'No te veo las rodillas: alejate un poco o apuntá la cámara más abajo',
  ok: '¡Muy bien! Quedate quieto un momento',
}
const INICIAL = { detectados: Array(PUNTOS_SILUETA.length).fill(false), pista: 'nucleo' }
const MANTENER_MS = 1500 // quieto y bien detectado durante este tiempo
// Pantalla apaisada (celular acostado, televisor): el alto es poco y la silueta entera quedaba chica, o sea el
// paciente se veía chico y los peces —que se miden contra su cuerpo— en un rango diminuto. Ahí la silueta
// se agranda hasta 130% del alto, bajada un 12% para dejar arriba lugar a los contadores y a los peces: entran
// la cabeza, los hombros, las caderas y las rodillas (lo que piden los juegos) y el paciente se ve el doble de grande. Mismo umbral que EscenaPrincipal (1,2).
// (Tailwind necesita las clases enteras en el código: por eso la guía repite el media query)
const PISTA_VOZ_MS = 2500 // una pista tiene que sostenerse tanto para que la voz la diga

const promedio = (ms) => {
  const prom = (k) => ms.reduce((acc, m) => acc + m[k], 0) / ms.length
  return { sx: prom('sx'), sy: prom('sy'), hx: prom('hx'), hy: prom('hy') }
}

// `requiere`: qué tiene que verse además del tronco ('torso' | 'rodillas'; ver ia/calibracion.js → evaluar)
export function GuiaSilueta({ pausado, onListo, requiere = 'torso' }) {
  const guiaRef = useRef(null)
  const listoRef = useRef(onListo)
  const [estado, setEstado] = useState(INICIAL)

  useEffect(() => { listoRef.current = onListo })

  // La voz dice cada pista una sola vez y solo si se mantiene un rato: con la detección titilando la pista
  // cambia a cada rato y, hablada cada vez, la calibración sonaba sin parar. De lejos no se lee el cartel.
  // sinInterrumpir: no pisa la consigna de la página mientras se la está leyendo. La de "listo" va enseguida
  // (la calibración termina en un segundo y medio).
  const dichasRef = useRef(new Set())
  useEffect(() => {
    if (pausado || dichasRef.current.has(estado.pista)) return
    const id = setTimeout(() => {
      dichasRef.current.add(estado.pista)
      hablar(PISTAS[estado.pista], { sinInterrumpir: true })
    }, estado.pista === 'ok' ? 0 : PISTA_VOZ_MS)
    return () => clearTimeout(id)
  }, [estado.pista, pausado])

  useEffect(() => {
    if (pausado) return
    let desde = null
    let muestras = []
    let hecho = false

    const id = setInterval(() => {
      const el = guiaRef.current
      const lms = kinetixAI.ultimosLandmarks
      if (!el?.offsetParent || !lms) { desde = null; muestras = []; setEstado(INICIAL); return }

      // Guía y área de juego en píxeles del canvas del juego (mismo origen que aPantalla)
      const a = el.offsetParent.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      const guia = { left: r.left - a.left, top: r.top - a.top, width: r.width, height: r.height }
      const area = { w: a.width, h: a.height }
      const base = kinetixAI.encuadreBase()

      const ev = evaluar(lms, base, guia, area, requiere)
      setEstado((e) => (e.pista === ev.pista && e.detectados.join() === ev.detectados.join() ? e : { detectados: ev.detectados, pista: ev.pista }))

      if (ev.pista !== 'ok') { desde = null; muestras = []; return }
      muestras.push(ev.medida)
      desde ??= performance.now()
      if (!hecho && performance.now() - desde >= MANTENER_MS) {
        hecho = true
        // Con el paciente medido, la vista lo alinea con la silueta (y lo "aleja" si está cerca)
        listoRef.current(vistaPara(promedio(muestras), base, guia, area).vista)
      }
    }, 100)

    return () => clearInterval(id)
  }, [pausado, requiere])

  return (
    <>
      <div
        ref={guiaRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-1/2 z-[16] aspect-[315/605] h-[min(73.2%,150vw)] -translate-x-[45.7%] [@media(min-aspect-ratio:6/5)]:bottom-auto [@media(min-aspect-ratio:6/5)]:top-[12%] [@media(min-aspect-ratio:6/5)]:h-[130%]"
      >
        <div className="absolute inset-[4.17%_13.6%_8.71%_13.6%]">
          <div className="absolute inset-[-0.66%_-1.44%_-0.63%_-1.23%]">
            <img src={siluetaContorno} alt="" className="block size-full max-w-none" />
          </div>
        </div>
        <div className="absolute inset-[22.71%_16.4%_8.75%_16%]">
          <div className="absolute inset-[-0.36%_-0.7%]">
            <img src={siluetaPuntos} alt="" className="block size-full max-w-none" />
          </div>
        </div>
        {/* Cada punto detectado pasa de rosa a verde */}
        {estado.detectados.map((ok, i) => ok && (
          <span
            key={i}
            className="absolute aspect-square w-[6.6%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#34d399]"
            style={{ left: `${PUNTOS_SILUETA[i][0] * 100}%`, top: `${PUNTOS_SILUETA[i][1] * 100}%` }}
          />
        ))}
      </div>
      {/* A la derecha y debajo del globo: a la izquierda queda la mascota */}
      <p role="status" className="pointer-events-none absolute right-[26px] top-[176px] z-20 w-fit max-w-[min(250px,calc(100%-150px))] rounded-full bg-white/90 px-4 py-1.5 text-center text-[15px] font-bold text-primary-dark shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)]">
        {PISTAS[estado.pista]}
      </p>
    </>
  )
}

// ─── Antes de empezar ───────────────────────────────────────────────────────
// Primera etapa: el kinesiólogo arma la sesión (la rutina y la zona de los peces). La segunda es la guía de la
// mascota, que explica cómo se juega paso a paso (ver GuiaMascota). `mascota` va debajo del botón, en el espacio
// libre que deja el diseño (no está en el Figma de trabajo).
export function AntesDeEmpezar({ onListo, mascota = null, extra = null }) {
  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-[rgba(240,242,255,0.96)] text-primary-dark">
      <div className="mx-auto flex max-w-[402px] flex-col gap-5 px-[26px] pb-8 pt-10">
        {/* Interlineados en px, los de Figma (832:95): sin ellos el navegador usa 1.5 y todo queda más alto */}
        <p className="text-[13px] font-bold leading-[17px]">ANTES DE EMPEZAR</p>
        <h1 className="text-[29px] font-bold leading-[38px]">Armá la sesión</h1>
        <p className="text-[17px] leading-[22px]">Elegí cómo va a ser. Después, la mascota le explica el juego al paciente, paso a paso.</p>
        {extra}
        <button onClick={onListo} className="h-[54px] rounded-[27px] bg-[#b11c6c] text-[18px] font-bold text-white">
          Continuar
        </button>
        {mascota && <div className="flex justify-center">{mascota}</div>}
      </div>
    </div>
  )
}

// ─── Zona donde aparecen los peces ──────────────────────────────────────────
// Los peces nadan por una curva sobre el paciente (ver aparicion.js). El kinesiólogo elige de antemano el alto y el
// ancho de esa zona; cada pez sale en un punto al azar de ella, o sea a todas las alturas que abarque. Queda
// guardada en el equipo (curva.js). El dibujo muestra la zona vista de frente, con el paciente abajo.
function VistaZona({ zona }) {
  const E = 80 // px del dibujo por largo de tronco
  const cx = 120
  const cy = 138 // los hombros
  const punto = (r, grados) => {
    const a = (grados * Math.PI) / 180
    return [cx + r * E * Math.sin(a), cy - r * E * Math.cos(a)]
  }
  const [ox1, oy1] = punto(zona.altoMax, -zona.ancho)
  const [ox2, oy2] = punto(zona.altoMax, zona.ancho)
  const [ix2, iy2] = punto(zona.altoMin, zona.ancho)
  const [ix1, iy1] = punto(zona.altoMin, -zona.ancho)
  const R = zona.altoMax * E
  const r = zona.altoMin * E
  const d = `M ${ox1} ${oy1} A ${R} ${R} 0 0 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${r} ${r} 0 0 0 ${ix1} ${iy1} Z`
  return (
    <svg viewBox="0 0 240 150" className="mt-3 w-full rounded-[12px] bg-[#f3f4fb]" aria-hidden="true">
      <path d={d} fill="rgba(177,28,108,0.18)" stroke="#b11c6c" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={cx} cy={cy - 20} r="10" fill="#2b319c" />
      <line x1={cx - 20} y1={cy} x2={cx + 20} y2={cy} stroke="#2b319c" strokeWidth="7" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx} y2="150" stroke="#2b319c" strokeWidth="7" />
    </svg>
  )
}

function Deslizador({ etiqueta, valor, texto, min, max, paso, onCambio }) {
  return (
    <label className="mt-3 block">
      <span className="flex items-baseline justify-between text-[15px] font-bold">{etiqueta}<span className="font-black text-[#b11c6c]">{texto}</span></span>
      <input type="range" min={min} max={max} step={paso} value={valor} onChange={(e) => onCambio(Number(e.target.value))} className="mt-1 w-full accent-[#b11c6c]" />
    </label>
  )
}

export function SelectorZona() {
  const [zona, setZona] = useState(leerZona)
  const cambiar = (cambios) => {
    const nueva = normalizarZona({ ...zona, ...cambios })
    setZona(nueva)
    guardarZona(nueva)
  }
  const coma = (n) => String(n).replace('.', ',')
  return (
    <div role="group" aria-label="Zona donde aparecen los peces" className="rounded-[18px] bg-white p-4">
      <p className="text-[18px] font-bold leading-[23px]">Zona donde aparecen los peces</p>
      <p className="mt-1 text-[15px] leading-5">Sobre el paciente. Cada pez sale en un punto al azar de esta zona: una zona amplia usa todas las alturas.</p>
      <VistaZona zona={zona} />
      <Deslizador etiqueta="Alto mínimo" valor={zona.altoMin} texto={coma(zona.altoMin)} min={LIMITES.alto[0]} max={LIMITES.alto[1]} paso={PASOS_ZONA.alto}
        onCambio={(v) => cambiar({ altoMin: Math.min(v, zona.altoMax) })} />
      <Deslizador etiqueta="Alto máximo" valor={zona.altoMax} texto={coma(zona.altoMax)} min={LIMITES.alto[0]} max={LIMITES.alto[1]} paso={PASOS_ZONA.alto}
        onCambio={(v) => cambiar({ altoMax: Math.max(v, zona.altoMin) })} />
      <Deslizador etiqueta="Ancho (a cada lado)" valor={zona.ancho} texto={`±${zona.ancho}°`} min={LIMITES.ancho[0]} max={LIMITES.ancho[1]} paso={PASOS_ZONA.ancho}
        onCambio={(v) => cambiar({ ancho: v })} />
      <p className="mt-2 text-[13px] leading-[18px] text-[#5e668c]">El alto se mide en largos de tronco sobre los hombros: más alto pide levantar más los brazos; más ancho, inclinar más el tronco.</p>
    </div>
  )
}

// ─── Desafío completado ─────────────────────────────────────────────────────
const ORDINALES = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto']
const CONFETI = [ // [left, top, color, grados] dentro de la tarjeta
  [32.45, 34, '#fac41a', 18], [294, 42.25, '#e82e91', -22], [55, 85.24, '#45c7f2', -16], [277.29, 102, '#8052e0', 20],
]
const fuenteInter = { fontFamily: "'Inter', 'DM Sans', sans-serif" }

// Color de la comparación con la ronda anterior (además del color va la flecha y un texto solo para lectores)
const COLOR_ESTADO = { mejor: 'text-[#0f8a5f]', peor: 'text-[#b45309]', igual: 'text-[#5e668c]' }

export function DesafioCompletado({ ronda, analisis = null, onSeguir, onVolver, onVerAnalisis = null }) {
  const ordinal = ORDINALES[ronda - 1]
  const titulo = ordinal ? `¡${ordinal[0].toUpperCase()}${ordinal.slice(1)} desafío completado!` : '¡Desafío completado!'
  const detalle = ordinal ? `Completaste el ${ordinal} desafío de Surf.` : 'Completaste otro desafío de Surf.'
  const frase = analisis?.frase ?? ''
  useEffect(() => { hablar(`${titulo} ¡Buen trabajo! ${detalle} ${frase} ¿Querés seguir jugando?`) }, [titulo, detalle, frase])

  return (
    <div role="dialog" aria-modal="true" aria-label={titulo} className="absolute inset-0 z-40 flex overflow-y-auto bg-[rgba(13,31,92,0.5)] px-[30px] py-4">
      <div className="relative m-auto flex w-[342px] max-w-full flex-col items-center rounded-[28px] bg-white px-8 pb-[37px] pt-[34px] shadow-[0_12px_28px_rgba(13,26,77,0.22)]">
        {CONFETI.map(([left, top, color, grados]) => (
          <span key={color} aria-hidden="true" className="absolute h-[5px] w-2.5 rounded-[2px]" style={{ left, top, background: color, transform: `rotate(${grados}deg)` }} />
        ))}
        <div className="relative grid size-[72px] place-items-center text-[32px] font-bold text-white" style={fuenteInter}>
          <img src={circuloCheck} alt="" className="absolute inset-0 block size-full" />
          <span className="relative" aria-hidden="true">✓</span>
        </div>
        <p className="mt-[22px] text-center text-[24px] font-bold text-[#1a1f6e]">{titulo}</p>
        <p className="mt-px text-[18px] font-semibold text-[#e82e91]">¡Buen trabajo!</p>
        <p className="mt-1.5 text-center text-[14px] text-[#5e668c]">{detalle}<br />¿Querés seguir jugando?</p>
        {analisis && (
          <section aria-label="Análisis de la IA" className="mt-4 w-[278px] max-w-full rounded-2xl bg-[#f3f4fb] px-4 py-3">
            <p className="text-[12px] font-bold tracking-wide text-[#5e668c]">ANÁLISIS DE LA IA</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {analisis.filas.map((f) => (
                <li key={f.clave} className="flex items-baseline justify-between gap-2 text-[14px] text-[#1a1f6e]">
                  <span>{f.etiqueta}</span>
                  <span className="flex items-baseline gap-2">
                    <b>{f.texto}</b>
                    {f.delta && (
                      <span className={`text-[12px] font-bold ${COLOR_ESTADO[f.estado]}`}>
                        {f.delta}<span className="sr-only"> ({f.estado})</span>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[13px] leading-[18px] text-[#5e668c]">{analisis.frase}</p>
          </section>
        )}
        <div className="mt-[17px] flex w-[278px] max-w-full flex-col gap-3 text-[14px] font-semibold" style={fuenteInter}>
          <button data-mano onClick={onSeguir} className="h-[46px] rounded-[15px] bg-[#ff5faa] text-white">Seguir jugando</button>
          {/* Lleva al panel, a los videos y al análisis completo de esta ronda (solo si la ronda se guardó) */}
          {onVerAnalisis && <button onClick={onVerAnalisis} className="h-[46px] rounded-[15px] border border-[#ff5faa] bg-white text-[#ff5faa]">Ver análisis y videos de esta ronda</button>}
          <button onClick={onVolver} className="h-[46px] rounded-[15px] border border-[#ff5faa] bg-white text-[#ff5faa]">Volver al menú de juegos</button>
        </div>
      </div>
    </div>
  )
}
