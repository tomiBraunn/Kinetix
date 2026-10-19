// Piezas de pantalla del Surf, según los frames de Figma (archivo y8NlmFOJusZ1nl1jvvZdBo):
//   837:672 Antes de empezar · 837:625 y 833:509 consignas · 833:442/364/292/325/403 mensajes
//   833:539 Desafío completado. La lógica del juego está en GamePage.jsx.
import { useEffect, useRef, useState } from 'react'
import Logo from '../../components/Logo'
import { kinetixAI } from '../../ia/KinetixAI'
import { PUNTOS_SILUETA, evaluar, vistaPara } from '../../ia/calibracion'
import { MENSAJES } from './mensajes'
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

export function Contadores({ puntos, tiempo }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-5 z-20 mx-auto flex max-w-[402px] gap-[30px] px-[15px]">
      <div className={`${pastilla} w-[91px] bg-[rgba(228,226,235,0.75)] pl-[7px]`}>
        <img src={iconoPez} alt="" className="block h-[13px] w-[15px]" />
        <span className="ml-[7px] font-bold">Peces:</span>
        <span className="ml-[7px] font-black">{puntos}</span>
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
    <div className="pointer-events-none absolute inset-x-0 bottom-[15px] z-20 mx-auto flex max-w-[402px] justify-end px-[15px]">
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
export function Consigna({ num, texto }) {
  return (
    <div role="status" className="pointer-events-none absolute inset-x-[26px] top-[84px] z-20 mx-auto flex min-h-[67px] max-w-[350px] items-center gap-[9.5px] rounded-[22px] border-[1.475px] border-primary bg-[#fffbfb] py-2 pl-[12.5px] pr-3.5 shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)]">
      <span className="relative grid h-[29.494px] w-[28.511px] shrink-0 place-items-center text-[18px] font-bold text-white">
        <img src={circuloPaso} alt="" className="absolute inset-0 block size-full" />
        <span className="relative">{num}</span>
      </span>
      <p className="text-[18px] font-bold leading-[22px] text-primary-dark">{texto}</p>
    </div>
  )
}

// ─── Mensajes de ánimo durante el juego (la escena elige cuál: mensajes.js) ──
export function Mensaje({ clave }) {
  const [antes, resaltado, despues] = MENSAJES[clave]
  return (
    <div role="status" className="pointer-events-none absolute inset-x-0 top-[106px] z-20 flex justify-center px-[26px]">
      <p className="flex h-[38px] w-[319px] max-w-full items-center justify-center whitespace-nowrap rounded-[16px] border-b-4 border-[rgba(190,24,93,0.2)] bg-white/90 pt-1 text-[18px] font-bold tracking-[-0.45px] text-[#0e111f] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] backdrop-blur-[4px]">
        {/* en un span: como hijos sueltos del flex, el espacio final de `antes` se pierde */}
        <span>{antes}<em className="font-bold italic text-[#d6065c]">{resaltado}</em>{despues}</span>
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
  ok: '¡Muy bien! Quedate quieto un momento',
}
const INICIAL = { detectados: Array(PUNTOS_SILUETA.length).fill(false), pista: 'nucleo' }
const MANTENER_MS = 1500 // quieto y bien detectado durante este tiempo

const promedio = (ms) => {
  const prom = (k) => ms.reduce((acc, m) => acc + m[k], 0) / ms.length
  return { sx: prom('sx'), sy: prom('sy'), hx: prom('hx'), hy: prom('hy') }
}

export function GuiaSilueta({ pausado, onListo }) {
  const guiaRef = useRef(null)
  const listoRef = useRef(onListo)
  const [estado, setEstado] = useState(INICIAL)

  useEffect(() => { listoRef.current = onListo })

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

      const ev = evaluar(lms, base, guia, area)
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
  }, [pausado])

  return (
    <>
      <div
        ref={guiaRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-1/2 z-[16] aspect-[315/605] h-[min(69.2dvh,150vw)] -translate-x-[45.7%]"
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
      <p role="status" className="pointer-events-none absolute inset-x-0 top-[160px] z-20 mx-auto w-fit max-w-[calc(100%-52px)] rounded-full bg-white/90 px-4 py-1.5 text-center text-[15px] font-bold text-primary-dark shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)]">
        {PISTAS[estado.pista]}
      </p>
    </>
  )
}

// ─── Antes de empezar ───────────────────────────────────────────────────────
const PASOS = [
  ['Prepará el espacio', 'Dejá espacio libre para moverte y colocá la cámara frente a vos.'],
  ['Ubicate en la silueta', 'Alejate hasta que se vea todo tu cuerpo. Quedate quieto dentro de la silueta de puntos.'],
  ['Seguí las consignas', 'El juego te va a indicar qué pez tocar. Mové los brazos para alcanzarlo y volvé al centro.'],
]

// `pasos` es opcional: el Flamenco reusa esta pantalla con los suyos. `mascota` también: va
// debajo del botón, en el espacio libre que deja el diseño (no está en el Figma de trabajo).
export function AntesDeEmpezar({ onListo, pasos = PASOS, mascota = null }) {
  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-[rgba(240,242,255,0.96)] text-primary-dark">
      <div className="mx-auto flex max-w-[402px] flex-col gap-5 px-[26px] pb-8 pt-10">
        {/* Interlineados en px, los de Figma (832:95): sin ellos el navegador usa 1.5 y todo queda más alto */}
        <p className="text-[13px] font-bold leading-[17px]">ANTES DE EMPEZAR</p>
        <h1 className="text-[29px] font-bold leading-[38px]">¿Cómo se juega?</h1>
        <p className="text-[17px] leading-[22px]">Primero preparate. Después, el juego te va a indicar qué movimiento hacer.</p>
        {pasos.map(([titulo, texto], i) => (
          <div key={titulo} className="flex items-start gap-3.5 rounded-[18px] bg-white p-4">
            <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#b11c6c] text-[18px] font-bold text-white">{i + 1}</span>
            <div className="flex flex-col gap-1">
              <p className="text-[18px] font-bold leading-[23px]">{titulo}</p>
              <p className="text-[15px] leading-5">{texto}</p>
            </div>
          </div>
        ))}
        <button onClick={onListo} className="h-[54px] rounded-[27px] bg-[#b11c6c] text-[18px] font-bold text-white">
          Estoy listo
        </button>
        {mascota && <div className="flex justify-center">{mascota}</div>}
      </div>
    </div>
  )
}

// ─── Desafío completado ─────────────────────────────────────────────────────
const ORDINALES = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto']
const CONFETI = [ // [left, top, color, grados] dentro de la tarjeta
  [32.45, 34, '#fac41a', 18], [294, 42.25, '#e82e91', -22], [55, 85.24, '#45c7f2', -16], [277.29, 102, '#8052e0', 20],
]
const fuenteInter = { fontFamily: "'Inter', 'DM Sans', sans-serif" }

export function DesafioCompletado({ ronda, onSeguir, onVolver }) {
  const ordinal = ORDINALES[ronda - 1]
  const titulo = ordinal ? `¡${ordinal[0].toUpperCase()}${ordinal.slice(1)} desafío completado!` : '¡Desafío completado!'
  const detalle = ordinal ? `Completaste el ${ordinal} desafío de Surf.` : 'Completaste otro desafío de Surf.'

  return (
    <div role="dialog" aria-modal="true" aria-label={titulo} className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(13,31,92,0.5)] px-[30px]">
      <div className="relative flex w-[342px] max-w-full flex-col items-center rounded-[28px] bg-white px-8 pb-[37px] pt-[34px] shadow-[0_12px_28px_rgba(13,26,77,0.22)]">
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
        <div className="mt-[17px] flex w-[278px] max-w-full flex-col gap-3 text-[14px] font-semibold" style={fuenteInter}>
          <button onClick={onSeguir} className="h-[46px] rounded-[15px] bg-[#ff5faa] text-white">Seguir jugando</button>
          <button onClick={onVolver} className="h-[46px] rounded-[15px] border border-[#ff5faa] bg-white text-[#ff5faa]">Volver al menú de juegos</button>
        </div>
      </div>
    </div>
  )
}
