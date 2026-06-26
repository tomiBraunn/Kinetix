const supabase = require('../utils/supabase');

const AVATARS = 'avatars';
const FOTOS_PACIENTE = 'fotos-paciente';

const TEN_YEARS = 315360000;

async function uploadTo(bucket, file, userId) {
  const ext = file.originalname.split('.').pop() || 'png';
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) throw error;

  const { data, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(fileName, TEN_YEARS);

  if (signedError) throw signedError;
  return data.signedUrl;
}

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
