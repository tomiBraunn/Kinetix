import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getSesion,
  getSesiones,
  getAnalisisIA,
  type AnalisisIA,
  type SesionDetalle,
  type SesionRow,
  JUEGO_ICON,
  formatFecha,
} from '../lib/sesiones'
import AnalisisSesion, { CARD, TITULO } from '../components/AnalisisSesion'

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
  const r = raw.rutina as { repeticiones?: unknown; dificultad?: unknown; aLaVez?: unknown } | null | undefined
  if (!r || typeof r !== 'object') return []
  return [
    ...(num(r.repeticiones) != null ? [{ label: repeticiones, value: r.repeticiones as number }] : []),
    ...(typeof r.dificultad === 'string' ? [{ label: 'Dificultad', value: DIFICULTAD[r.dificultad] ?? r.dificultad }] : []),
    ...(num(r.aLaVez) != null ? [{ label: 'Peces a la vez', value: r.aLaVez as number }] : []),
  ]
}

// Grados que el paciente giró la cámara en esa ronda (0 si nunca la giró o la sesión es vieja)
function giroCamara(s: SesionDetalle): number {
  const g = num((s.metricas_sesion?.datos_ia_raw as Record<string, unknown> | null)?.rotacion_camara)
  return g === 90 || g === 180 || g === 270 ? g : 0
}

// Lo que el análisis de arriba no muestra: la rutina que se armó y datos propios de cada juego.
// (Cada juego guarda su propio JSON en datos_ia_raw, por eso se mapea por tipo de juego.)
function detallesExtra(s: SesionDetalle): { label: string; value: string | number }[] {
  const raw = (s.metricas_sesion?.datos_ia_raw ?? {}) as Record<string, unknown>
  if (s.juego === 'surf') {
    return [
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
      ...(ultima && ultima.objetivo_segundos === null && !ultima.saltado && num(ultima.segundos) != null ? [{ label: 'Última repetición', value: `${String(ultima.segundos).replace('.', ',')}s` }] : []),
      ...rutinaStats(raw, 'Repeticiones'),
    ]
  }
  return []
}

// Los tres videos de la sesión de a uno: flechas (o los puntos) para pasar de uno a otro.
// Se monta un solo <video> a la vez, así solo suena y reproduce el que se está viendo.
function CarruselVideos({ videos, giro }: { videos: SesionDetalle['videos_sesion']; giro: number }) {
  const items = [
    { label: 'Video de la cámara', url: videos?.url_crudo ?? null, giro },
    { label: 'Video con detección de IA', url: videos?.url_landmarks ?? null, giro: 0 },
    { label: 'Video del juego', url: videos?.url_gameplay ?? null, giro: 0 },
  ]
  const [i, setI] = useState(0)
  const ir = (d: number) => setI((n) => (n + d + items.length) % items.length)
  const flecha = 'absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 text-primary shadow-md flex items-center justify-center hover:bg-white cursor-pointer'

  return (
    <div className={`${CARD} p-5 h-full flex flex-col justify-center`}>
      <div className="relative">
        <VideoOVacio key={i} url={items[i].url} label={items[i].label} giro={items[i].giro} />
        <button type="button" aria-label="Video anterior" onClick={() => ir(-1)} className={`${flecha} left-2`}>
          <span className="material-symbols-rounded text-[24px]">chevron_left</span>
        </button>
        <button type="button" aria-label="Video siguiente" onClick={() => ir(1)} className={`${flecha} right-2`}>
          <span className="material-symbols-rounded text-[24px]">chevron_right</span>
        </button>
      </div>
      <div className="flex justify-center gap-2 mt-4">
        {items.map((it, n) => (
          <button
            key={it.label}
            type="button"
            aria-label={it.label}
            onClick={() => setI(n)}
            className={`h-2 rounded-full cursor-pointer transition-all ${n === i ? 'w-6 bg-accent' : 'w-2 bg-[#e0e3f5]'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function ResultadoSesion() {
  const { sesionId } = useParams<{ sesionId: string }>()
  const [sesion, setSesion] = useState<SesionDetalle | null>(null)
  const [sesiones, setSesiones] = useState<SesionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [cargandoLista, setCargandoLista] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ia, setIa] = useState<AnalisisIA | null>(null)
  const [cargandoIa, setCargandoIa] = useState(true)

  useEffect(() => {
    if (!sesionId) return
    let active = true
    getSesion(sesionId)
      .then((data) => { if (active) setSesion(data) })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar la sesión') })
      .finally(() => { if (active) setLoading(false) })
    // Las demás sesiones sirven para comparar con la anterior del mismo paciente y juego
    getSesiones()
      .then((data) => { if (active) setSesiones(data) })
      .catch(() => {})
      .finally(() => { if (active) setCargandoLista(false) })
    // No bloquea la pantalla: si el modelo tarda o falla, el resto se muestra igual.
    getAnalisisIA(sesionId)
      .then((data) => { if (active) setIa(data) })
      .catch(() => {})
      .finally(() => { if (active) setCargandoIa(false) })
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
      <div className="max-w-[1082px] mx-auto space-y-4">
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
  const titulo = TITULO[sesion.juego] ?? sesion.juego
  const extras = detallesExtra(sesion)

  return (
    <div className="max-w-[1082px] mx-auto space-y-5">
      <Link to={volverA} className="inline-flex items-center gap-1 text-text-muted text-sm font-bold hover:text-accent">
        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
        Volver
      </Link>

      <div className="flex items-start gap-3">
        <span className="w-11 h-11 shrink-0 rounded-[12px] bg-violet-50 text-primary flex items-center justify-center">
          <span className="material-symbols-rounded text-[22px]">{JUEGO_ICON[sesion.juego] ?? 'sports_esports'}</span>
        </span>
        <div className="min-w-0">
          <h1 className="text-[26px] lg:text-[30px] leading-[1.2] font-bold text-[#1a1f6e]">Análisis del juego {titulo}</h1>
          <p className="text-[14px] text-[#61698a] mt-1.5">
            {sesion.pacientes ? `${sesion.pacientes.nombre} ${sesion.pacientes.apellido} — ` : ''}
            {formatFecha(sesion.iniciada_en)}
          </p>
          <p className="text-text-muted/70 text-xs font-mono mt-1 select-all">ID de sesión: {sesion.id}</p>
        </div>
      </div>

      <AnalisisSesion
        sel={sesion}
        detalle={sesion}
        sesiones={sesiones}
        ia={ia}
        cargandoDetalle={cargandoLista}
        cargandoIa={cargandoIa}
        lateral={<CarruselVideos videos={sesion.videos_sesion} giro={giroCamara(sesion)} />}
      />

      {extras.length > 0 && (
        <div className={`${CARD} p-6`}>
          <h2 className="text-[18px] font-bold text-[#1a1f6e]">Datos de la rutina</h2>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
            {extras.map((e) => (
              <div key={e.label}>
                <p className="text-[10px] font-semibold text-[#61698a] uppercase">{e.label}</p>
                <p className="text-[15px] font-bold text-[#1a1f6e] mt-1">{e.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
