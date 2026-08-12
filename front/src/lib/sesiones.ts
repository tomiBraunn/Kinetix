import { api } from './api'
import { getToken } from './auth'

type Sesion = { id: string; paciente_id: string; juego: string; iniciada_en: string }

type MetricasSurf = {
  juego: 'surf'
  puntos: number
  duracion_segundos: number
}

type MetricasFlamenco = {
  juego: 'flamenco'
  mejor_tiempo_segundos: number
  intentos: number
  duracion_segundos: number
}

type MetricasEstrellas = {
  juego: 'estrellas'
  estrellas_alcanzadas: number
  movimientos_pies: number
  duracion_segundos: number
}

type Metricas = MetricasSurf | MetricasFlamenco | MetricasEstrellas

function token() {
  return getToken() ?? undefined
}

export async function crearSesion(paciente_id: string, juego: string): Promise<Sesion> {
  return api.post<Sesion>('/sesiones', { paciente_id, juego }, { token: token() })
}

export async function finalizarSesion(sesionId: string, metricas: Metricas): Promise<void> {
  await api.put(
    `/sesiones/${sesionId}/finalizar`,
    {
      duracion_segundos: metricas.duracion_segundos,
      metricas: {
        repeticiones_correctas:
          metricas.juego === 'surf'
            ? metricas.puntos
            : metricas.juego === 'flamenco'
              ? metricas.intentos
              : metricas.estrellas_alcanzadas,
        datos_ia_raw: metricas,
      },
    },
    { token: token() },
  )
}
