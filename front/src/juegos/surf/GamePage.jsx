import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PhaserGame from './PhaserGame'
import Escena from './Escena'
import {
  BarraSuperior, Contadores, ControlMusica, Consigna, Mensaje, GuiaSilueta, AntesDeEmpezar, DesafioCompletado,
} from './pantallas'
import { textoMensaje } from './mensajes'
import { usePoseAI } from '../../ia/usePoseAI'
import { kinetixAI } from '../../ia/KinetixAI'
import { useSessionRecorder } from '../../ia/useSessionRecorder'
import { crearSesion, finalizarSesion, subirVideosSesion, mandarEventosSesion } from '../../lib/sesiones.ts'
import musica from '../../assets/juegos/surf/musica-fondo.mp3'

const HEADER_H = 48
const VOLUMEN_INICIAL = 0.4

// Fases del juego (cada una es un frame de Figma, ver pantallas.jsx):
//   instrucciones → calibracion → preparando → consigna → jugando → completado
// - calibracion: sobre un fondo liso, hasta que el paciente esté bien detectado y en el medio.
// - preparando: entran el fondo (fade de 5 s), las olas y la tabla; recién después empieza el juego.
// y desde completado "Seguir jugando" vuelve a consigna (otra ronda, otra sesión).
const CON_PAUSA = ['calibracion', 'preparando', 'consigna', 'jugando']
// La música suena en las mismas fases en que se puede pausar (arranca con el
// clic en "Estoy listo": el navegador no deja reproducir audio sin un gesto).
const CON_MUSICA = CON_PAUSA
// El mar y el cielo no aparecen hasta que el paciente está bien detectado
const CON_ESCENA = ['preparando', 'consigna', 'jugando', 'completado']

export default function GamePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const pacienteId = params.get('pacienteId')
  const sesionIdRef = useRef(null)
  const phaserRef   = useRef(null)
  const musicaRef   = useRef(null)
  const eventosRef  = useRef([])
  const cierreRef   = useRef(Promise.resolve()) // guardado de la ronda anterior
  const recorder = useSessionRecorder()

  const [fase, setFase] = useState('instrucciones')
  const [ronda, setRonda] = useState(1)
  const [puntos, setPuntos] = useState(0)
  const [tiempo, setTiempo] = useState(0) // segundos jugados, arranca en 0
  const [mensaje, setMensaje] = useState(null)
  const [pausado, setPausado] = useState(false)
  // Tamaño real del área de juego. Los canvas (silueta, Phaser) se dimensionan
  // con esto y no con window.innerHeight una sola vez al abrir: si la ventana
  // cambia (zoom, pantalla completa, barras del navegador) quedaban más chicos
  // que el área y cortaban el cuerpo con una línea recta.
  const areaRef = useRef(null)
  const [tam, setTam] = useState({ w: window.innerWidth, h: window.innerHeight - HEADER_H })
  const [volumen, setVolumen] = useState(VOLUMEN_INICIAL)
  const [silencio, setSilencio] = useState(false)

  // Arranca MediaPipe Pose con las dimensiones correctas del canvas de surf
  const { canvasRef: camaraCanvasRef, siluetaRef } = usePoseAI('surf', !pausado, HEADER_H)

  // Crea la sesión (solo si hay paciente seleccionado) + arranca la grabación
  // de los 3 videos. Espera a que termine de guardarse la ronda anterior
  // porque comparten el grabador.
  const iniciarSesion = () => {
    if (!pacienteId) return
    cierreRef.current
      .then(() => crearSesion(pacienteId, 'surf'))
      .then(s => {
        sesionIdRef.current = s.id
        setTimeout(() => {
          recorder.start({
            landmarksCanvas: camaraCanvasRef.current,
            gameCanvas: phaserRef.current?.getGameCanvas(),
          })
        }, 500)
      })
      .catch(console.warn)
  }

  // La sesión y las métricas arrancan con el juego, no con las instrucciones
  // ni la calibración (ahí el paciente todavía se está acomodando).
  useEffect(() => {
    if (fase !== 'consigna') return
    kinetixAI.reiniciarMetricas()
    window.kinetix?.empezar?.()
    iniciarSesion()
  }, [fase])

  // Eventos de la escena de Phaser
  useEffect(() => {
    const estado = (e) => {
      const d = e.detail
      setPuntos(d.puntos)
      setTiempo(d.tiempo)
      setMensaje(d.mensaje)
      // Al atrapar el primer pez deja de ser consigna y empieza el reloj
      if (d.cronometrando) setFase(f => (f === 'consigna' ? 'jugando' : f))
    }
    const punto = (e) => {
      eventosRef.current.push({ tipo: 'acierto', mensaje: textoMensaje(e.detail.mensaje) })
    }
    // Guarda resultados al terminar la ronda + sube videos y eventos
    const fin = (e) => {
      setFase('completado')
      const sesionId = sesionIdRef.current
      const eventos = eventosRef.current
      sesionIdRef.current = null
      eventosRef.current = []
      if (!sesionId) return

      finalizarSesion(sesionId, { juego: 'surf', ...e.detail }, kinetixAI.getMetricasResumen()).catch(console.warn)
      eventos.push({ tipo: 'fin_juego', datos: e.detail })
      cierreRef.current = recorder.stop()
        .then(videos => {
          subirVideosSesion(sesionId, videos).catch(console.warn)
          mandarEventosSesion(sesionId, eventos).catch(console.warn)
        })
        .catch(console.warn)
    }

    window.addEventListener('kinetix:surf', estado)
    window.addEventListener('kinetix:surf:punto', punto)
    window.addEventListener('kinetix:surf:fin', fin)
    return () => {
      window.removeEventListener('kinetix:surf', estado)
      window.removeEventListener('kinetix:surf:punto', punto)
      window.removeEventListener('kinetix:surf:fin', fin)
    }
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
  useEffect(() => { phaserRef.current?.redimensionar(tam.w, tam.h) }, [tam])

  // Música de fondo: suena mientras se juega, se calla al pausar y al terminar la ronda
  useEffect(() => {
    const audio = musicaRef.current
    if (!audio) return
    if (CON_MUSICA.includes(fase) && !pausado) audio.play().catch(() => {})
    else audio.pause()
  }, [fase, pausado])
  useEffect(() => {
    const audio = musicaRef.current
    if (!audio) return
    audio.volume = volumen
    audio.muted = silencio
  }, [volumen, silencio])

  // Mover el slider con la música silenciada la vuelve a activar; el botón
  // la reactiva con el volumen de antes (o el inicial si había quedado en 0).
  const cambiarVolumen = (v) => {
    setVolumen(v)
    setSilencio(v === 0)
  }
  const alternarSilencio = () => {
    if (silencio && volumen === 0) setVolumen(VOLUMEN_INICIAL)
    setSilencio(s => !s)
  }
  useEffect(() => {
    const audio = musicaRef.current
    return () => audio?.pause() // al salir del juego no puede quedar sonando
  }, [])

  const togglePausa = useCallback(() => {
    if (pausado) window.kinetix?.reanudar?.()
    else window.kinetix?.pausar?.()
    setPausado(p => !p)
  }, [pausado])

  const seguirJugando = () => {
    setRonda(r => r + 1)
    setFase('consigna')
  }

  return (
    <div className={`relative flex h-dvh flex-col overflow-hidden [font-variation-settings:'opsz'_14] ${fase === 'instrucciones' ? '' : 'bg-[linear-gradient(180deg,#141a63,#2b319c)]'}`}>
      {/* Cielo, nubes, olas y tabla (animados): cubren toda la pantalla, también detrás de la barra.
          Hasta que el paciente esté bien detectado hay solo un fondo liso; cuando termina de entrar
          todo, arranca el juego. */}
      <Escena activa={CON_ESCENA.includes(fase)} onEntro={() => setFase(f => (f === 'preparando' ? 'consigna' : f))} />
      <audio ref={musicaRef} src={musica} loop preload="auto" />

      <BarraSuperior
        conPausa={CON_PAUSA.includes(fase)}
        conSalir={fase !== 'completado'}
        pausado={pausado}
        onPausa={togglePausa}
        onSalir={() => navigate('/juego')}
      />

      {/* Área de juego */}
      <div ref={areaRef} className="relative flex-1 overflow-hidden">

        {/* Peces (canvas de Phaser, transparente) */}
        <PhaserGame ref={phaserRef} headerHeight={HEADER_H} />

        {/* Cuerpo del paciente recortado por segmentación, sobre el mar */}
        <canvas
          ref={siluetaRef}
          width={tam.w}
          height={tam.h}
          style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none' }}
        />

        {/* Cámara + esqueleto de MediaPipe. El diseño no la muestra, pero la
            grabación del video de landmarks necesita que el canvas se siga
            dibujando, así que queda invisible en vez de sacarla. */}
        <canvas
          ref={camaraCanvasRef}
          width={180}
          height={135}
          aria-hidden="true"
          style={{ position: 'absolute', bottom: 14, right: 14, opacity: 0, pointerEvents: 'none' }}
        />

        {fase !== 'instrucciones' && <Contadores puntos={puntos} tiempo={tiempo} />}
        {CON_MUSICA.includes(fase) && (
          <ControlMusica volumen={volumen} silencio={silencio} onVolumen={cambiarVolumen} onSilencio={alternarSilencio} />
        )}

        {fase === 'calibracion' && (
          <>
            <Consigna num={1} texto="Ponete en el centro, dentro de la silueta." />
            <GuiaSilueta
              pausado={pausado}
              onListo={(vista) => {
                kinetixAI.fijarVista(vista) // alinea (y si hace falta "aleja") la imagen del paciente con la silueta
                setFase('preparando')
              }}
            />
          </>
        )}
        {fase === 'preparando' && <Consigna num="✓" texto="¡Muy bien! Quedate ahí, ya empezamos." />}
        {fase === 'consigna' && <Consigna num={2} texto="Tocá los peces con tus manos." />}
        {fase === 'jugando' && mensaje && <Mensaje clave={mensaje} />}

        {fase === 'instrucciones' && <AntesDeEmpezar onListo={() => setFase('calibracion')} />}
        {fase === 'completado' && (
          <DesafioCompletado ronda={ronda} onSeguir={seguirJugando} onVolver={() => navigate('/juego')} />
        )}
      </div>
    </div>
  )
}
