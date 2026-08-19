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

module.exports = { create, finalizar, findById, listar }
