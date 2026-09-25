const supabase = require('../utils/supabase')

async function create({ paciente_id, kinesiologo_id, juego }) {
  const { data, error } = await supabase
    .from('sesiones')
    .insert({ paciente_id, kinesiologo_id, juego, estado: 'en_curso' })
    .select()
    .single()
  if (error) throw error
  return data
}

async function finalizar(id, { duracion_segundos, metricas }) {
  const { error: sesionError } = await supabase
    .from('sesiones')
    .update({
      finalizada_en: new Date().toISOString(),
      duracion_segundos,
      estado: 'finalizada',
    })
    .eq('id', id)
  if (sesionError) throw sesionError

  const { error: metError } = await supabase
    .from('metricas_sesion')
    .insert({
      sesion_id: id,
      repeticiones_correctas: metricas.repeticiones_correctas ?? 0,
      repeticiones_totales: metricas.repeticiones_totales ?? 0,
      estabilidad_score: metricas.estabilidad_score ?? null,
      datos_ia_raw: metricas.datos_ia_raw ?? null,
    })
  if (metError) throw metError
}

async function findById(id) {
  const { data, error } = await supabase
    .from('sesiones')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Sesiones de un kinesiólogo, opcionalmente filtradas por paciente
async function listar({ kinesiologo_id, paciente_id, limit = 50 }) {
  let q = supabase
    .from('sesiones')
    .select(`
      id, juego, estado, iniciada_en, finalizada_en, duracion_segundos,
      pacientes ( id, nombre, apellido ),
      metricas_sesion ( repeticiones_correctas, datos_ia_raw )
    `)
    .eq('kinesiologo_id', kinesiologo_id)
    .eq('estado', 'finalizada')
    .order('iniciada_en', { ascending: false })
    .limit(limit)

  if (paciente_id) q = q.eq('paciente_id', paciente_id)

  const { data, error } = await q
  if (error) throw error
  return data
}

// Detalle de una sesión con paciente y métricas resumidas (para la pantalla de resultados)
async function findByIdConDetalle(id, kinesiologo_id) {
  const { data, error } = await supabase
    .from('sesiones')
    .select(`
      id, juego, estado, iniciada_en, finalizada_en, duracion_segundos, notas,
      pacientes ( id, nombre, apellido ),
      metricas_sesion ( repeticiones_correctas, repeticiones_totales, precision_porcentaje, rango_movimiento_max, rango_movimiento_avg, estabilidad_score, datos_ia_raw ),
      videos_sesion ( url_crudo, url_landmarks, url_gameplay )
    `)
    .eq('id', id)
    .eq('kinesiologo_id', kinesiologo_id)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Timeline de eventos/feedback de una sesión (S5)
async function crearEventos(sesion_id, eventos) {
  const rows = eventos.map(e => ({
    sesion_id,
    tipo: e.tipo,
    mensaje: e.mensaje ?? null,
    datos: e.datos ?? null,
  }))
  const { error } = await supabase.from('eventos_sesion').insert(rows)
  if (error) throw error
}

// Métricas crudas en batch (S5) — mismo insert sirve para 1 o varias filas por lote
async function crearMetricas(sesion_id, metricas) {
  const rows = metricas.map(m => ({
    sesion_id,
    tipo: m.tipo,
    valor: m.valor,
    unidad: m.unidad ?? null,
  }))
  const { error } = await supabase.from('metricas').insert(rows)
  if (error) throw error
}

// Guarda 1-3 URLs de video de la sesión; upsert para que puedan llegar en momentos distintos
async function guardarVideos(sesion_id, urls) {
  const { error } = await supabase
    .from('videos_sesion')
    .upsert({ sesion_id, ...urls }, { onConflict: 'sesion_id' })
  if (error) throw error
}

// Métricas crudas de una sesión, ordenadas en el tiempo (S6, para gráficos detallados)
async function metricasCrudas(sesion_id) {
  const { data, error } = await supabase
    .from('metricas')
    .select('tipo, valor, unidad, timestamp')
    .eq('sesion_id', sesion_id)
    .order('timestamp', { ascending: true })
  if (error) throw error
  return data
}

// URLs de video de una sesión (S6)
async function findVideos(sesion_id) {
  const { data, error } = await supabase
    .from('videos_sesion')
    .select('url_crudo, url_landmarks, url_gameplay')
    .eq('sesion_id', sesion_id)
    .maybeSingle()
  if (error) throw error
  return data ?? { url_crudo: null, url_landmarks: null, url_gameplay: null }
}

// Promedios globales del kinesiólogo sobre sus sesiones finalizadas (S6)
async function estadisticasGlobales(kinesiologo_id) {
  const { data, error } = await supabase
    .from('sesiones')
    .select('metricas_sesion ( precision_porcentaje, rango_movimiento_avg )')
    .eq('kinesiologo_id', kinesiologo_id)
    .eq('estado', 'finalizada')
  if (error) throw error

  const promedio = (valores) => valores.length
    ? valores.reduce((a, b) => a + b, 0) / valores.length
    : null

  const precisiones = data.map(s => s.metricas_sesion?.precision_porcentaje).filter(v => v != null)
  const rangos = data.map(s => s.metricas_sesion?.rango_movimiento_avg).filter(v => v != null)

  return {
    sesiones_totales: data.length,
    precision_promedio: promedio(precisiones),
    rango_promedio: promedio(rangos),
  }
}

module.exports = {
  create, finalizar, findById, findByIdConDetalle, listar,
  crearEventos, crearMetricas, guardarVideos,
  metricasCrudas, findVideos, estadisticasGlobales,
}
