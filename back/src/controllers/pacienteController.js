const pacienteModel = require('../models/paciente');

async function create(req, res) {
  try {
    const {
      nombre, apellido, fecha_nacimiento, tipo_lesion, observaciones,
      dni, email_paciente, telefono, genero,
      contacto_emergencia_nombre, contacto_emergencia_telefono,
      fecha_inicio_rehabilitacion
    } = req.body;
    if (!nombre || !apellido) {
      return res.status(400).json({ error: 'nombre and apellido are required' });
    }
    const paciente = await pacienteModel.create({
      kinesiologo_id: req.userId,
      nombre,
      apellido,
      fecha_nacimiento,
      tipo_lesion,
      observaciones,
      dni,
      email_paciente,
      telefono,
      genero,
      contacto_emergencia_nombre,
      contacto_emergencia_telefono,
      fecha_inicio_rehabilitacion
    });
    res.status(201).json(paciente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function list(req, res) {
  try {
    const pacientes = await pacienteModel.findByKinesiologo(req.userId);
    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function get(req, res) {
  try {
    const paciente = await pacienteModel.findById(req.params.id);
    if (!paciente || paciente.kinesiologo_id !== req.userId) {
      return res.status(404).json({ error: 'Paciente not found' });
    }
    res.json(paciente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function update(req, res) {
  try {
    const existing = await pacienteModel.findById(req.params.id);
    if (!existing || existing.kinesiologo_id !== req.userId) {
      return res.status(404).json({ error: 'Paciente not found' });
    }
    const {
      nombre, apellido, fecha_nacimiento, tipo_lesion, observaciones, activo,
      dni, email_paciente, telefono, genero,
      contacto_emergencia_nombre, contacto_emergencia_telefono,
      fecha_inicio_rehabilitacion
    } = req.body;
    const paciente = await pacienteModel.update(req.params.id, {
      nombre, apellido, fecha_nacimiento, tipo_lesion, observaciones, activo,
      dni, email_paciente, telefono, genero,
      contacto_emergencia_nombre, contacto_emergencia_telefono,
      fecha_inicio_rehabilitacion
    });
    res.json(paciente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function remove(req, res) {
  try {
    const existing = await pacienteModel.findById(req.params.id);
    if (!existing || existing.kinesiologo_id !== req.userId) {
      return res.status(404).json({ error: 'Paciente not found' });
    }
    await pacienteModel.remove(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { create, list, get, update, remove };
