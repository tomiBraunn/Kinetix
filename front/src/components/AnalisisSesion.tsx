import { useMemo } from 'react'
import {
  type SesionRow,
  type SesionDetalle,
  type AnalisisIA,
  resultadoPrincipal,
} from '../lib/sesiones'

type Juego = SesionRow['juego']

export const CARD = 'bg-white border border-[#e0e3f5] rounded-[18px] shadow-[0_6px_18px_0_rgba(20,26,82,0.07)]'

export const TITULO: Record<Juego, string> = {
  surf: 'Surf Challenge',
  flamenco: 'Flamenco Challenge',
  estrellas: 'Alcanzá la estrella',
}

const FRASE: Record<Juego, string> = {
  surf: 'Cada avance suma confianza',
  flamenco: 'Cada segundo de equilibrio fortalece la confianza',
  estrellas: 'Cada estrella alcanzada suma confianza',
}

// Colores de las 4 tarjetas de métricas, en el orden del diseño.
const PALETA = [
  { fondo: 'bg-[#edf0ff]', texto: 'text-[#3038b8]', barra: 'bg-[#3038b8]' },
  { fondo: 'bg-[#ffedf7]', texto: 'text-[#e82e91]', barra: 'bg-[#e82e91]' },
  { fondo: 'bg-[#e4effc]', texto: 'text-[#6296d8]', barra: 'bg-[#6296d8]' },
  { fondo: 'bg-[#ebfaf0]', texto: 'text-[#2ead6e]', barra: 'bg-[#fa9eba]' },
]

// Referencias fijas que muestra el diseño ("Objetivo 75"); no vienen de la base.
const OBJETIVO_ESTABILIDAD = 75
const OBJETIVO_PRECISION = 80

type Tarjeta = { label: string; valor: number | null; unidad: string; delta: string | null }
type Barra = { label: string; porcentaje: number; referencia: string }

function fmt(n: number, decimales = 0) {
  return n.toLocaleString('es-AR', { maximumFractionDigits: decimales })
}

function fmtDuracion(seg: number | null) {
  if (seg == null) return '—'
  return seg < 60 ? `${seg} s` : `${Math.floor(seg / 60)} min ${seg % 60} s`
}

function delta(curr: number | null | undefined, prev: number | null | undefined, unidad: string, decimales = 0) {
  if (curr == null || prev == null) return null
  const d = curr - prev
  const abs = Number(Math.abs(d).toFixed(decimales))
  if (abs === 0) return 'Sin cambios'
  return `${d > 0 ? '↑' : '↓'} ${fmt(abs, decimales)}${unidad}`
}

type Raw = Record<string, number | undefined>

// Número que resume el resultado de cada juego (lo mismo que muestra resultadoPrincipal).
function resultadoNum(juego: Juego, raw: Raw): number | null {
  const v = juego === 'surf' ? raw.puntos : juego === 'flamenco' ? raw.mejor_tiempo_segundos : raw.estrellas_alcanzadas
  return v ?? null
}

function armarTarjetas(s: SesionDetalle, prev: SesionRow | null): Tarjeta[] {
  const m = s.metricas_sesion
  const raw = (m?.datos_ia_raw ?? {}) as Raw
  const pm = prev?.metricas_sesion
  const praw = (pm?.datos_ia_raw ?? {}) as Raw

  const equilibrio: Tarjeta = {
    label: s.juego === 'flamenco' ? 'Equilibrio unipodal' : 'Equilibrio',
    valor: m?.estabilidad_score ?? null,
    unidad: '/ 100',
    delta: delta(m?.estabilidad_score, pm?.estabilidad_score, ' puntos'),
  }
  const rango: Tarjeta = {
    label: 'Rango de movimiento',
    valor: m?.rango_movimiento_avg ?? null,
    unidad: '°',
    delta: delta(m?.rango_movimiento_avg, pm?.rango_movimiento_avg, '°', 1),
  }

  if (s.juego === 'surf') {
    return [
      equilibrio,
      rango,
      { label: 'Peces atrapados', valor: raw.puntos ?? null, unidad: 'peces', delta: delta(raw.puntos, praw.puntos, ' peces') },
      raw.tiempo_reaccion_s != null
        ? { label: 'Tiempo de reacción', valor: raw.tiempo_reaccion_s, unidad: 's', delta: delta(raw.tiempo_reaccion_s, praw.tiempo_reaccion_s, ' s', 2) }
        : { label: 'Rango máximo', valor: m?.rango_movimiento_max ?? null, unidad: '°', delta: null },
    ]
  }
  if (s.juego === 'flamenco') {
    return [
      equilibrio,
      raw.control_tronco != null
        ? { label: 'Control postural', valor: raw.control_tronco, unidad: '/ 100', delta: delta(raw.control_tronco, praw.control_tronco, ' puntos') }
        : rango,
      { label: 'Tiempo de sostén', valor: raw.mejor_tiempo_segundos ?? null, unidad: 's', delta: delta(raw.mejor_tiempo_segundos, praw.mejor_tiempo_segundos, ' s', 1) },
      { label: 'Intentos', valor: raw.intentos ?? null, unidad: '', delta: delta(raw.intentos, praw.intentos, '') },
    ]
  }
  return [
    equilibrio,
    rango,
    { label: 'Estrellas alcanzadas', valor: raw.estrellas_alcanzadas ?? null, unidad: '', delta: delta(raw.estrellas_alcanzadas, praw.estrellas_alcanzadas, ' estrellas') },
    raw.tiempo_reaccion_s != null
      ? { label: 'Tiempo de reacción', valor: raw.tiempo_reaccion_s, unidad: 's', delta: delta(raw.tiempo_reaccion_s, praw.tiempo_reaccion_s, ' s', 2) }
      : { label: 'Movimientos de pies', valor: raw.movimientos_pies ?? null, unidad: '', delta: null },
  ]
}

function armarBarras(s: SesionDetalle, mejorPrevio: number | null): Barra[] {
  const m = s.metricas_sesion
  const barras: Barra[] = []
  if (m?.estabilidad_score != null) {
    barras.push({ label: 'Estabilidad central', porcentaje: m.estabilidad_score, referencia: `Objetivo ${OBJETIVO_ESTABILIDAD}` })
  }
  if (m?.precision_porcentaje != null) {
    barras.push({ label: 'Precisión de movimiento', porcentaje: m.precision_porcentaje, referencia: `Objetivo ${OBJETIVO_PRECISION}` })
  }
  // Métricas calculadas con MediaPipe (ver KinetixAI.getMetricasResumen); solo si existen.
  const raw = (m?.datos_ia_raw ?? {}) as Raw
  if (s.juego === 'surf' && raw.control_lateral != null) {
    barras.push({ label: 'Control lateral', porcentaje: raw.control_lateral, referencia: 'Objetivo 70' })
  }
  if (raw.coordinacion != null) {
    barras.push({ label: 'Coordinación mano–vista', porcentaje: raw.coordinacion, referencia: 'Objetivo 75' })
  }
  if (raw.control_tronco != null) {
    barras.push({ label: 'Control del tronco', porcentaje: raw.control_tronco, referencia: 'Objetivo 75' })
  }
  if (s.juego === 'flamenco' && raw.apoyo_der_pct != null && raw.apoyo_izq_pct != null) {
    barras.push({ label: 'Apoyo · pierna derecha', porcentaje: raw.apoyo_der_pct, referencia: 'del tiempo en una pierna' })
    barras.push({ label: 'Apoyo · pierna izquierda', porcentaje: raw.apoyo_izq_pct, referencia: 'del tiempo en una pierna' })
  }

  const actual = resultadoNum(s.juego, raw)
  if (actual != null && mejorPrevio != null && mejorPrevio > 0) {
    barras.push({
      label: 'Resultado vs. mejor marca previa',
      porcentaje: Math.round((actual / mejorPrevio) * 100),
      referencia: `Marca previa ${fmt(mejorPrevio, 1)}`,
    })
  }
  return barras
}

function Etiqueta({ texto, fondo, color }: { texto: string; fondo: string; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-full h-6 px-3 text-[9px] font-bold ${fondo} ${color}`}>{texto}</span>
  )
}

function Observacion({ etiqueta, fondo, color, texto }: { etiqueta: string; fondo: string; color: string; texto?: string }) {
  if (!texto) return null
  return (
    <div>
      <Etiqueta texto={etiqueta} fondo={fondo} color={color} />
      <p className="text-[12px] leading-[1.5] text-[#61698a] mt-2">{texto}</p>
    </div>
  )
}

export function Esqueleto({ className }: { className: string }) {
  return <div className={`rounded-[18px] bg-white/70 animate-pulse ${className}`} />
}

// El análisis de una sesión (resumen, métricas, rendimiento y observaciones), el mismo en /analisis y en /sesiones/:id.
// `sel` es la fila de la lista (se muestra enseguida); `detalle` llega después. `sesiones` sirve para comparar con la
// sesión anterior del mismo paciente y juego.
export default function AnalisisSesion({
  sel,
  detalle,
  sesiones,
  ia,
  cargandoDetalle,
  cargandoIa,
}: {
  sel: SesionRow
  detalle: SesionDetalle | null
  sesiones: SesionRow[]
  ia: AnalisisIA | null
  cargandoDetalle: boolean
  cargandoIa: boolean
}) {
  // Sesiones anteriores del mismo paciente y juego (la lista viene ordenada de más nueva a más vieja).
  const previas = useMemo(
    () => sesiones.filter(
      (s) => s.id !== sel.id && s.juego === sel.juego && s.pacientes?.id === sel.pacientes?.id && s.iniciada_en < sel.iniciada_en,
    ),
    [sesiones, sel],
  )
  const prev = previas[0] ?? null

  const mejorPrevio = useMemo(() => {
    const valores = previas
      .map((s) => resultadoNum(s.juego, (s.metricas_sesion?.datos_ia_raw ?? {}) as Raw))
      .filter((v): v is number => v != null)
    return valores.length ? Math.max(...valores) : null
  }, [previas])

  const m = detalle?.metricas_sesion ?? null
  const actual = detalle ? resultadoNum(detalle.juego, (m?.datos_ia_raw ?? {}) as Raw) : null
  const anterior = prev ? resultadoNum(prev.juego, (prev.metricas_sesion?.datos_ia_raw ?? {}) as Raw) : null
  const variacion = actual != null && anterior != null && anterior > 0 ? Math.round(((actual - anterior) / anterior) * 100) : null

  const comparacion =
    variacion == null
      ? { texto: 'Primera sesión de este juego', color: 'text-[#61698a]' }
      : { texto: `${variacion >= 0 ? '↑' : '↓'} ${Math.abs(variacion)}% vs. sesión anterior`, color: variacion >= 0 ? 'text-[#2ead6e]' : 'text-[#e82e91]' }
  const insignia =
    variacion == null
      ? { texto: 'Primera sesión', fondo: 'bg-[#edf0ff]', color: 'text-[#3038b8]' }
      : variacion > 0
        ? { texto: 'Buen progreso', fondo: 'bg-[#ebfaf0]', color: 'text-[#2ead6e]' }
        : variacion === 0
          ? { texto: 'Sin cambios', fondo: 'bg-[#edf0ff]', color: 'text-[#3038b8]' }
          : { texto: 'A reforzar', fondo: 'bg-[#ffedf7]', color: 'text-[#e82e91]' }

  const titulo = TITULO[sel.juego] ?? sel.juego
  const detalleIA = ia?.detalle ?? null
  const textoPlano = !detalleIA ? ia?.analisis ?? null : null

  return (
    <div className="space-y-5">
      {/* Barra resumen */}
      <div className={`${CARD} px-[22px] py-3.5 flex flex-wrap items-center gap-x-8 gap-y-3`}>
        <div className="min-w-[150px]">
          <p className="text-[15px] font-semibold text-[#1a1f6e]">{titulo}</p>
          <p className="text-[11px] font-medium text-[#2ead6e]">{sel.estado === 'finalizada' ? 'Sesión completada' : sel.estado}</p>
        </div>
        <span className="hidden lg:block w-px h-[38px] bg-[#e0e3f5]" />
        <div>
          <p className="text-[10px] font-semibold text-[#61698a]">Duración</p>
          <p className="text-[15px] font-bold text-[#1a1f6e]">{fmtDuracion(sel.duracion_segundos)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-[#61698a]">Resultado</p>
          <p className="text-[15px] font-bold text-[#1a1f6e]">{resultadoPrincipal(sel)}</p>
        </div>
        {sel.juego === 'estrellas' && typeof (m?.datos_ia_raw as Raw | null)?.movimientos_pies === 'number' && (
          <div>
            <p className="text-[10px] font-semibold text-[#61698a]">Mov. de pies</p>
            <p className="text-[15px] font-bold text-[#1a1f6e]">{(m!.datos_ia_raw as Raw).movimientos_pies}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold text-[#61698a]">Comparación</p>
          <p className={`text-[14px] font-semibold ${comparacion.color}`}>{cargandoDetalle ? '…' : comparacion.texto}</p>
        </div>
        <span className={`ml-auto inline-flex items-center justify-center h-[38px] min-w-[157px] rounded-[12px] px-4 text-[12px] font-semibold ${insignia.fondo} ${insignia.color}`}>
          {insignia.texto}
        </span>
      </div>
  
      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {cargandoDetalle || !detalle
          ? [0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-[150px]" />)
          : armarTarjetas(detalle, prev).map((t, i) => {
              const c = PALETA[i]
              return (
                <div key={t.label} className={`${CARD} p-[18px] min-h-[150px]`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[12px] font-bold ${c.fondo} ${c.texto}`}>●</span>
                    <p className="text-[10px] font-semibold text-[#61698a] uppercase">{t.label}</p>
                  </div>
                  <p className="mt-4 flex items-baseline gap-2">
                    <span className="text-[30px] leading-[1.2] font-bold text-[#1a1f6e]">{t.valor == null ? '—' : fmt(t.valor, t.label === 'Tiempo de reacción' ? 2 : 1)}</span>
                    {t.valor != null && t.unidad && <span className="text-[13px] font-semibold text-[#61698a]">{t.unidad}</span>}
                  </p>
                  {t.delta && <p className={`text-[11px] font-semibold mt-3 ${c.texto}`}>{t.delta}</p>}
                </div>
              )
            })}
      </div>
  
      {/* Rendimiento + observaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,688fr)_minmax(0,370fr)] gap-5">
        <div className={`${CARD} p-6 min-h-[294px]`}>
          <h2 className="text-[18px] font-bold text-[#1a1f6e]">Rendimiento de la sesión</h2>
          <p className="text-[12px] text-[#61698a]">Comparación con el objetivo recomendado</p>
  
          {cargandoDetalle || !detalle ? (
            <div className="mt-8 space-y-6">
              {[0, 1, 2].map((i) => <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" />)}
            </div>
          ) : (
            (() => {
              const barras = armarBarras(detalle, mejorPrevio)
              if (barras.length === 0) {
                return <p className="text-[13px] text-[#61698a] mt-8">Esta sesión no tiene métricas de movimiento registradas todavía.</p>
              }
              return (
                <div className="mt-6 space-y-5">
                  {barras.map((b, i) => (
                    <div key={b.label} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#1a1f6e] mb-2">{b.label}</p>
                        <div className="h-[10px] rounded-[5px] bg-[#ebedf7] overflow-hidden">
                          <div className={`h-full rounded-[5px] ${PALETA[i % PALETA.length].barra}`} style={{ width: `${Math.max(0, Math.min(100, b.porcentaje))}%` }} />
                        </div>
                      </div>
                      <div className="w-[96px] text-right">
                        <p className={`text-[12px] font-bold ${PALETA[i % PALETA.length].texto}`}>{fmt(b.porcentaje)}%</p>
                        <p className="text-[10px] text-[#61698a]">{b.referencia}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()
          )}
        </div>
  
        <div className={`${CARD} p-6 min-h-[294px]`}>
          <h2 className="text-[18px] font-bold text-[#1a1f6e]">Observaciones</h2>
          {cargandoIa ? (
            <div className="mt-5 space-y-4">
              {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />)}
            </div>
          ) : detalleIA ? (
            <div className="mt-5 space-y-5">
              <Observacion etiqueta="FORTALEZA" fondo="bg-[#ebfaf0]" color="text-[#2ead6e]" texto={detalleIA.fortaleza} />
              <Observacion etiqueta="A MEJORAR" fondo="bg-[#e4effc]" color="text-[#6296d8]" texto={detalleIA.a_mejorar} />
              <Observacion etiqueta="PRÓXIMA META" fondo="bg-[#ffedf7]" color="text-[#e82e91]" texto={detalleIA.proxima_meta} />
            </div>
          ) : textoPlano ? (
            <p className="text-[12px] leading-[1.6] text-[#61698a] mt-5">{textoPlano}</p>
          ) : (
            <p className="text-[12px] text-[#61698a] mt-5">El análisis de IA no está disponible por ahora.</p>
          )}
        </div>
      </div>
  
      {/* Sugerencia + mensaje */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={`${CARD} p-6 min-h-[190px] flex flex-col`}>
          <h2 className="text-[17px] font-bold text-[#1a1f6e]">Sugerencia para la próxima sesión</h2>
          <p className="text-[13px] leading-[1.6] text-[#61698a] mt-3 flex-1">
            {cargandoIa ? '…' : detalleIA?.sugerencia ?? 'Todavía no hay una sugerencia para esta sesión.'}
          </p>
          {!!detalleIA?.areas?.length && (
            <div className="flex flex-wrap gap-2.5 mt-4">
              {detalleIA.areas.map((a, i) => (
                <span
                  key={a}
                  className={`inline-flex items-center rounded-full h-[30px] px-4 text-[10px] font-semibold ${i === 0 ? 'bg-[#edf0ff] text-[#3038b8]' : 'bg-[#ffedf7] text-[#e82e91]'}`}
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
  
        <div className={`${CARD} relative overflow-hidden p-6 pl-[30px] min-h-[190px]`}>
          <span className="absolute inset-y-0 left-0 w-2 bg-[#ffaac0]" aria-hidden="true" />
          <h2 className="text-[17px] font-bold text-[#1a1f6e]">{FRASE[sel.juego]}</h2>
          <p className="text-[14px] leading-[1.55] font-medium text-[#1a1f6e] mt-3">
            {cargandoIa ? '…' : `“${detalleIA?.mensaje ?? 'Cada sesión te acerca un paso más a tu objetivo. ¡Seguí así!'}”`}
          </p>
        </div>
      </div>
    </div>
  )
}
