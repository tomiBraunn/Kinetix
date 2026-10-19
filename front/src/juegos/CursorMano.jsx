// La mano del paciente como cursor sobre el área de juego: se levanta una mano, el círculo la sigue y,
// si se queda sobre un botón marcado con `data-mano`, lo elige (ver ia/manoCursor.js). Sirve para
// manejar el juego sin tocar la pantalla. Solo aparece cuando hay un botón para elegir, así durante el
// juego (las manos están ocupadas con los peces) no estorba. Los botones de salir o volver no se marcan:
// esos los hace el kinesiólogo con el mouse.
import { useEffect, useRef } from 'react'
import { kinetixAI } from '../ia/KinetixAI'
import { cursorDeMano, avanzarPermanencia, ESTADO_INICIAL } from '../ia/manoCursor'
import './cursorMano.css'

const SUAVIZADO = 0.4 // cuánto se acerca el círculo a la mano en cada cuadro (menos = más lento, menos temblor)
const MARGEN_PX = 12  // el botón se considera tocado un poco antes de llegar a su borde (px de pantalla)

export default function CursorMano({ activo, areaRef }) {
  const marcaRef = useRef(null)

  useEffect(() => {
    const area = areaRef.current
    const marca = marcaRef.current
    if (!activo || !area || !marca) return
    let raf
    let est = ESTADO_INICIAL
    let suave = null
    let resaltado = null
    const resaltar = (el) => {
      if (el === resaltado) return
      resaltado?.removeAttribute('data-mano-sobre')
      el?.setAttribute('data-mano-sobre', '')
      resaltado = el
    }

    const cuadro = () => {
      raf = requestAnimationFrame(cuadro)
      const botones = [...area.querySelectorAll('[data-mano]')]
      const c = botones.length ? cursorDeMano(kinetixAI.ultimosLandmarks, kinetixAI.aspecto()) : null
      if (!c) {
        marca.style.opacity = '0'
        suave = null
        est = ESTADO_INICIAL
        resaltar(null)
        return
      }
      suave = suave ? { x: suave.x + (c.x - suave.x) * SUAVIZADO, y: suave.y + (c.y - suave.y) * SUAVIZADO } : c

      // El círculo se ubica con el tamaño de diseño del área (clientWidth) y los botones se buscan con el
      // rectángulo que se ve en pantalla: con el área agrandada para el televisor no son lo mismo
      const r = area.getBoundingClientRect()
      const vx = r.left + suave.x * r.width
      const vy = r.top + suave.y * r.height
      const m = MARGEN_PX
      const objetivo = botones.find((b) => {
        const br = b.getBoundingClientRect()
        return vx >= br.left - m && vx <= br.right + m && vy >= br.top - m && vy <= br.bottom + m
      }) ?? null

      const paso = avanzarPermanencia(est, objetivo, performance.now())
      est = paso.est
      resaltar(objetivo)
      marca.style.opacity = '1'
      marca.style.left = `${suave.x * area.clientWidth}px`
      marca.style.top = `${suave.y * area.clientHeight}px`
      marca.style.setProperty('--progreso', String(paso.progreso))
      if (paso.dispara) objetivo.click()
    }
    raf = requestAnimationFrame(cuadro)
    return () => {
      cancelAnimationFrame(raf)
      resaltar(null)
      marca.style.opacity = '0'
    }
  }, [activo, areaRef])

  return (
    <div ref={marcaRef} aria-hidden="true" className="cursor-mano">
      <span className="material-symbols-rounded select-none text-[26px]">pan_tool</span>
    </div>
  )
}
