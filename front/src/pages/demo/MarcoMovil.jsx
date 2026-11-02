import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './devices.min.css' // iPhone X en CSS puro (devices.css, MIT)
import './MarcoMovil.css'

// Medidas del iPhone X de devices.css: la pantalla es de 375×812 y el cuerpo, con el marco, de 427×864
const PANTALLA_W = 375
const PANTALLA_H = 812
const CUERPO_W = 427
const CUERPO_H = 864
const BARRA_ESTADO = 44 // franja de arriba que tapa el notch

const enMarco = () => window.self !== window.top
const esCelular = () => window.matchMedia('(pointer: coarse)').matches

// La demo se ve siempre en vertical, como en un celular.
// - En una pantalla de escritorio: la página va dentro de un iPhone (CSS) con la pantalla de 375×812. Es un iframe, así el
//   juego ve una ventana vertical de verdad (window.innerWidth/innerHeight) y no una pantalla ancha.
// - En un celular: va a pantalla completa, se pide la orientación vertical y, si el celular queda en horizontal, se
//   muestra un aviso para girarlo (ver MarcoMovil.css).
export default function MarcoMovil({ children }) {
  const { pathname } = useLocation()
  const [escala, setEscala] = useState(1)

  useEffect(() => {
    if (enMarco()) return
    if (esCelular()) {
      screen.orientation?.lock?.('portrait-primary').catch(() => {}) // solo funciona a pantalla completa en algunos navegadores
      return
    }
    const ajustar = () => setEscala(Math.min(1, (window.innerHeight - 48) / CUERPO_H))
    ajustar()
    window.addEventListener('resize', ajustar)
    return () => window.removeEventListener('resize', ajustar)
  }, [])

  // Dentro del marco (o en un celular) se muestra la página directamente
  if (enMarco() || esCelular()) {
    return (
      <>
        {children}
        <div className="girar-aviso">Girá el celular para jugar en vertical</div>
      </>
    )
  }

  return (
    <div className="marco-fondo">
      <div className="marco-escala" style={{ width: CUERPO_W * escala, height: CUERPO_H * escala }}>
        <div className="marvel-device iphone-x" style={{ transform: `scale(${escala})`, transformOrigin: 'top left' }}>
          <div className="notch">
            <div className="camera" />
            <div className="speaker" />
          </div>
          <div className="overflow">
            <div className="shadow shadow--tl" />
            <div className="shadow shadow--tr" />
            <div className="shadow shadow--bl" />
            <div className="shadow shadow--br" />
          </div>
          <div className="inner-shadow" />
          <div className="screen">
            {/* La barra de estado (notch) queda arriba y negra; el juego empieza debajo */}
            <div style={{ boxSizing: 'border-box', height: '100%', paddingTop: BARRA_ESTADO, background: '#000' }}>
              <iframe
                src={pathname}
                title="Demo de Kinetix"
                allow="camera"
                style={{ width: PANTALLA_W, height: PANTALLA_H - BARRA_ESTADO, border: 0, display: 'block' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
