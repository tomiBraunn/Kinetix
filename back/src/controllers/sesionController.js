const sesionModel = require('../models/sesion')

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

module.exports = { create, finalizar }
