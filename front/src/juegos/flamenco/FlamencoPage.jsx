// Flamenco Challenge según los frames de Figma (archivo y8NlmFOJusZ1nl1jvvZdBo,
// página JUEGOS). El flujo y las reglas están en logica.js; las piezas de pantalla
// en pantallas.jsx; el parque por capas en EscenaParque.jsx.
import { useState, useEffect, useRef, useReducer, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EscenaParque from './EscenaParque'
import { BarraSuperior, GuiaSilueta } from '../surf/pantallas'
import { PastillaTiempo, PastillaProgreso, ConsignaCentrada, TarjetaSesion, AntesDeEmpezarFlamenco } from './pantallas'
import { estadoInicial, reducir, segundosSostenidos, resumen, REPETICIONES } from './logica'
import { CONSIGNAS, TARJETA_COMENZAR, TARJETAS_DESCANSO, TARJETA_COMPLETADO } from './mensajes'
import { dibujarHud } from './hud'
import { usePoseAI } from '../../ia/usePoseAI'
import { kinetixAI } from '../../ia/KinetixAI'
import { openCamera, closeCamera } from '../../ia/CameraStream'
import { useSessionRecorder } from '../../ia/useSessionRecorder'
import { crearSesion, finalizarSesion, subirVideosSesion, mandarEventosSesion } from '../../lib/sesiones.ts'

const HEADER_H = 48

// Hasta que el paciente esté bien detectado hay solo un fondo liso; el parque entra después
const CON_ESCENA = ['preparando', 'practica-levantar', 'practica-equilibrio', 'comenzar', 'levantar', 'equilibrio', 'descanso', 'completado']
const CON_TIEMPO = ['calibracion', 'preparando', 'practica-levantar', 'practica-equilibrio', 'levantar', 'equilibrio']
const LEVANTAR = ['practica-levantar', 'levantar']

export default function FlamencoPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const pacienteId = params.get('pacienteId')
  const sesionIdRef = useRef(null)
  const eventosRef = useRef([])
  const inicioRef = useRef(0)
  const { start: iniciarGrabacion, stop: detenerGrabacion } = useSessionRecorder()

  const [estado, dispatch] = useReducer(reducir, undefined, estadoInicial)
  const [segundos, setSegundos] = useState(0)
  const [pausado, setPausado] = useState(false)
  const { fase, rep, completadas } = estado
  const estadoRef = useRef(estado)
  useEffect(() => { estadoRef.current = estado })
  const enviar = useCallback((tipo) => dispatch({ tipo, ahora: performance.now() }), [])

  // Tamaño real del área de juego: los canvas se dimensionan con esto (ver GamePage del Surf)
  const areaRef = useRef(null)
  const [tam, setTam] = useState({ w: window.innerWidth, h: window.innerHeight - HEADER_H })
  const { canvasRef: camaraCanvasRef, siluetaRef } = usePoseAI('flamenco', !pausado, HEADER_H)
  // Canvas fuera de pantalla con la consigna y las pastillas: el grabador lo usa como "gameplay"
  const hudCanvasRef = useRef(null)
  if (hudCanvasRef.current === null) hudCanvasRef.current = document.createElement('canvas')

  // Abre la cámara (usePoseAI y la grabación toman el stream compartido)
  useEffect(() => {
    openCamera().catch(err => console.warn('Cámara no disponible:', err))
    return () => closeCamera()
  }, [])

  useEffect(() => {
    const observador = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width)
      const h = Math.round(e.contentRect.height)
      setTam(t => (t.w === w && t.h === h ? t : { w, h }))
    })
    observador.observe(areaRef.current)
    return () => observador.disconnect()
  }, [])

  // Eventos de la detección de pierna (KinetixAI, modo 'flamenco')
  useEffect(() => {
    window.kinetix = window.kinetix || {}
    window.kinetix.onPiernaLevantada = () => enviar('piernaLevantada')
    window.kinetix.onPiernaBajada = () => enviar('piernaBajada')
    return () => {
      delete window.kinetix.onPiernaLevantada
      delete window.kinetix.onPiernaBajada
    }
  }, [enviar])

  // Reloj de equilibrio: cuenta mientras la pierna está arriba (en pausa se congela)
  useEffect(() => {
    if (pausado) return
    const id = setInterval(() => setSegundos(Math.floor(segundosSostenidos(estadoRef.current, performance.now()))), 100)
    return () => clearInterval(id)
  }, [pausado])

  // Los eventos solo avisan cuando la pierna cambia: si el paciente ya la tiene
  // levantada al empezar una repetición, no llegaría nunca el aviso.
  useEffect(() => {
    if (LEVANTAR.includes(fase) && kinetixAI.piernaLevantada) enviar('piernaLevantada')
  }, [fase, enviar])

  // Línea de tiempo para el kinesiólogo
  useEffect(() => {
    if (!sesionIdRef.current) return
    if (fase === 'equilibrio') eventosRef.current.push({ tipo: 'mensaje', mensaje: CONSIGNAS.equilibrio })
  }, [fase])
  useEffect(() => {
    if (completadas === 0 || !sesionIdRef.current) return
    eventosRef.current.push({ tipo: 'repeticion', datos: { numero: completadas, tiempo_segundos: estadoRef.current.tiempos[completadas - 1] } })
  }, [completadas])

  // Cierra la sesión: guarda resultados y sube videos y eventos. Sirve tanto para el
  // desafío completo como para cuando se vuelve al menú después de alguna repetición.
  const terminarSesion = useCallback(() => {
    const sesionId = sesionIdRef.current
    if (!sesionId) return
    sesionIdRef.current = null
    const eventos = eventosRef.current
    eventosRef.current = []
    const datos = { ...resumen(estadoRef.current), duracion_segundos: Math.max(1, Math.round((performance.now() - inicioRef.current) / 1000)) }

    finalizarSesion(sesionId, { juego: 'flamenco', ...datos }, kinetixAI.getMetricasResumen()).catch(console.warn)
    eventos.push({ tipo: 'fin_juego', datos })
    detenerGrabacion()
      .then(videos => {
        subirVideosSesion(sesionId, videos).catch(console.warn)
        mandarEventosSesion(sesionId, eventos).catch(console.warn)
      })
      .catch(console.warn)
  }, [detenerGrabacion])

  useEffect(() => {
    if (fase === 'completado') terminarSesion()
  }, [fase, terminarSesion])

  // La sesión y las métricas arrancan con "Comenzar las 3 repeticiones", no con la
  // práctica ni la calibración (ahí el paciente todavía se está acomodando).
  const comenzar = useCallback(() => {
    enviar('comenzar')
    kinetixAI.reiniciarMetricas()
    eventosRef.current = []
    inicioRef.current = performance.now()
    if (!pacienteId) return
    crearSesion(pacienteId, 'flamenco')
      .then(s => {
        sesionIdRef.current = s.id
        setTimeout(() => {
          iniciarGrabacion({ landmarksCanvas: camaraCanvasRef.current, gameCanvas: hudCanvasRef.current })
        }, 500)
      })
      .catch(console.warn)
  }, [enviar, pacienteId, iniciarGrabacion, camaraCanvasRef])

  // Salir antes de tiempo: si ya hubo repeticiones se guardan; si no, no hay nada que guardar
  const volver = useCallback(() => {
    if (estadoRef.current.completadas > 0) terminarSesion()
    navigate('/juego')
  }, [terminarSesion, navigate])

  const togglePausa = () => {
    enviar(pausado ? 'reanudar' : 'pausar')
    setPausado(p => !p)
  }

  const acciones = { comenzar, seguir: () => enviar('seguir'), volver }
  const tarjeta =
    fase === 'comenzar' ? TARJETA_COMENZAR
    : fase === 'descanso' ? TARJETAS_DESCANSO[completadas]
    : fase === 'completado' ? TARJETA_COMPLETADO
    : null
  const consigna = CONSIGNAS[fase] ?? null
  const progreso =
    fase === 'levantar' || fase === 'equilibrio' ? `Repetición ${rep} de ${REPETICIONES}`
    : fase === 'descanso' || fase === 'completado' ? `${completadas} de ${REPETICIONES} completadas`
    : null
  const conTiempo = CON_TIEMPO.includes(fase)

  // Lo mismo que se ve en pantalla, en el canvas que se graba
  useEffect(() => {
    hudCanvasRef.current.width = tam.w
    hudCanvasRef.current.height = tam.h
  }, [tam])
  useEffect(() => {
    dibujarHud(hudCanvasRef.current, { consigna, tiempo: conTiempo ? segundos : null, progreso })
  }, [tam, consigna, conTiempo, segundos, progreso])

  return (
    <div className={`relative flex h-dvh flex-col overflow-hidden [font-variation-settings:'opsz'_14] ${fase === 'instrucciones' ? '' : 'bg-[linear-gradient(180deg,#2f8fe8,#7cc4f6)]'}`}>
      {/* El parque cubre toda la pantalla, también detrás de la barra */}
      <EscenaParque activa={CON_ESCENA.includes(fase)} onEntro={() => enviar('escenaLista')} />

      <BarraSuperior
        conPausa={fase !== 'instrucciones' && fase !== 'completado'}
        conSalir={fase !== 'completado'}
        pausado={pausado}
        onPausa={togglePausa}
        onSalir={volver}
      />

      {/* Área de juego */}
      <div ref={areaRef} className="relative flex-1 overflow-hidden">

        {/* Cuerpo del paciente recortado por segmentación, sobre el parque */}
        <canvas
          ref={siluetaRef}
          width={tam.w}
          height={tam.h}
          style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none' }}
        />

        {/* Cámara + esqueleto de MediaPipe, abajo a la izquierda. Es el mismo canvas
            que se graba en el video de landmarks. */}
        <div className={`pointer-events-none absolute inset-x-0 bottom-[15px] z-20 mx-auto max-w-[402px] px-[15px] ${fase === 'instrucciones' ? 'invisible' : ''}`}>
          <canvas
            ref={camaraCanvasRef}
            width={180}
            height={135}
            aria-hidden="true"
            className="block h-[99px] w-[133px] rounded-[10px] border border-[#e3e3e3] shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)]"
          />
        </div>

        {conTiempo && <PastillaTiempo segundos={segundos} />}
        {progreso && <PastillaProgreso texto={progreso} />}
        {consigna && <ConsignaCentrada texto={consigna} />}

        {fase === 'calibracion' && (
          <GuiaSilueta
            pausado={pausado}
            onListo={(vista) => {
              kinetixAI.fijarVista(vista) // alinea (y si hace falta "aleja") la imagen del paciente con la silueta
              enviar('calibrado')
            }}
          />
        )}

        {tarjeta && (
          <TarjetaSesion
            titulo={tarjeta.titulo}
            texto={tarjeta.texto}
            botones={tarjeta.botones.map(({ accion, ...boton }) => ({ ...boton, onClick: acciones[accion] }))}
          />
        )}
        {fase === 'instrucciones' && <AntesDeEmpezarFlamenco onListo={() => enviar('listo')} />}
      </div>
    </div>
  )
}
