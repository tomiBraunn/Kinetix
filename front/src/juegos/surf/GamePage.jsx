import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PhaserGame from './PhaserGame'
import Escena from './Escena'
import {
  BarraSuperior, Contadores, ControlMusica, Consigna, Mensaje, GuiaSilueta, AntesDeEmpezar, DesafioCompletado, SelectorZona,
} from './pantallas'
import { textoMensaje, GUIA_SURF } from './mensajes'
import { compararRondas } from './analisis'
import { leerZona } from './curva'
import { vigilar, ESTADO_INICIAL } from '../../ia/movimiento'
import { usePoseAI } from '../../ia/usePoseAI'
import { kinetixAI } from '../../ia/KinetixAI'
import { useSessionRecorder } from '../../ia/useSessionRecorder'
import { crearSesion, finalizarSesion, subirVideosSesion, mandarEventosSesion } from '../../lib/sesiones.ts'
import { hablar, callar, desbloquear, useVoz } from '../../ia/voz'
import { sonar, desbloquearSonidos, silenciarEfectos } from '../../ia/sonidos'
import SelectorRutina from '../SelectorRutina'
import GuiaMascota from '../GuiaMascota'
import Mascota from '../Mascota'
import BotonVoz from '../BotonVoz'
import BotonGirarCamara from '../BotonGirarCamara'
import CursorMano from '../CursorMano'
import musica from '../../assets/juegos/surf/musica-fondo.mp3'

const HEADER_H = 48
const VOLUMEN_INICIAL = 0.4
const BAJA_MUSICA = 0.3 // mientras la voz habla, la música baja a esta fracción para que se entienda
const CELEBRA_MS = 900  // cuánto dura la pose de festejo del pez

// Lo que dice la consigna de cada fase: se muestra en pantalla y la voz lo lee
const CONSIGNAS = {
  calibracion: 'Ponete en el centro, dentro de la silueta.',
  preparando: '¡Muy bien! Quedate ahí, ya empezamos.',
  consigna: 'Tocá los peces con tus manos.',
}

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
  // "Antes de empezar" tiene dos etapas: armar la sesión (kinesiólogo) y la guía de la mascota sobre el mar, que ya está
  // entrando de fondo. Después se prende la cámara (calibración). Queda en true: el mar no vuelve a entrar.
  const [guiando, setGuiando] = useState(false)
  const [ronda, setRonda] = useState(1)
  const [puntos, setPuntos] = useState(0)
  const [meta, setMeta] = useState(null)             // cuántos peces hay que atrapar en esta ronda (lo que se eligió en "Antes de empezar")
  const [celebrando, setCelebrando] = useState(false) // el pez hace la pose de festejo después de cada acierto
  const [analisis, setAnalisis] = useState(null) // lo que analizó la IA en la ronda que terminó, comparado con la anterior
  const resumenPrevioRef = useRef(null)          // las métricas de la ronda anterior (solo de esta visita)
  const [aviso, setAviso] = useState(null)       // lo que dice la IA por su cuenta: 'alerta' (movió de más) o 'postura' (lo hace bien)
  const avisoTimerRef = useRef(null)
  const alertasRef = useRef(0)                   // cuántas alertas de movimiento hubo en la ronda
  const mensajeRef = useRef(null)                // el mensaje de la escena que se está mostrando, para no pisarlo
  const [sesionGuardada, setSesionGuardada] = useState(null) // la sesión de la ronda que terminó, para ir a verla en el panel
  const celebraTimerRef = useRef(null)
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
  // En "Antes de empezar" no hay nada que detectar: se ahorra el análisis (el modelo se va cargando igual)
  const { canvasRef: camaraCanvasRef, siluetaRef } = usePoseAI('surf', !pausado && fase !== 'instrucciones', HEADER_H)

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
    kinetixAI.fijarLineaBase() // dónde está parado: de ahí se mide si mueve de más los pies o la cadera
    alertasRef.current = 0
    window.kinetix?.empezar?.()
    iniciarSesion()
  }, [fase])

  // La IA vigila que se mueva solo con el tronco y los brazos (los pies y la cadera quietos). Si no, avisa; si lo
  // hace bien un buen rato, lo felicita. Mientras hay un mensaje de la escena no se le pisa (ver movimiento.js).
  useEffect(() => {
    mensajeRef.current = mensaje
  })
  useEffect(() => {
    if ((fase !== 'consigna' && fase !== 'jugando') || pausado) return
    let est = { ...ESTADO_INICIAL, ultimoMensaje: performance.now() }
    const id = setInterval(() => {
      const r = vigilar(est, kinetixAI.desplazamiento, performance.now(), !!mensajeRef.current)
      est = r.est
      if (!r.alerta && !r.refuerzo) return
      if (r.alerta) alertasRef.current += 1
      setAviso(r.alerta ? 'alerta' : 'postura')
      clearTimeout(avisoTimerRef.current)
      avisoTimerRef.current = setTimeout(() => setAviso(null), r.alerta ? 5000 : 3000)
    }, 150)
    return () => clearInterval(id)
  }, [fase, pausado])
  useEffect(() => () => clearTimeout(avisoTimerRef.current), [])

  // Eventos de la escena de Phaser
  useEffect(() => {
    const estado = (e) => {
      const d = e.detail
      setPuntos(d.puntos)
      setMeta(d.meta)
      setTiempo(d.tiempo)
      setMensaje(d.mensaje)
      // Al atrapar el primer pez deja de ser consigna y empieza el reloj
      if (d.cronometrando) setFase(f => (f === 'consigna' ? 'jugando' : f))
    }
    const punto = (e) => {
      eventosRef.current.push({ tipo: 'acierto', mensaje: textoMensaje(e.detail.mensaje) })
      sonar(e.detail.mensaje.startsWith('nivel') ? 'subida' : 'punto') // pasar de nivel suena distinto que atrapar un pez
      // El pez celebra un momento con cada acierto
      setCelebrando(true)
      clearTimeout(celebraTimerRef.current)
      celebraTimerRef.current = setTimeout(() => setCelebrando(false), CELEBRA_MS)
    }
    // Guarda resultados al terminar la ronda + sube videos y eventos
    const fin = (e) => {
      // El análisis se muestra al terminar cada ronda, haya o no sesión guardada
      const resumen = { ...kinetixAI.getMetricasResumen(), alertas_movimiento: alertasRef.current }
      sonar('fin')
      setAviso(null)
      setAnalisis(compararRondas(resumen, resumenPrevioRef.current))
      resumenPrevioRef.current = resumen
      setFase('completado')
      const sesionId = sesionIdRef.current
      setSesionGuardada(sesionId)
      const eventos = eventosRef.current
      sesionIdRef.current = null
      eventosRef.current = []
      if (!sesionId) return

      finalizarSesion(sesionId, { juego: 'surf', ...e.detail, rotacion_camara: kinetixAI.rotacion, alertas_movimiento: alertasRef.current, zona_aparicion: leerZona() }, resumen).catch(console.warn)
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
  const { hablando } = useVoz()
  // Mientras se calibra se ve la cámara entera (para entender el espacio); recién con el cuerpo bien detectado
  // pasa al cuerpo recortado sobre el mar
  useEffect(() => {
    kinetixAI.fijarCamaraCompleta(fase === 'calibracion')
    return () => kinetixAI.fijarCamaraCompleta(false)
  }, [fase])
  useEffect(() => {
    const audio = musicaRef.current
    if (!audio) return
    audio.volume = hablando ? volumen * BAJA_MUSICA : volumen
    audio.muted = silencio
  }, [volumen, silencio, hablando])
  // Los efectos de sonido siguen al botón de la música; al salir no puede quedar silenciado para el juego que viene
  useEffect(() => {
    silenciarEfectos(silencio)
    return () => silenciarEfectos(false)
  }, [silencio])

  // Voz: lee la consigna de cada fase (las pistas de la calibración las dice GuiaSilueta). En pausa se calla.
  useEffect(() => {
    if (pausado) callar()
    else if (CONSIGNAS[fase]) hablar(CONSIGNAS[fase])
  }, [fase, pausado])
  // Los mensajes de ánimo que aparecen jugando ("¡Excelente!", "¡Pasaste al nivel 2!") también se leen. El
  // desafío completado y "Antes de empezar" se leen solos (ver pantallas.jsx).
  useEffect(() => {
    if (fase === 'jugando' && mensaje && !pausado) hablar(textoMensaje(mensaje))
  }, [mensaje, fase, pausado])
  useEffect(() => {
    if (!aviso || pausado) return
    hablar(textoMensaje(aviso))
    sonar(aviso === 'alerta' ? 'aviso' : 'animo') // la alerta es un tono suave y bajo; el "muy bien", una campanita
  }, [aviso, pausado])
  useEffect(() => () => callar(), []) // al salir no puede quedar hablando
  useEffect(() => () => clearTimeout(celebraTimerRef.current), [])

  // El pez: invita a tocar mientras espera el primer pez ("atrapa"), festeja al entrar el mar y con cada acierto
  const poseDelPez = celebrando || fase === 'preparando' ? 'celebra' : fase === 'consigna' ? 'atrapa' : 'reposo'
  const pez = (ancho) => <Mascota especie="pez" pose={poseDelPez} habla={hablando} className={ancho} />

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
    setSesionGuardada(null)
    setFase('consigna')
  }

  return (
    <div className={`relative flex h-dvh flex-col overflow-hidden [font-variation-settings:'opsz'_14] ${fase === 'instrucciones' && !guiando ? '' : 'bg-[linear-gradient(180deg,#141a63,#2b319c)]'}`}>
      {/* Cielo, nubes, olas y tabla (animados): cubren toda la pantalla, también detrás de la barra.
          Hasta que el paciente esté bien detectado hay solo un fondo liso; cuando termina de entrar
          todo, arranca el juego. */}
      <Escena activa={guiando || CON_ESCENA.includes(fase)} onEntro={fase === 'preparando' ? () => setFase('consigna') : undefined} />
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

        {fase !== 'instrucciones' && <Contadores puntos={puntos} meta={meta} tiempo={tiempo} />}
        {CON_MUSICA.includes(fase) && (
          <ControlMusica volumen={volumen} silencio={silencio} onVolumen={cambiarVolumen} onSilencio={alternarSilencio} />
        )}

        <CursorMano activo={!pausado && fase !== 'instrucciones'} areaRef={areaRef} />
        {fase !== 'instrucciones' && <BotonVoz posicion="bottom-[61px]">{fase === 'calibracion' && <BotonGirarCamara />}</BotonVoz>}

        {fase === 'calibracion' && (
          <>
            <Consigna num={1} texto={CONSIGNAS.calibracion} mascota={pez('w-[130px]')} colaIzq={39} />
            <GuiaSilueta
              pausado={pausado}
              onListo={(vista) => {
                kinetixAI.fijarVista(vista) // alinea (y si hace falta "aleja") la imagen del paciente con la silueta
                setFase('preparando')
              }}
            />
          </>
        )}
        {fase === 'preparando' && <Consigna num="✓" texto={CONSIGNAS.preparando} mascota={pez('w-[130px]')} colaIzq={39} />}
        {fase === 'consigna' && !aviso && <Consigna num={2} texto={CONSIGNAS.consigna} mascota={pez('w-[130px]')} colaIzq={39} />}
        {(aviso || (fase === 'jugando' && mensaje)) && <Mensaje clave={aviso ?? mensaje} />}
        {/* Jugando no hay consigna: el pez sigue ahí, más chico, por encima del paciente y por debajo de los peces */}
        {fase === 'jugando' && (
          <div aria-hidden="true" className="pointer-events-none absolute left-[4px] top-[152px] z-[16]">{pez('w-[100px]')}</div>
        )}

        {fase === 'instrucciones' && !guiando && (
          <AntesDeEmpezar
            onListo={() => { desbloquear(); desbloquearSonidos(); setGuiando(true) }}
            extra={<><SelectorRutina juego="surf" /><SelectorZona /></>}
            mascota={<Mascota especie="pez" className="w-[150px]" />}
          />
        )}
        {fase === 'instrucciones' && guiando && (
          <GuiaMascota especie="pez" pasos={GUIA_SURF} onListo={() => setFase('calibracion')} onOmitir={() => setFase('calibracion')} />
        )}
        {fase === 'completado' && (
          <DesafioCompletado ronda={ronda} analisis={analisis} onSeguir={seguirJugando} onVolver={() => navigate('/juego')}
            onVerAnalisis={sesionGuardada ? () => navigate(`/sesiones/${sesionGuardada}`) : null} />
        )}
      </div>
    </div>
  )
}
