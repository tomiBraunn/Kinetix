// Aviso arriba de la pantalla cuando la cámara o el detector de movimientos no andan, con el motivo y "Reintentar".
// Antes el error iba solo a la consola y el paciente veía una pantalla sin cámara y sin explicación (en la app de
// Expo pasaba sin que nadie supiera por qué). Qué falla y por qué lo cuenta estadoCamara.js. Va dentro de la
// pantalla de cada juego (que es `relative`), por encima de todo lo demás, pero debajo de la fila de arriba ("Saltar guía",
// el reloj, el botón de voz): esos siguen a mano.
import { useEffect, useState } from 'react'
import { useEstadoCamara, problemaActual, describirFalla, pedirReintento } from '../ia/estadoCamara'
import { openCamera, closeCamera, diagnosticoCamara } from '../ia/CameraStream'
import { esAppExpo } from '../lib/appMovil'

const ESPERA_LARGA_MS = 6000 // pidiendo la cámara hace tanto: seguro hay un cartel de permiso esperando

function reintentar() {
  closeCamera()
  pedirReintento() // usePoseAI vuelve a arrancar el detector
  openCamera().catch(() => { /* el motivo se muestra en el aviso */ })
}

export default function AvisoCamara() {
  const estado = useEstadoCamara()
  const [esperaLarga, setEsperaLarga] = useState(false)
  const pidiendo = estado.pidiendoDesde != null
  useEffect(() => {
    if (!pidiendo) return
    const id = setTimeout(() => setEsperaLarga(true), ESPERA_LARGA_MS)
    return () => { clearTimeout(id); setEsperaLarga(false) }
  }, [pidiendo, estado.pidiendoDesde])

  const problema = problemaActual(estado)
  // Mientras hay un aviso se leen datos del aparato (permiso, cámaras) para mostrarlos: sirven para saber qué pasa
  const hayAviso = !!problema || (pidiendo && esperaLarga)
  const [diagnostico, setDiagnostico] = useState('')
  useEffect(() => {
    if (!hayAviso) return
    let vivo = true
    diagnosticoCamara().then((d) => { if (vivo) setDiagnostico(d) })
    return () => { vivo = false }
  }, [hayAviso])
  let titulo, ayuda, detalle
  if (problema) {
    ({ titulo, ayuda, detalle } = describirFalla(problema.etapa, problema.error, esAppExpo))
  } else if (pidiendo && esperaLarga) {
    titulo = 'Esperando el permiso de la cámara'
    ayuda = 'Si te apareció un cartel pidiendo permiso, aceptalo.'
  } else {
    return null
  }

  return (
    <div role="alert" className="pointer-events-none absolute inset-x-0 top-[108px] z-50 mx-auto max-w-[402px] px-[15px]">
      <div className="pointer-events-auto rounded-[16px] border-[1.5px] border-[#d97706] bg-[#fffbeb] p-3.5 text-primary-dark shadow-[0_4px_10px_rgba(0,0,0,0.25)]">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-rounded select-none text-[26px] text-[#b45309]" aria-hidden="true">videocam_off</span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold leading-[21px]">{titulo}</p>
            <p className="mt-0.5 text-[14px] leading-[19px]">{ayuda}</p>
            {detalle && <p className="mt-1 break-words text-[11px] leading-[15px] text-[#92400e]">{detalle}</p>}
            {diagnostico && <p className="break-words text-[11px] leading-[15px] text-[#92400e]">{diagnostico}</p>}
          </div>
        </div>
        {problema && (
          <button type="button" onClick={reintentar} className="mt-2.5 h-[42px] w-full rounded-full bg-[#b11c6c] text-[16px] font-bold text-white">
            Reintentar
          </button>
        )}
      </div>
    </div>
  )
}
