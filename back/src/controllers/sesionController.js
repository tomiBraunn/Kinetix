const sesionModel = require('../models/sesion')
const { uploadTo } = require('../utils/storage')
const supabase = require('../utils/supabase')
const { generarAnalisis } = require('../utils/nvidiaAI')

const VIDEOS_BUCKET = 'sesion-videos'

async function sesionDeKinesiologo(id, kinesiologo_id) {
  const sesion = await sesionModel.findById(id)
  return sesion && sesion.kinesiologo_id === kinesiologo_id ? sesion : null
}

async function create(req, res) {
  try {
    const { paciente_id, juego } = req.body
    if (!paciente_id || !juego) {
      return res.status(400).json({ error: 'paciente_id y juego son requeridos' })
    }
    const sesion = await sesionModel.create({
      paciente_id,
      kinesiologo_id: req.userId,
      juego,
    })
    res.status(201).json(sesion)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function finalizar(req, res) {
  try {
    const sesion = await sesionModel.findById(req.params.id)
    if (!sesion || sesion.kinesiologo_id !== req.userId) {
      return res.status(404).json({ error: 'Sesión no encontrada' })
    }
    const { duracion_segundos, metricas } = req.body
    await sesionModel.finalizar(req.params.id, { duracion_segundos, metricas })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function listar(req, res) {
  try {
    const paciente_id = req.query.pacienteId ?? null
    const sesiones = await sesionModel.listar({
      kinesiologo_id: req.userId,
      paciente_id,
      limit: 100,
    })
    res.json(sesiones)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function detalle(req, res) {
  try {
    const sesion = await sesionModel.findByIdConDetalle(req.params.id, req.userId)
    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada' })
    }
    res.json(sesion)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function eventos(req, res) {
  try {
    const sesion = await sesionDeKinesiologo(req.params.id, req.userId)
    if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' })

    const { eventos } = req.body
    if (!Array.isArray(eventos) || eventos.length === 0) {
      return res.status(400).json({ error: 'eventos debe ser un array no vacío' })
    }
    await sesionModel.crearEventos(sesion.id, eventos)
    res.status(201).json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function metricas(req, res) {
  try {
    const sesion = await sesionDeKinesiologo(req.params.id, req.userId)
    if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' })

    const { metricas } = req.body
    if (!Array.isArray(metricas) || metricas.length === 0) {
      return res.status(400).json({ error: 'metricas debe ser un array no vacío' })
    }
    await sesionModel.crearMetricas(sesion.id, metricas)
    res.status(201).json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function videos(req, res) {
  try {
    const sesion = await sesionDeKinesiologo(req.params.id, req.userId)
    if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' })

    const files = req.files || {}
    if (!files.crudo && !files.landmarks && !files.gameplay) {
      return res.status(400).json({ error: 'Debe incluir al menos un video (crudo, landmarks o gameplay)' })
    }

    const urls = {}
    if (files.crudo) urls.url_crudo = await uploadTo(VIDEOS_BUCKET, files.crudo[0], sesion.id)
    if (files.landmarks) urls.url_landmarks = await uploadTo(VIDEOS_BUCKET, files.landmarks[0], sesion.id)
    if (files.gameplay) urls.url_gameplay = await uploadTo(VIDEOS_BUCKET, files.gameplay[0], sesion.id)

    await sesionModel.guardarVideos(sesion.id, urls)
    res.status(201).json(urls)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const TIPOS_VIDEO = ['crudo', 'landmarks', 'gameplay']
const MIMES_VIDEO = { 'video/webm': 'webm', 'video/mp4': 'mp4' }

// Paso 1 de la subida directa: el navegador sube cada video a Supabase Storage
// con una URL firmada, sin pasar por la función serverless (Vercel corta los
// requests de más de 4.5 MB, y un video de 30s pesa más que eso).
async function urlsSubidaVideos(req, res) {
  try {
    const sesion = await sesionDeKinesiologo(req.params.id, req.userId)
    if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' })

    const pedidos = Object.entries(req.body?.videos || {})
      .filter(([tipo, mime]) => TIPOS_VIDEO.includes(tipo) && MIMES_VIDEO[mime])
    if (pedidos.length === 0) {
      return res.status(400).json({ error: 'Pedí al menos un video (crudo, landmarks o gameplay) en webm o mp4' })
    }

    const resultado = {}
    for (const [tipo, mime] of pedidos) {
      const path = `${sesion.id}/${tipo}-${Date.now()}.${MIMES_VIDEO[mime]}`
      const { data, error } = await supabase.storage.from(VIDEOS_BUCKET).createSignedUploadUrl(path)
      if (error) throw error
      resultado[tipo] = { path, signedUrl: data.signedUrl }
    }
    res.json(resultado)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Paso 2: el navegador avisa qué paths terminó de subir y se guardan las URLs.
async function confirmarVideos(req, res) {
  try {
    const sesion = await sesionDeKinesiologo(req.params.id, req.userId)
    if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' })

    const urls = {}
    for (const tipo of TIPOS_VIDEO) {
      const path = req.body?.[tipo]
      if (!path) continue
      if (typeof path !== 'string' || !path.startsWith(`${sesion.id}/`)) {
        return res.status(400).json({ error: `Path inválido para ${tipo}` })
      }
      urls[`url_${tipo}`] = supabase.storage.from(VIDEOS_BUCKET).getPublicUrl(path).data.publicUrl
    }
    if (Object.keys(urls).length === 0) return res.status(400).json({ error: 'No hay videos para confirmar' })

    await sesionModel.guardarVideos(sesion.id, urls)
    res.status(201).json(urls)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function metricasCrudas(req, res) {
  try {
    const sesion = await sesionDeKinesiologo(req.params.id, req.userId)
    if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' })
    const metricas = await sesionModel.metricasCrudas(sesion.id)
    res.json(metricas)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function analisisIA(req, res) {
  try {
    const sesion = await sesionModel.findByIdConDetalle(req.params.id, req.userId)
    if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' })

    const cacheado = sesion.metricas_sesion?.analisis_ia
    if (cacheado) return res.json({ analisis: cacheado })

    const analisis = await generarAnalisis(sesion)
    if (analisis) {
      // No await bloqueante de la respuesta: si el cacheo falla, el usuario
      // igual recibe el análisis ya generado (se vuelve a generar la próxima vez).
      sesionModel.guardarAnalisisIA(sesion.id, analisis).catch((err) => {
        console.error('[analisisIA] no se pudo cachear:', err.message)
      })
    }

    res.json({ analisis, error: analisis ? null : 'No se pudo generar el análisis de IA.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function videosDeSesion(req, res) {
  try {
    const sesion = await sesionDeKinesiologo(req.params.id, req.userId)
    if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' })
    const videos = await sesionModel.findVideos(sesion.id)
    res.json(videos)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { urlsSubidaVideos, confirmarVideos, create, finalizar, listar, detalle, eventos, metricas, videos, metricasCrudas, videosDeSesion, analisisIA }
