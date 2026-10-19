// Piezas de pantalla del Flamenco Challenge, según los frames de Figma (archivo y8NlmFOJusZ1nl1jvvZdBo):
//   832:47 Antes de empezar · 829:67/91/116 práctica · 858:69 comenzar · 858:121/152 repetición
//   858:183/299 descanso · 858:415 completado. Mismo estilo que surf/pantallas.jsx; la lógica
//   del juego (qué pieza se muestra en cada fase) vive en la página, no acá.
import { useId } from 'react'
import { AntesDeEmpezar } from '../surf/pantallas'
import Mascota, { MascotaDelGlobo } from '../Mascota'
import iconoReloj from '../../assets/juegos/surf/reloj.svg'

// Las y de Figma cuentan la barra superior (48px): el área de juego arranca en y=48, así que
// todos los `top` de acá son la y del frame menos 48. Con pantalla más ancha que el frame
// (402px), cada pieza queda centrada con max-w-[402px], igual que las del Surf.

// ─── Pastilla de tiempo (arriba a la izquierda) ─────────────────────────────
// Idéntica a la de Contadores del Surf. Esas constantes no se exportan de allá para no
// tocar el Surf más de lo necesario, así que se repiten acá.
const pastilla = 'flex h-[29px] items-center rounded-[10px] border border-[#e3e3e3] shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)] text-[11.798px] text-[#444748]'

// `segundos` puede venir con decimales (segundosSostenidos): el reloj muestra solo los enteros
const mmss = (segundos) => {
  const seg = Math.max(0, Math.floor(segundos) || 0)
  return `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`
}

export function PastillaTiempo({ segundos }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[19px] z-20 mx-auto max-w-[402px] px-[18px]">
      <div className={`${pastilla} w-[126px] bg-[rgba(228,226,235,0.71)] pl-[9px]`}>
        <img src={iconoReloj} alt="" className="block size-[14px]" />
        <span className="ml-0.5 font-bold">Tiempo:</span>
        <span className="ml-[7px] font-black">{mmss(segundos)}</span>
      </div>
    </div>
  )
}

// ─── Pastilla de progreso (arriba a la derecha) ─────────────────────────────
// "n de 3 completadas" / "Repetición n de 3". En Figma es blanca y lisa (sin sombra ni borde), con
// el texto a 12px del borde izquierdo y 7px del superior. El ancho se achica solo en pantallas
// angostas (< 366px) para no pisar la pastilla de tiempo.
export function PastillaProgreso({ texto }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[17px] z-20 mx-auto flex max-w-[402px] justify-end px-[18px]">
      <p className="h-9 w-[min(204px,calc(100%-132px))] whitespace-nowrap rounded-full bg-white pl-3 pt-[7px] text-[16px] font-bold leading-[21px] text-primary-dark">
        {texto}
      </p>
    </div>
  )
}

// ─── Consigna centrada ──────────────────────────────────────────────────────
// Como la Consigna del Surf pero sin el círculo numerado: el texto va centrado y ocupa 314px
// (18px de margen desde el borde externo: 17 de padding + 1 de borde, que el navegador
// redondea desde los 1.475 del diseño).
// Con `mascota` (un <Mascota>) queda pegada abajo a la izquierda con la cola del globo apuntándole.
export function ConsignaCentrada({ texto, mascota = null }) {
  return (
    <div role="status" className="pointer-events-none absolute inset-x-[26px] top-[84px] z-20 mx-auto flex min-h-[67px] max-w-[350px] items-center justify-center rounded-[22px] border-[1.475px] border-primary bg-[#fffbfb] px-[17px] py-2 shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)]">
      <p className="w-full text-center text-[18px] font-bold leading-[22px] text-primary-dark">{texto}</p>
      {mascota && <MascotaDelGlobo>{mascota}</MascotaDelGlobo>}
    </div>
  )
}

// ─── Mascota sobre la tarjeta ───────────────────────────────────────────────
// En comenzar / descanso / completado no hay consigna: la mascota se asoma sobre el borde de la tarjeta
// (mismo cálculo de altura que TarjetaSesion), por encima de ella.
export function MascotaSobreTarjeta({ children }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-[34px] z-[41]"
      style={{ top: 'max(8px, calc(max(60px, min(217px, 100% - 480px)) - 108px))' }}
    >
      {children}
    </div>
  )
}

// ─── Saltar un paso ─────────────────────────────────────────────────────────
// Salida para quien no llega a la posición "alto" (la más exigente): nadie tiene que forzarse a
// algo que no puede ni quedarse sin cómo seguir. No está en el Figma: va debajo de la consigna, a la
// derecha (a la izquierda está la mascota), y Mia tiene que darle forma.
export function BotonSaltar({ onClick }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[176px] z-20 mx-auto flex max-w-[402px] justify-end pr-[26px]">
      <button
        type="button"
        data-mano
        onClick={onClick}
        className="pointer-events-auto h-9 rounded-full border border-[#b11c6c] bg-white px-5 text-[15px] font-bold leading-[21px] text-[#b11c6c] shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)]"
      >
        Me cuesta, saltar este paso
      </button>
    </div>
  )
}

// ─── Tarjeta de sesión (comenzar / descanso / completado) ───────────────────
// Diálogo NO modal: el parque se tiene que ver de fondo, por eso no hay velo ni aria-modal. La
// tarjeta no atrapa clicks (nada de abajo es interactivo) y solo los botones los reciben.
// En el diseño arranca en y=217 del área; en pantallas bajas se sube (480px = la tarjeta más
// alta, la del primer descanso, más aire) para que el botón de abajo no quede cortado. Si ni
// así entra (celular apaisado), la tarjeta hace scroll por dentro en vez de cortarse: por eso
// recibe toques y su alto máximo es lo que queda de área.
// Los interlineados son los de Figma en px (DM Sans "auto" da 1.302 y el navegador lo redondea
// distinto), así la tarjeta mide lo mismo que en el diseño (ej. 393px la de "comenzar").
const BOTON = 'pointer-events-auto h-[50px] w-full rounded-full text-[18px] font-bold leading-[23px]'
const VARIANTES = {
  principal: `${BOTON} bg-[#b11c6c] text-white`,
  secundario: `${BOTON} border border-[#b11c6c] bg-white text-[#b11c6c]`,
}

export function TarjetaSesion({ titulo, texto, botones = [] }) {
  const idTitulo = useId()
  return (
    <div
      role="dialog"
      aria-labelledby={idTitulo}
      className="absolute inset-x-[26px] top-[var(--arriba)] z-40 mx-auto flex max-h-[calc(100%_-_var(--arriba)_-_8px)] max-w-[350px] flex-col gap-5 overflow-y-auto rounded-[24px] bg-white px-6 py-7 text-primary-dark [--arriba:max(60px,min(217px,calc(100%_-_480px)))]"
    >
      <p className="text-[13px] font-bold leading-[17px]">FLAMINGO CHALLENGE</p>
      <h2 id={idTitulo} className="text-[28px] font-bold leading-9">{titulo}</h2>
      {/* pre-line: el "\n\n" del texto es el párrafo en blanco del diseño */}
      <p className="whitespace-pre-line text-[18px] leading-[23px]">{texto}</p>
      {/* key por posición: la etiqueta puede cambiar cada segundo (cuenta regresiva) y no tiene que remontar el botón */}
      {botones.map(({ texto: etiqueta, onClick, variante = 'principal' }, i) => (
        // data-mano: se elige con la mano (CursorMano). Solo los principales: salir del juego, con el mouse
        <button key={i} type="button" data-mano={variante === 'principal' ? '' : undefined} onClick={onClick} className={VARIANTES[variante] ?? VARIANTES.principal}>
          {etiqueta}
        </button>
      ))}
    </div>
  )
}

// ─── Antes de empezar ───────────────────────────────────────────────────────
// Mismo layout que el del Surf (832:47 es igual a 837:672); solo cambian los pasos.
const PASOS = [
  ['Prepará el espacio', 'Dejá espacio libre para moverte y colocá la cámara frente a vos.'],
  ['Ubicate en la silueta', 'Alejate hasta que se te vea de la cabeza a las rodillas. Quedate quieto dentro de la silueta de puntos.'],
  ['Seguí las consignas', 'El juego te va a pedir que levantes cada pierna y mantengas el equilibrio. Seguí las indicaciones en pantalla.'],
]

// La mascota es más alta que ancha (352×460): con 95px de ancho entra en el espacio libre de abajo sin scroll
export function AntesDeEmpezarFlamenco({ onListo }) {
  return <AntesDeEmpezar onListo={onListo} pasos={PASOS} mascota={<Mascota especie="flamingo" className="w-[95px]" />} />
}
