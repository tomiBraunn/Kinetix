import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getSesion,
  getAnalisisIA,
  type SesionDetalle,
  JUEGO_LABEL,
  JUEGO_ICON,
  formatFecha,
} from '../lib/sesiones'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-[18px] p-5 shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)]">
      <p className={`${String(value).length > 10 ? 'text-lg' : 'text-2xl'} font-black text-primary`}>{value}</p>
      <p className="text-text-muted text-xs font-semibold mt-0.5">{label}</p>
    </div>
  )
}

// `giro`: grados que hay que girar el video para verlo parado (la cámara estaba de costado, ver
// front/src/ia/rotacion.js). Solo se usa con el video crudo: los otros dos se grabaron ya parados.
function VideoOVacio({ url, label, giro = 0 }: { url: string | null; label: string; giro?: number }) {
  const sombra = 'shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)]'
  let contenido
  if (!url) {
    contenido = (
      <div className={`w-full aspect-video rounded-[18px] ${sombra} bg-slate-100 flex flex-col items-center justify-center gap-2`}>
        <span className="material-symbols-rounded text-[32px] text-text-placeholder">videocam_off</span>
        <p className="text-text-muted text-xs font-semibold">{label} no disponible</p>
      </div>
    )
  } else if (giro === 90 || giro === 270) {
    // Girado un cuarto de vuelta ocupa el alto por el ancho: la caja es vertical y el video se acuesta adentro
    contenido = (
      <div className={`relative w-full overflow-hidden rounded-[18px] ${sombra} bg-black`} style={{ aspectRatio: '3 / 4' }}>
        <video
          src={url}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="absolute left-1/2 top-1/2 object-contain"
          style={{ width: '133.333%', height: '75%', transform: `translate(-50%, -50%) rotate(${giro}deg)` }}
        />
      </div>
    )
  } else {
    contenido = (
      <video
        src={url}
        autoPlay
        muted
        loop
        playsInline
        controls
        className={`w-full rounded-[18px] ${sombra} bg-black aspect-video`}
        style={giro === 180 ? { transform: 'rotate(180deg)' } : undefined}
      />
    )
  }
  return (
    <figure>
      <figcaption className="text-text-muted text-xs font-bold mb-1.5">{label}</figcaption>
      {contenido}
    </figure>
  )
}

// Dónde aparecieron los peces en esa ronda: alto (largos de tronco sobre los hombros) y ancho (grados a cada lado)
function zonaAparicion(z: unknown): string | null {
  const o = z as { altoMin?: number; altoMax?: number; ancho?: number } | null
  if (!o || typeof o.altoMin !== 'number' || typeof o.altoMax !== 'number' || typeof o.ancho !== 'number') return null
  return `alto ${String(o.altoMin).replace('.', ',')}–${String(o.altoMax).replace('.', ',')} · ±${o.ancho}°`
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

const DIFICULTAD: Record<string, string> = { progresiva: 'Subiendo de a poco', flamenco: 'Pierna despegada', alto: 'Rodilla alta', facil: 'Fácil', media: 'Media', dificil: 'Difícil' }

// La rutina que se armó antes de jugar: cuántas repeticiones y cómo iba la dificultad (las sesiones viejas no la traen)
function rutinaStats(raw: Record<string, unknown>, repeticiones: string): { label: string; value: string | number }[] {
  const r = raw.rutina as { repeticiones?: unknown; dificultad?: unknown } | null | undefined
  if (!r || typeof r !== 'object') return []
  return [
    ...(num(r.repeticiones) != null ? [{ label: repeticiones, value: r.repeticiones as number }] : []),
    ...(typeof r.dificultad === 'string' ? [{ label: 'Dificultad', value: DIFICULTAD[r.dificultad] ?? r.dificultad }] : []),
  ]
}

// Grados que el paciente giró la cámara en esa ronda (0 si nunca la giró o la sesión es vieja)
function giroCamara(s: SesionDetalle): number {
  const g = num((s.metricas_sesion?.datos_ia_raw as Record<string, unknown> | null)?.rotacion_camara)
  return g === 90 || g === 180 || g === 270 ? g : 0
}

// Cada juego guarda su propio JSON en datos_ia_raw — mapeamos los campos
// relevantes por tipo de juego en vez de intentar generalizar una sola forma.
function statsPorJuego(s: SesionDetalle): { label: string; value: string | number }[] {
  const raw = (s.metricas_sesion?.datos_ia_raw ?? {}) as Record<string, unknown>
  if (s.juego === 'surf') {
    return [
      { label: 'Peces atrapados', value: (raw.puntos as number) ?? '—' },
      { label: 'Duración', value: raw.duracion_segundos ? `${raw.duracion_segundos}s` : '—' },
      // Las rondas jugadas antes de que existieran los niveles no lo traen
      ...(num(raw.nivel_maximo) != null ? [{ label: 'Nivel alcanzado', value: `${raw.nivel_maximo} de 4` }] : []),
      // Cuántas veces la IA avisó que movió de más los pies o la cadera, y a qué altura estuvo la curva de los peces
      ...(num(raw.alertas_movimiento) != null ? [{ label: 'Alertas de movimiento', value: raw.alertas_movimiento as number }] : []),
      ...(zonaAparicion(raw.zona_aparicion) ? [{ label: 'Zona de aparición', value: zonaAparicion(raw.zona_aparicion)! }] : []),
      ...rutinaStats(raw, 'Peces a atrapar'),
    ]
  }
  if (s.juego === 'flamenco') {
    // La última repetición es la de "aguantar todo lo que puedas" (sin objetivo): su tiempo es el que mide la resistencia
    const pasos = Array.isArray(raw.pasos) ? (raw.pasos as { saltado?: boolean; segundos?: number; objetivo_segundos?: number | null }[]) : []
    const ultima = pasos.at(-1)
    return [
      { label: 'Mejor tiempo en equilibrio', value: raw.mejor_tiempo_segundos ? `${raw.mejor_tiempo_segundos}s` : '—' },
      { label: 'Intentos', value: (raw.intentos as number) ?? '—' },
      ...(ultima && ultima.objetivo_segundos === null && !ultima.saltado && num(ultima.segundos) != null ? [{ label: 'Última repetición', value: `${String(ultima.segundos).replace('.', ',')}s` }] : []),
      ...rutinaStats(raw, 'Repeticiones'),
    ]
  }
  if (s.juego === 'estrellas') {
    return [
      { label: 'Estrellas alcanzadas', value: (raw.estrellas_alcanzadas as number) ?? '—' },
      { label: 'Movimientos de pies', value: (raw.movimientos_pies as number) ?? '—' },
    ]
  }
  return []
}

// Métricas que calcula MediaPipe a partir del tracking del cuerpo — distintas
// del puntaje del juego. No todas las sesiones las tienen (juegos viejos,
// jugados con las teclas de testing, no las generan).
function metricasIA(s: SesionDetalle): { label: string; value: string }[] {
  const m = s.metricas_sesion
  if (!m) return []
  const out: { label: string; value: string }[] = []
  if (m.estabilidad_score != null) out.push({ label: 'Estabilidad', value: `${m.estabilidad_score}%` })
  if (m.precision_porcentaje != null) out.push({ label: 'Precisión de movimiento', value: `${m.precision_porcentaje}%` })
  if (m.rango_movimiento_avg != null) out.push({ label: 'Rango de movimiento (prom.)', value: `${m.rango_movimiento_avg}°` })
  if (m.rango_movimiento_max != null) out.push({ label: 'Rango de movimiento (máx.)', value: `${m.rango_movimiento_max}°` })
  // Estas dos van dentro de datos_ia_raw (no tienen columna propia); null si la IA no tuvo muestras suficientes
  const raw = (m.datos_ia_raw ?? {}) as Record<string, unknown>
  const coordinacion = num(raw.coordinacion)
  const reaccion = num(raw.tiempo_reaccion_s)
  if (coordinacion != null) out.push({ label: 'Coordinación', value: `${coordinacion}%` })
  if (reaccion != null) out.push({ label: 'Tiempo de reacción', value: `${String(reaccion).replace('.', ',')} s` })
  return out
}

// Comentario en texto generado a partir de las métricas — reglas simples
// sobre los umbrales, no una llamada a un modelo generativo. Se arma acá
// (no en el backend) porque solo depende de datos que ya llegaron al cliente.
function comentarioIA(s: SesionDetalle): string | null {
  const m = s.metricas_sesion
  if (!m) return null

  const partes: string[] = []
  if (m.estabilidad_score != null) {
    if (m.estabilidad_score >= 80) partes.push('una estabilidad postural muy buena')
    else if (m.estabilidad_score >= 60) partes.push('una estabilidad postural aceptable, con margen de mejora')
    else partes.push('dificultad para sostener la estabilidad postural')
  }
  if (m.precision_porcentaje != null) {
    if (m.precision_porcentaje >= 85) partes.push('una precisión de movimiento muy alta')
    else if (m.precision_porcentaje >= 65) partes.push('una precisión de movimiento dentro de lo esperado')
    else partes.push('una precisión de movimiento por debajo del objetivo')
  }
  if (partes.length === 0) return null

  const juego = JUEGO_LABEL[s.juego] ?? s.juego
  let texto = `Durante la sesión de ${juego}, el paciente mostró ${partes.join(' y ')}`
  if (m.rango_movimiento_avg != null) {
    texto += `, con un rango de movimiento promedio de ${m.rango_movimiento_avg}°`
  }
  texto += '.'

  if (m.estabilidad_score != null && m.precision_porcentaje != null) {
    texto += m.estabilidad_score >= 75 && m.precision_porcentaje >= 75
      ? ' El patrón de movimiento sugiere una buena evolución del control motor y el equilibrio.'
      : ' Se recomienda reforzar ejercicios de equilibrio y control postural en las próximas sesiones.'
  }

  return texto
}

export default function ResultadoSesion() {
  const { sesionId } = useParams<{ sesionId: string }>()
  const [sesion, setSesion] = useState<SesionDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analisisGenerativo, setAnalisisGenerativo] = useState<string | null>(null)

  useEffect(() => {
    if (!sesionId) return
    let active = true
    getSesion(sesionId)
      .then((data) => { if (active) setSesion(data) })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar la sesión') })
      .finally(() => { if (active) setLoading(false) })
    // No bloquea la pantalla: si el modelo tarda o falla, se queda con el
    // comentario por reglas que ya se muestra igual.
    getAnalisisIA(sesionId)
      .then((data) => { if (active && data.analisis) setAnalisisGenerativo(data.analisis) })
      .catch(() => {})
    return () => { active = false }
  }, [sesionId])

  // Los videos se suben apenas termina el juego, en paralelo a la navegación a
  // esta pantalla: si todavía no están, reintenta unos segundos.
  const sinVideos = !!sesion && !sesion.videos_sesion
  useEffect(() => {
    if (!sesionId || !sinVideos) return
    let active = true
    let intentos = 0
    const timer = setInterval(() => {
      if (++intentos > 18) { clearInterval(timer); return }
      getSesion(sesionId)
        .then((data) => {
          if (active && data.videos_sesion) { setSesion(data); clearInterval(timer) }
        })
        .catch(() => {})
    }, 5000)
    return () => { active = false; clearInterval(timer) }
  }, [sesionId, sinVideos])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded bg-white/70 animate-pulse" />
        <div className="h-40 rounded-[18px] bg-white/70 animate-pulse" />
      </div>
    )
  }

  if (error || !sesion) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <span className="material-symbols-rounded text-[48px] text-rose-400">error</span>
        <h2 className="text-xl font-black text-primary mt-4">Sesión no encontrada</h2>
        <p className="text-text-muted font-medium mt-1">{error ?? 'Esa sesión no existe o no te pertenece.'}</p>
        <Link to="/analisis" className="inline-flex items-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-6 py-3 mt-6 hover:bg-[#C83890]">
          <span className="material-symbols-rounded text-[18px]">arrow_back</span>
          Volver a análisis
        </Link>
      </div>
    )
  }

  const volverA = sesion.pacientes ? `/pacientes/${sesion.pacientes.id}` : '/analisis'

  return (
    <div className="max-w-5xl mx-auto">
      <Link to={volverA} className="inline-flex items-center gap-1 text-text-muted text-sm font-bold hover:text-accent mb-6">
        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
        Volver
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 lg:order-2">
          <VideoOVacio url={sesion.videos_sesion?.url_crudo ?? null} label="Video de la cámara" giro={giroCamara(sesion)} />
          <VideoOVacio url={sesion.videos_sesion?.url_landmarks ?? null} label="Video con detección de IA" />
          <VideoOVacio url={sesion.videos_sesion?.url_gameplay ?? null} label="Video del juego" />
        </div>

        <div>
          <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-6 lg:p-8 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 rounded-[12px] bg-violet-50 text-primary flex items-center justify-center">
                <span className="material-symbols-rounded text-[20px]">{JUEGO_ICON[sesion.juego] ?? 'sports_esports'}</span>
              </span>
              <h1 className="text-2xl font-black text-primary">{JUEGO_LABEL[sesion.juego] ?? sesion.juego}</h1>
            </div>
            <p className="text-text-muted font-medium">
              {sesion.pacientes ? `${sesion.pacientes.nombre} ${sesion.pacientes.apellido} — ` : ''}
              {formatFecha(sesion.iniciada_en)}
            </p>
            <p className="text-text-muted/70 text-xs font-mono mt-1 select-all">ID de sesión: {sesion.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {statsPorJuego(sesion).map((s) => (
              <Stat key={s.label} label={s.label} value={s.value} />
            ))}
            <Stat label="Duración total" value={sesion.duracion_segundos != null ? `${sesion.duracion_segundos}s` : '—'} />
            <Stat label="Estado" value={sesion.estado === 'finalizada' ? 'Finalizada' : sesion.estado} />
          </div>

          {(metricasIA(sesion).length > 0 || analisisGenerativo || comentarioIA(sesion)) && (
            <div className="mt-6 bg-primary rounded-[18px] p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-rounded text-[20px] text-accent-light">auto_awesome</span>
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">Análisis de IA — MediaPipe</p>
              </div>
              {metricasIA(sesion).length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {metricasIA(sesion).map((m) => (
                    <div key={m.label}>
                      <p className="text-2xl font-black">{m.value}</p>
                      <p className="text-white/70 text-xs font-semibold mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {(analisisGenerativo || comentarioIA(sesion)) && (
                <p className={`text-white/90 text-sm leading-relaxed ${metricasIA(sesion).length > 0 ? 'mt-5 pt-5 border-t border-white/15' : ''}`}>
                  {analisisGenerativo ?? comentarioIA(sesion)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
