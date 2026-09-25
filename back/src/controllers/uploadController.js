const { uploadTo } = require('../utils/storage');

const AVATARS = 'avatars';
const FOTOS_PACIENTE = 'fotos-paciente';

async function avatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    const url = await uploadTo(AVATARS, req.file, req.userId);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function pacienteFoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    const url = await uploadTo(FOTOS_PACIENTE, req.file, req.userId);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { avatar, pacienteFoto };
