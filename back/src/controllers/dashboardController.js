const supabase = require('../utils/supabase');

async function resumen(req, res) {
  try {
    const kinesiologoId = req.userId;

    const [pacientesResult, pacientesActivosResult, sesionesHoyResult] = await Promise.all([
      supabase.from('pacientes').select('id', { count: 'exact' }).eq('kinesiologo_id', kinesiologoId),
      supabase.from('pacientes').select('id', { count: 'exact' }).eq('kinesiologo_id', kinesiologoId).eq('activo', true),
      supabase.from('sesiones').select('id', { count: 'exact' }).eq('kinesiologo_id', kinesiologoId).gte('iniciada_en', new Date().toISOString().slice(0, 10))
    ]);

    const total = pacientesResult.error ? null : pacientesResult.count;
    const activos = pacientesActivosResult.error ? null : pacientesActivosResult.count;
    const sesionesHoy = sesionesHoyResult.error ? null : sesionesHoyResult.count;

    res.json({ total_pacientes: total, pacientes_activos: activos, sesiones_hoy: sesionesHoy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { resumen };
