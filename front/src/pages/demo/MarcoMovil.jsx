import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MockFrame } from 'react-mockframe'
import 'react-mockframe/styles/mockframe-iphones.css'
import './MarcoMovil.css'

// Medidas del iPhone 18 Pro de react-mockframe (MIT): la pantalla es de 402×874 y el cuerpo, con el marco, un poco más
const PANTALLA_W = 402
const PANTALLA_H = 874
const ANCHO_CUERPO = 434 // el iPhone con su marco, para escalarlo a la ventana
const ALTO_CUERPO = 905

const enMarco = () => window.self !== window.top
const esCelular = () => window.matchMedia('(pointer: coarse)').matches

// La demo se ve siempre en vertical, como en un celular.
// - En una pantalla de escritorio: la página va dentro de un iPhone 18 Pro con la pantalla de 402×874. Es un iframe, así el
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
    const ajustar = () => setEscala(Math.min(1, (window.innerHeight - 48) / ALTO_CUERPO))
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
      {/* react-mockframe escala con transform y no achica su caja: este contenedor ocupa el tamaño ya escalado */}
      <div className="marco-escala" style={{ width: ANCHO_CUERPO * escala, height: ALTO_CUERPO * escala }}>
        <div className="marco-centro">
          <MockFrame device="iPhone 18 Pro" color="black" zoom={escala}>
            {/* El juego ocupa toda la pantalla; la Dynamic Island queda encima, en el centro de arriba */}
            <iframe
              src={pathname}
              title="Demo de Kinetix"
              allow="camera"
              style={{ width: PANTALLA_W, height: PANTALLA_H, border: 0, display: 'block' }}
            />
          </MockFrame>
        </div>
      </div>
    </div>
  )
}
