import { useEffect, useState } from 'react'
import CartelKinetix, { CARTEL_ALTO, CARTEL_ANCHO } from '../components/CartelKinetix'

// Pantalla del cartel de la feria: lo achica para que entre entero en la ventana (o en la pantalla del stand).
// Para imprimirlo a tamaño real, abrir /cartel?escala=1.
export default function Cartel() {
  const [escala, setEscala] = useState(1)

  useEffect(() => {
    const fija = Number(new URLSearchParams(window.location.search).get('escala'))
    const ajustar = () =>
      setEscala(fija > 0 ? fija : Math.min(window.innerWidth / CARTEL_ANCHO, window.innerHeight / CARTEL_ALTO))
    ajustar()
    window.addEventListener('resize', ajustar)
    return () => window.removeEventListener('resize', ajustar)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1387' }}>
      <CartelKinetix escala={escala} />
    </div>
  )
}
