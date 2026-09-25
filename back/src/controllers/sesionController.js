const sesionModel = require('../models/sesion')
const { uploadTo } = require('../utils/storage')

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

module.exports = { create, finalizar, listar, detalle, eventos, metricas, videos, metricasCrudas, videosDeSesion }
